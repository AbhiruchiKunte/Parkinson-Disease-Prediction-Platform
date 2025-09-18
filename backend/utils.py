import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class ModelHandler:
    def __init__(self, model_path='model/'):
        self.model_path = Path(model_path)
        self.scaler = None
        self.pca = None
        self.classifier = None
        self.feature_names = [
            'age', 'tremor_score', 'handwriting_score', 
            'jitter_local', 'shimmer_local'
        ]
        self.load_models()
    
    def load_models(self):
        """Load all model components"""
        try:
            # Load scaler
            scaler_path = self.model_path / 'scaler.joblib'
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info("Scaler loaded successfully")
            
            # Load PCA
            pca_path = self.model_path / 'pca.joblib'
            if pca_path.exists():
                self.pca = joblib.load(pca_path)
                logger.info("PCA loaded successfully")
            
            # Load classifier
            classifier_path = self.model_path / 'classifier.joblib'
            if classifier_path.exists():
                self.classifier = joblib.load(classifier_path)
                logger.info("Classifier loaded successfully")
            else:
                raise FileNotFoundError("Classifier model not found")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
    
    def is_model_loaded(self):
        """Check if models are properly loaded"""
        return self.classifier is not None
    
    def preprocess_features(self, features_dict):
        """Preprocess features for prediction"""
        # Convert to DataFrame
        df = pd.DataFrame([features_dict])
        
        # Ensure all required features are present
        for feature in self.feature_names:
            if feature not in df.columns:
                raise ValueError(f"Missing required feature: {feature}")
        
        # Reorder columns to match training data
        df = df[self.feature_names]
        
        # Apply scaling if scaler is available
        if self.scaler is not None:
            df_scaled = pd.DataFrame(
                self.scaler.transform(df), 
                columns=df.columns, 
                index=df.index
            )
        else:
            df_scaled = df
        
        # Apply PCA if available
        if self.pca is not None:
            features_transformed = self.pca.transform(df_scaled)
        else:
            features_transformed = df_scaled.values
        
        return features_transformed
    
    def predict_single(self, features_dict):
        """Make prediction for single instance"""
        if not self.is_model_loaded():
            raise RuntimeError("Model not loaded")
        
        # Preprocess features
        X = self.preprocess_features(features_dict)
        
        # Get prediction probability
        pd_prob = self.classifier.predict_proba(X)[0][1]  # Assuming binary classification
        
        # Calculate feature importance (simplified)
        feature_importance = self.calculate_feature_importance(features_dict)
        
        # Simulate stage probabilities based on PD probability
        stage_probs = self.calculate_stage_probabilities(pd_prob)
        
        return {
            "pd_probability": round(pd_prob, 3),
            "stage_probs": stage_probs,
            "top_features": feature_importance
        }
    
    def calculate_feature_importance(self, features_dict):
        """Calculate feature importance for explanation"""
        # Simplified feature importance based on feature values
        # In a real scenario, you might use SHAP or similar techniques
        importance_scores = {}
        
        # Example scoring logic (customize based on your domain knowledge)
        if features_dict.get('tremor_score', 0) > 3:
            importance_scores['tremor_score'] = features_dict['tremor_score']
        
        if features_dict.get('jitter_local', 0) > 0.001:
            importance_scores['jitter_local'] = features_dict['jitter_local'] * 1000
        
        if features_dict.get('age', 0) > 60:
            importance_scores['age'] = features_dict['age'] / 100
        
        if features_dict.get('handwriting_score', 0) > 3:
            importance_scores['handwriting_score'] = features_dict['handwriting_score']
        
        if features_dict.get('shimmer_local', 0) > 0.03:
            importance_scores['shimmer_local'] = features_dict['shimmer_local'] * 100
        
        # Sort by importance and return top 3
        sorted_features = sorted(importance_scores.items(), key=lambda x: x[1], reverse=True)
        return [feature[0] for feature in sorted_features[:3]]
    
    def calculate_stage_probabilities(self, pd_prob):
        """Calculate stage probabilities based on PD probability"""
        if pd_prob < 0.3:
            return {"early": 0.90, "mid": 0.08, "late": 0.02}
        elif pd_prob < 0.6:
            return {"early": 0.70, "mid": 0.25, "late": 0.05}
        elif pd_prob < 0.8:
            return {"early": 0.40, "mid": 0.45, "late": 0.15}
        else:
            return {"early": 0.20, "mid": 0.40, "late": 0.40}
    
    def get_model_info(self):
        """Get model information"""
        return {
            "model_loaded": self.is_model_loaded(),
            "required_features": self.feature_names,
            "feature_descriptions": {
                "age": "Patient age in years",
                "tremor_score": "Tremor severity score (0-5)",
                "handwriting_score": "Handwriting quality score (0-5)",
                "jitter_local": "Voice jitter measurement",
                "shimmer_local": "Voice shimmer measurement"
            }
        }

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