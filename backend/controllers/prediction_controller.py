from flask import jsonify
import pandas as pd
import numpy as np
import os
import uuid
import logging
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
                    "prediction_status": "High Risk" if result.get('pd_probability') > 0.5 else "Low Risk",
                    "top_features": result.get('top_features', [])
                }
                supabase_admin.from_("clinical_assessments").insert(db_record).execute()
                logger.info(f"Clinical assessment saved for user {user_id}")
            except Exception as db_err:
                logger.error(f"Failed to save assessment to DB: {db_err}")
                # Don't fail the request if DB save fails, but maybe warn?
        
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
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith('.json'):
                df = pd.read_json(file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            elif filename.endswith(('.doc', '.docx')):
                return jsonify({"error": "Word documents are not currently supported for automated data extraction."}), 400
            else:
                return jsonify({"error": "Unsupported file format."}), 400
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
