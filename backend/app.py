from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from utils import validate_features, process_csv_batch, extract_audio_features
from model_loader import ModelHandler
import logging
import os
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize model handler
model_handler = ModelHandler()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Quick model availability check
        model_status = model_handler.is_model_loaded()
        return jsonify({
            "status": "healthy",
            "model_loaded": model_status,
            "message": "Server is running"
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "message": str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Single prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({"error": "Missing features in request"}), 400
        
        features = data['features']
        
        # Validate required features
        validation_result = validate_features(features)
        if not validation_result['valid']:
            return jsonify({"error": validation_result['message']}), 400
        
        # Make prediction
        result = model_handler.predict_single(features)
        
        return jsonify(result), 200
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/predict_csv', methods=['POST'])
def predict_csv():
    """Batch prediction endpoint for CSV data"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '' or not file.filename.endswith('.csv'):
            return jsonify({"error": "Please provide a valid CSV file"}), 400
        
        # Process CSV file
        df = pd.read_csv(file)
        
        # Validate and process batch data
        batch_results = process_csv_batch(df, model_handler)
        
        return jsonify({
            "predictions": batch_results['predictions'],
            "total_records": batch_results['total_records'],
            "successful_predictions": batch_results['successful_predictions'],
            "failed_predictions": batch_results['failed_predictions']
        }), 200
        
    except pd.errors.EmptyDataError:
        return jsonify({"error": "Empty CSV file"}), 400
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({"error": "Error processing CSV file"}), 500

@app.route('/predict_audio', methods=['POST'])
def predict_audio():
    """Endpoint for audio-based prediction"""
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
            os.remove(temp_path)
            
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Audio prediction error: {str(e)}")
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get model information and expected features"""
    try:
        info = model_handler.get_model_info()
        return jsonify(info), 200
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        return jsonify({"error": "Could not retrieve model information"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)