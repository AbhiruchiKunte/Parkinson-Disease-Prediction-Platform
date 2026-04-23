import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import librosa
import os
import sys
import importlib
import re


def _normalize_key(key):
    key = str(key).strip().lower()
    key = re.sub(r'[^a-z0-9]+', '_', key)
    return key.strip('_')


def _extract_numeric(value):
    if value is None:
        return None
    if isinstance(value, (int, float, np.number)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    text = text.replace(',', '.')
    match = re.search(r'-?\d+(?:\.\d+)?', text)
    if not match:
        return None

    try:
        return float(match.group(0))
    except Exception:
        return None


def _map_qualitative_score(value):
    if value is None:
        return None
    text = str(value).strip().lower()
    mapping = {
        'normal': 0.5,
        'mild': 1.5,
        'moderate': 2.5,
        'severe': 3.5,
        'very_severe': 4.0,
        'very severe': 4.0,
    }
    return mapping.get(text)

def preprocess_batch_row(row):
    """
    Normalize row keys and apply fuzzy mapping to match model expected features.
    Returns a dictionary with model-compatible feature names.
    """
    # Keep core model features + clinically useful extras
    MODEL_FEATURES = [
        'age',
        'tremor_score',
        'handwriting_score',
        'jitter_local',
        'shimmer_local',
        'bradykinesia',
        'rigidity',
    ]

    aliases = {
        'age': ['age', 'subject_age', 'patient_age', 'years', 'years_old'],
        'tremor_score': ['tremor_score', 'tremor', 'rest_tremor', 'tremor_frequency', 'tremor_f'],
        'handwriting_score': ['handwriting_score', 'handwriting', 'micrographia', 'spiral_score', 'spiral_error', 'drawing_score'],
        'jitter_local': [
            'jitter_local', 'jitter', 'jitter_percent', 'jitter_perc', 'jitter_abs',
            'mdvp_jitter', 'mdvp_jitter_percent', 'jit'
        ],
        'shimmer_local': [
            'shimmer_local', 'shimmer', 'shimmer_db', 'shimmer_apq3', 'shimmer_apq5',
            'mdvp_shimmer', 'shim'
        ],
        'bradykinesia': ['bradykinesia', 'slowness', 'writing_speed', 'stroke_velocity', 'stroke_v'],
        'rigidity': ['rigidity', 'stiffness', 'drawing_pressure', 'pen_lift', 'pen_lift_count', 'drawing_p'],
    }
    
    # Defaults for missing clinical data (if dataset is purely acoustic)
    DEFAULTS = {
        'age': 60.0,
        'tremor_score': 0.0,
        'handwriting_score': 0.0,
        'jitter_local': 0.0,
        'shimmer_local': 0.0,
        'bradykinesia': 0.0,
        'rigidity': 0.0,
    }

    # Normalize row keys once
    row_norm = {_normalize_key(k): v for k, v in row.items()}
    processed_features = {}

    def pick_value(target):
        # 1. direct key
        if target in row_norm:
            return row_norm[target]

        candidates = aliases.get(target, [])

        # 2. exact alias
        for alias in candidates:
            alias_key = _normalize_key(alias)
            if alias_key in row_norm:
                return row_norm[alias_key]

        # 3. fuzzy alias containment
        for key, value in row_norm.items():
            for alias in candidates:
                alias_key = _normalize_key(alias)
                if alias_key and (alias_key in key or key in alias_key):
                    return value
        return None

    # 1. Extract matched values
    for target in MODEL_FEATURES:
        raw = pick_value(target)
        if raw is not None:
            numeric = _extract_numeric(raw)
            if numeric is not None:
                processed_features[target] = numeric
            elif target in ('handwriting_score', 'tremor_score', 'bradykinesia', 'rigidity'):
                qualitative = _map_qualitative_score(raw)
                if qualitative is not None:
                    processed_features[target] = qualitative
                else:
                    processed_features[target] = raw
            else:
                processed_features[target] = raw

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
                'pd_probability': prediction.get('pd_probability'),
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
