from flask import jsonify
import pandas as pd
from .batch_helper import process_csv_batch, parse_docx_to_df, parse_pdf_to_df, parse_doc_to_df
import re

def parse_file_data(request):
    """
    Parse a file and return the raw data (headers and rows) for preview.
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        filename = file.filename.lower()
        
        try:
             # Reuse logic from predict_batch
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith('.json'):
                df = pd.read_json(file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            elif filename.endswith('.docx'):
                df = parse_docx_to_df(file)
            elif filename.endswith('.pdf'):
                df = parse_pdf_to_df(file)
            elif filename.endswith('.doc'):
                df = parse_doc_to_df(file)
            else:
                return jsonify({"error": "Unsupported file format."}), 400
            
            if df.empty:
                 return jsonify({"headers": [], "data": [], "count": 0}), 200

            # Replace NaNs with None/null for JSON serialization
            df = df.replace({np.nan: None})
            
            # Limit rows for preview if too large (e.g. 100 rows)
            # But user might want to know total count. 
            # Let's send up to 50 rows for preview, but return full count.
            preview_df = df.head(50)
            
            data = preview_df.to_dict(orient='records')
            headers = list(df.columns)
            
            return jsonify({
                "headers": headers, 
                "data": data, 
                "count": len(df)
            }), 200

        except Exception as e:
            logger.error(f"Parse error: {str(e)}")
            return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400

    except Exception as e:
        logger.error(f"Parse endpoint error: {str(e)}")
        return jsonify({"error": "Error processing file"}), 500
import numpy as np
import os
import uuid
import logging
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

from utils import validate_features, process_csv_batch, extract_audio_features
from model_loader import ModelHandler

# Load env variables
load_dotenv()

# Initialize Logging
logger = logging.getLogger(__name__)

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase_admin: Client = None
if url and key:
    try:
        supabase_admin = create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

# Initialize Model Handler
model_handler = ModelHandler()
_assessment_insight_generator = None
_assessment_insight_model = None


def _parse_insight_text(raw_text):
    lines = raw_text.splitlines()
    parsed = []
    for line in lines:
        clean = line.strip().lstrip("-").lstrip("*").strip()
        clean = re.sub(r"^\d+\.\s*", "", clean)
        if clean and len(clean) > 18:
            parsed.append(clean)

    deduped = []
    seen = set()
    for insight in parsed:
        k = insight.lower()
        if k not in seen:
            seen.add(k)
            deduped.append(insight)
        if len(deduped) == 3:
            break
    return deduped


def _fallback_assessment_insights(result, features):
    probability = float(result.get('pd_probability', 0.0) or 0.0)
    risk = "high" if probability >= 0.65 else "moderate" if probability >= 0.35 else "low"
    top_features = result.get("top_features", []) or []
    dominant = top_features[0].get("name", "tremor_score").replace('_', ' ') if top_features else "tremor score"

    return [
        f"Overall risk appears {risk} with PD probability at {probability * 100:.1f}% for this assessment.",
        f"The strongest contributor in this case is {dominant}, indicating this feature drove the model decision most.",
        f"Model agreement check: RF {float(result.get('pd_probability_rf', 0) or 0) * 100:.1f}%, SVM {float(result.get('pd_probability_svm', 0) or 0) * 100:.1f}%, KNN {float(result.get('pd_probability_knn', 0) or 0) * 100:.1f}%, DT {float(result.get('pd_probability_dt', 0) or 0) * 100:.1f}%.",
    ]


def _generate_assessment_insights(result, features):
    global _assessment_insight_generator, _assessment_insight_model

    model_id = os.environ.get("HF_INSIGHTS_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACEHUB_API_TOKEN")

    if not hf_token:
        return _fallback_assessment_insights(result, features), "fallback"

    prompt = (
        "You are a clinical ML assistant. Generate exactly 3 concise actionable insights for one Parkinson's assessment.\n"
        f"PD probability: {float(result.get('pd_probability', 0) or 0) * 100:.2f}%\n"
        f"RF: {float(result.get('pd_probability_rf', 0) or 0) * 100:.2f}%\n"
        f"SVM: {float(result.get('pd_probability_svm', 0) or 0) * 100:.2f}%\n"
        f"KNN: {float(result.get('pd_probability_knn', 0) or 0) * 100:.2f}%\n"
        f"DT: {float(result.get('pd_probability_dt', 0) or 0) * 100:.2f}%\n"
        f"Age: {features.get('age')}, Tremor: {features.get('tremor_score')}, Handwriting: {features.get('handwriting_score')}, "
        f"Jitter: {features.get('jitter_local')}, Shimmer: {features.get('shimmer_local')}, Bradykinesia: {features.get('bradykinesia', 0)}, Rigidity: {features.get('rigidity', 0)}.\n"
        "Format:\n1. ...\n2. ...\n3. ..."
    )

    try:
        from transformers import pipeline

        if _assessment_insight_generator is None or _assessment_insight_model != model_id:
            _assessment_insight_generator = pipeline(
                "text-generation",
                model=model_id,
                token=hf_token,
            )
            _assessment_insight_model = model_id

        output = _assessment_insight_generator(
            prompt,
            max_new_tokens=180,
            do_sample=False,
            return_full_text=False,
        )
        raw_text = output[0].get("generated_text", "") if output else ""
        insights = _parse_insight_text(raw_text)
        if len(insights) != 3:
            raise ValueError("Could not parse exactly 3 insights")

        return insights, f"huggingface:{model_id}"
    except Exception as e:
        logger.warning(f"Single-assessment HF insight generation failed. Using fallback. Error: {e}")
        return _fallback_assessment_insights(result, features), "fallback"

def get_model_info():
    """Get model information and expected features"""
    try:
        return jsonify(model_handler.get_model_info()), 200
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        return jsonify({"error": "Could not retrieve model information"}), 500

def predict_single(data):
    """
    Handle single prediction request and save result to DB.
    Expects `user_id` in data if saving is required.
    """
    try:
        if not data or 'features' not in data:
            return jsonify({"error": "Missing features in request"}), 400
        
        features = data['features']
        user_id = data.get('user_id') 
        
        # Validate required features
        validation_result = validate_features(features)
        if not validation_result['valid']:
            return jsonify({"error": validation_result['message']}), 400
        
        # Make prediction
        result = model_handler.predict_single(features)

        insights, insight_source = _generate_assessment_insights(result, features)
        result["insights"] = insights[:3]
        result["insight_source"] = insight_source
        result["generated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Save to DB if user_id is provided
        if user_id and supabase_admin:
            try:
                db_record = {
                    "user_id": user_id,
                    "age": features.get('age'),
                    "tremor_score": features.get('tremor_score'),
                    "handwriting_score": features.get('handwriting_score'),
                    "jitter_local": features.get('jitter_local'),
                    "shimmer_local": features.get('shimmer_local'),
                    "bradykinesia": features.get('bradykinesia', 0),
                    "rigidity": features.get('rigidity', 0),
                    "pd_probability": result.get('pd_probability'),
                    "pd_probability_rf": result.get('pd_probability_rf'),
                    "pd_probability_svm": result.get('pd_probability_svm'),
                    "pd_probability_knn": result.get('pd_probability_knn'),
                    "pd_probability_dt": result.get('pd_probability_dt'),
                    "prediction_status": "High Risk" if result.get('pd_probability') > 0.5 else "Low Risk",
                    "top_features": result.get('top_features', [])
                }
                supabase_admin.from_("clinical_assessments").insert(db_record).execute()
                logger.info(f"Clinical assessment saved for user {user_id}")
                result['db_status'] = 'saved'
            except Exception as db_err:
                logger.error(f"Failed to save assessment to DB: {db_err}")
                result['db_status'] = f'failed: {str(db_err)}'
        else:
            result['db_status'] = 'skipped (no user_id)'
        
        return jsonify(result), 200
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def predict_batch(request):
    """
    Handle batch prediction from CSV/Excel and save results to DB.
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id') # Get user_id from form data
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        filename = file.filename.lower()
        
        # Determine file type and load data

        # Determine file type and load data
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith('.json'):
                df = pd.read_json(file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            elif filename.endswith('.docx'):
                df = parse_docx_to_df(file)
            elif filename.endswith('.pdf'):
                df = parse_pdf_to_df(file)
            elif filename.endswith('.doc'):
                df = parse_doc_to_df(file)
                if df.empty:
                     return jsonify({"error": "Could not extract data from .doc file. Please ensure it contains clear text or save as .docx."}), 400
            else:
                return jsonify({"error": "Unsupported file format."}), 400
            
            if df.empty:
                 return jsonify({"error": "No data found in file"}), 400
                 
        except Exception as e:
            logger.error(f"Error parsing file {filename}: {str(e)}")
            return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400
        
        # Validate and process batch data
        batch_results = process_csv_batch(df, model_handler)
        
        # Save to DB if user_id is provided
        if user_id and supabase_admin:
            try:
                db_record = {
                    "user_id": user_id,
                    "filename": file.filename,
                    "total_records": batch_results['total_records'],
                    "successful_predictions": batch_results['successful_predictions'],
                    "failed_predictions": batch_results['failed_predictions'],
                    "results_json": batch_results, # Store full result
                    "status": "completed"
                }
                supabase_admin.from_("batch_process_results").insert(db_record).execute()
                logger.info(f"Batch results saved for user {user_id}")
            except Exception as db_err:
                logger.error(f"Failed to save batch results to DB: {db_err}")

        return jsonify({
            "predictions": batch_results['predictions'],
            "total_records": batch_results['total_records'],
            "successful_predictions": batch_results['successful_predictions'],
            "failed_predictions": batch_results['failed_predictions']
        }), 200
        
    except pd.errors.EmptyDataError:
        return jsonify({"error": "Empty file provided"}), 400
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({"error": "Error processing batch file"}), 500

def predict_audio_file(request):
    """
    Handle audio file prediction.
    User asked NOT to store results for this yet, so we just predict.
    """
    temp_path = None
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        # Save temp file
        temp_filename = f"temp_{uuid.uuid4()}.wav"
        temp_path = os.path.join("temp", temp_filename)
        os.makedirs("temp", exist_ok=True)
        file.save(temp_path)
        
        # Extract features
        audio_features = extract_audio_features(temp_path)
        
        # Default value: Age=60, Tremor=0, Handwriting=0 (Assume healthy if not provided)
        features = {
            'age': float(request.form.get('age', 60)),
            'tremor_score': float(request.form.get('tremor_score', 0)),
            'handwriting_score': float(request.form.get('handwriting_score', 0)),
            'jitter_local': audio_features['jitter_local'],
            'shimmer_local': audio_features['shimmer_local']
        }
        
        # Predict
        result = model_handler.predict_single(features)
        
        # Clean up
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
            
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Audio prediction error: {str(e)}")
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        return jsonify({"error": str(e)}), 500

def get_benchmarks():
    """
    Retrieve aggregate statistics for clinical features from the database
    to populate the Comparative Health Benchmarks box plot.
    """
    try:
        if not supabase_admin:
            # Fallback mock data if DB not connected
            return jsonify({"error": "Database connection unavailable"}), 503

        # Fetch all relevant columns
        response = supabase_admin.from_("clinical_assessments").select(
            "tremor_score, rigidity, bradykinesia, jitter_local, shimmer_local, handwriting_score"
        ).execute()
        
        data = response.data
        if not data:
             return jsonify({"error": "No historical data available"}), 404

        df = pd.DataFrame(data)
        
        # Calculate stats for each feature
        benchmarks = []
        
        # Map DB columns to Frontend display names
        feature_map = {
            'tremor_score': 'Tremor',
            'rigidity': 'Rigidity',
            'bradykinesia': 'Bradykinesia',
            'jitter_local': 'Voice Jitter',
            'shimmer_local': 'Voice Shimmer', # Added Shimmer
            'handwriting_score': 'Micrographia'
        }
        
        for col, display_name in feature_map.items():
            if col in df.columns:
                series = df[col]
                # Filter out nulls/zeros if needed, preserving valid 0s (symptom free)
                # Assuming data is clean.
                
                # Calculate quartiles
                stats = series.describe(percentiles=[0.25, 0.5, 0.75])
                
                # normalize jitter/shimmer for display (if stored as absolute 0-1, multiply by 100 for graph?)
                # The graph expects 0-100 scale.
                # Tremor/Rigidity are 0-4. Need to normalize to 0-100?
                # The graph axis says "Percentile Score (0-100)". 
                # If existing graph logic maps 0-4 to 0-100, we should do same.
                # Let's just return raw stats and let frontend normalize, OR normalize here.
                # Frontend logic for BarChart was: (score / 4) * 100 for motor.
                
                scale_factor = 1
                if col in ['tremor_score', 'rigidity', 'bradykinesia', 'handwriting_score']:
                    scale_factor = (100 / 4)
                elif col in ['jitter_local', 'shimmer_local']:
                    # Assuming stored as absolute (0-1), map to 0-100
                    scale_factor = 1000 # Jitter is usually < 0.01 (1%), let's say max is 1% -> 100 on graph?? 
                    # Wait, previous frontend code did: (jitter / 2) * 100. 
                    # If jitter is 0.01 (1%), result is (0.01/2)*100 = 0.5. Too small.
                    # Let's stick to returning raw Describe values and frontend handles scaling.
                    # Actually, for boxplot it's easier to return "plot ready" values.
                    pass 

                # Re-calculating with normalization for the 0-100 scale visualization
                # For simplicity, let's normalize to 0-100 range based on typical max values.
                # Tremor/Rigidity/Brady/Handwriting: Max 4
                # Jitter: typical max ~0.01 (1%). Let's map 0.02 to 100?
                # Shimmer: typical max ~0.05 (5%).
                
                # Let's use a simpler approach: Return the raw distribution, frontend decides usage.
                # Actually user wants "Composition of risk contributors" which is different.
                # This is for "Comparative Health Benchmarks".
                
                # Let's just normalize to 0-100 for the generic axis.
                def normalize(x, col_name):
                    if col_name in ['tremor_score', 'rigidity', 'bradykinesia', 'handwriting_score']:
                         return min(100, (x / 4) * 100)
                    if col_name == 'jitter_local':
                        return min(100, x * 100 * 50) # Scale up small absolute values
                    if col_name == 'shimmer_local':
                        return min(100, x * 100 * 20)
                    return x

                benchmarks.append({
                    "name": display_name,
                    "min": normalize(series.min(), col),
                    "q1": normalize(series.quantile(0.25), col),
                    "median": normalize(series.median(), col),
                    "q3": normalize(series.quantile(0.75), col),
                    "max": normalize(series.max(), col),
                    "points": [normalize(x, col) for x in series.sample(n=min(20, len(series))).tolist()] # Random sample for dots
                })
                
        return jsonify(benchmarks), 200

    except Exception as e:
        logger.error(f"Benchmark error: {str(e)}")
        return jsonify({"error": str(e)}), 500
