import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import librosa
import os
import sys
import importlib

def preprocess_batch_row(row):
    """
    Normalize row keys and apply fuzzy mapping to match model expected features.
    Returns a dictionary with model-compatible feature names.
    """
    # Standard model features
    MODEL_FEATURES = ['age', 'tremor_score', 'handwriting_score', 'jitter_local', 'shimmer_local']
    
    # This allows standard datasets (like UCI) to work with our hybrid model
    MAPPING = {
        'jitter_percent': 'jitter_local',
        'jitter(%)': 'jitter_local',
        'mdvp:jitter(%)': 'jitter_local',
        'abs_jitter': 'jitter_local',
        
        'shimmer_apq3': 'shimmer_local',
        'mdvp:shimmer': 'shimmer_local',
        'shimmer_db': 'shimmer_local',
        
        'subject_age': 'age',
        'patiend_age': 'age'
    }
    
    # Defaults for missing clinical data (if dataset is purely acoustic)
    DEFAULTS = {
        'age': 60.0,             # Average risk age
        'tremor_score': 0.0,     # Assume early stage/no visible tremor if not recorded
        'handwriting_score': 0.0 # Assume normal if not recorded
    }
    
    # Normalize row keys
    row_norm = {k.lower().strip(): v for k, v in row.items()}
    processed_features = {}
    
    # 1. Direct mapping & Aliases
    for target in MODEL_FEATURES:
        if target in row_norm:
            processed_features[target] = row_norm[target]
        else:
            # Check aliases
            for alias, map_target in MAPPING.items():
                if map_target == target and alias in row_norm:
                    processed_features[target] = row_norm[alias]
                    break
    
    # 2. Apply Defaults for missing keys
    used_defaults = []
    for target in MODEL_FEATURES:
        if target not in processed_features:
            processed_features[target] = DEFAULTS.get(target, 0.0)
            used_defaults.append(target)
            
    return processed_features, used_defaults

def validate_features(features):
    """Validate input features"""
    # Validation logic remains similar but operates on the PREPROCESSED features
    try:
        age = float(features.get('age', 0))
        if not 0 <= age <= 120:
            return {'valid': False, 'message': "Age must be between 0 and 120"}
        
        tremor_score = float(features.get('tremor_score', 0))
        if not 0 <= tremor_score <= 10: # Relaxed max for safety
            return {'valid': False, 'message': "Tremor score out of valid range"}
            
        # Basic numeric checks for others
        float(features.get('jitter_local', 0))
        float(features.get('shimmer_local', 0))
        
    except (ValueError, TypeError):
        return {'valid': False, 'message': "All features must be numeric values"}
    
    return {'valid': True, 'message': "Valid features"}

def extract_audio_features(file_path):
    """Extract jitter and shimmer from audio file"""
    try:
        # Load audio file
        y, sr = librosa.load(file_path, duration=3)
        
        # Calculate features (Simplified approximation)
        # 1. Pitch (F0)
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
        f0 = f0[~np.isnan(f0)]
        
        if len(f0) == 0:
            return {'jitter_local': 0.0, 'shimmer_local': 0.0}
            
        # 2. Jitter (local)
        jitter_local = np.mean(np.abs(np.diff(f0))) / np.mean(f0) if np.mean(f0) > 0 else 0
        
        # 3. Shimmer (local)
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=hop_length, hop_length=hop_length)[0]
        shimmer_local = np.mean(np.abs(np.diff(rms))) / np.mean(rms) if np.mean(rms) > 0 else 0
        
        return {
            'jitter_local': float(jitter_local),
            'shimmer_local': float(shimmer_local)
        }
        
    except Exception as e:
        print(f"Error extracting audio features: {str(e)}")
        raise e

def process_csv_batch(df, model_handler):
    """Process DataFrame for batch predictions"""
    results = []
    successful_predictions = 0
    failed_predictions = 0
    
    for index, row in df.iterrows():
        try:
            # Convert to dict and Preprocess (Map/Default)
            raw_dict = row.to_dict()
            features, used_defaults = preprocess_batch_row(raw_dict)
            
            # Validate
            validation = validate_features(features)
            if not validation['valid']:
                results.append({
                    'row_index': index,
                    'error': validation['message'],
                    'prediction': None
                })
                failed_predictions += 1
                continue
            
            # Predict
            prediction = model_handler.predict_single(features)
            
            # Add metadata about defaults used
            prediction['notes'] = f"Defaults used: {', '.join(used_defaults)}" if used_defaults else ""
            
            results.append({
                'row_index': index,
                'input_data': raw_dict, 
                'features_used': features,
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