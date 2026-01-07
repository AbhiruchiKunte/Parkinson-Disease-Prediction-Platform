import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import librosa
import os
import sys
import importlib

def validate_features(features):
    """Validate input features"""
    required_features = ['age', 'tremor_score', 'handwriting_score', 'jitter_local', 'shimmer_local']
    
    # Check if all required features are present
    missing_features = [f for f in required_features if f not in features]
    if missing_features:
        return {
            'valid': False, 
            'message': f"Missing required features: {missing_features}"
        }
    
    # Validate data types and ranges
    try:
        age = float(features['age'])
        if not 0 <= age <= 120:
            return {'valid': False, 'message': "Age must be between 0 and 120"}
        
        tremor_score = float(features['tremor_score'])
        if not 0 <= tremor_score <= 5:
            return {'valid': False, 'message': "Tremor score must be between 0 and 5"}
        
        handwriting_score = float(features['handwriting_score'])
        if not 0 <= handwriting_score <= 5:
            return {'valid': False, 'message': "Handwriting score must be between 0 and 5"}
        
        jitter_local = float(features['jitter_local'])
        if jitter_local < 0:
            return {'valid': False, 'message': "Jitter local must be non-negative"}
        
        shimmer_local = float(features['shimmer_local'])
        if shimmer_local < 0:
            return {'valid': False, 'message': "Shimmer local must be non-negative"}
        
    except (ValueError, TypeError):
        return {'valid': False, 'message': "All features must be numeric values"}
    
    return {'valid': True, 'message': "Valid features"}

def extract_audio_features(file_path):
    """Extract jitter and shimmer from audio file"""
    try:
        # Load audio file
        y, sr = librosa.load(file_path, duration=3)
        
        # Calculate features (Simplified approximation for demo compatibility)
        # Real Jitter/Shimmer requires fundamental frequency analysis (F0)
        
        # 1. Pitch (F0)
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
        f0 = f0[~np.isnan(f0)]
        
        if len(f0) == 0:
            return {'jitter_local': 0.0, 'shimmer_local': 0.0}
            
        # 2. Jitter (local) - variation in pitch
        jitter_local = np.mean(np.abs(np.diff(f0))) / np.mean(f0) if np.mean(f0) > 0 else 0
        
        # 3. Shimmer (local) - variation in amplitude
        # Calculate RMS energy
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=hop_length, hop_length=hop_length)[0]
        shimmer_local = np.mean(np.abs(np.diff(rms))) / np.mean(rms) if np.mean(rms) > 0 else 0
        
        return {
            'jitter_local': float(jitter_local),
            'shimmer_local': float(shimmer_local)
        }
        
    except Exception as e:
        logger.error(f"Error extracting audio features: {str(e)}")
        raise e

def process_csv_batch(df, model_handler):
    """Process CSV file for batch predictions"""
    results = []
    successful_predictions = 0
    failed_predictions = 0
    
    for index, row in df.iterrows():
        try:
            # Convert row to dictionary
            features = row.to_dict()
            
            # Validate features
            validation = validate_features(features)
            if not validation['valid']:
                results.append({
                    'row_index': index,
                    'error': validation['message'],
                    'prediction': None
                })
                failed_predictions += 1
                continue
            
            # Make prediction
            prediction = model_handler.predict_single(features)
            results.append({
                'row_index': index,
                'features': features,
                'prediction': prediction,
                'error': None
            })
            successful_predictions += 1
            
        except Exception as e:
            results.append({
                'row_index': index,
                'error': str(e),
                'prediction': None
            })
            failed_predictions += 1
    
    return {
        'predictions': results,
        'total_records': len(df),
        'successful_predictions': successful_predictions,
        'failed_predictions': failed_predictions
    }