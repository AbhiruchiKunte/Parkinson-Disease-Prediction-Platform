import joblib
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from pathlib import Path
import logging
import sys
import importlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelHandler:
    def __init__(self, model_path='ml_models/'):
        # Resolve model_path relative to this file when a relative path is provided
        mp = Path(model_path)
        if not mp.is_absolute():
            self.model_path = (Path(__file__).parent / mp).resolve()
        else:
            self.model_path = mp
        self.scaler = None
        self.pca = None
        self.classifier = None
        self.svm_classifier = None
        self.feature_names = [
            'age', 'tremor_score', 'handwriting_score', 
            'jitter_local', 'shimmer_local'
        ]
        self.load_models()
    
    def _load_component(self, name, joblib_name, pkl_name=None):
        """Helper to load a component trying joblib first then pickle"""
        joblib_path = self.model_path / joblib_name
        
        if joblib_path.exists():
            try:
                component = joblib.load(joblib_path)
                logger.info(f"{name} loaded successfully from {joblib_name}")
                return component
            except Exception as e:
                logger.error(f"Error loading {name} from {joblib_name}: {e}")
                
        if pkl_name:
            pkl_path = self.model_path / pkl_name
            if pkl_path.exists():
                try:
                    with open(pkl_path, 'rb') as f:
                        component = pickle.load(f)
                    logger.info(f"{name} loaded successfully from {pkl_name}")
                    return component
                except Exception as e:
                    logger.error(f"Error loading {name} from {pkl_name}: {e}")
        
        return None

    def load_models(self):
        """Load all model components"""
        try:
            # Load scaler
            self.scaler = self._load_component(
                "Scaler", 
                'parkinson_scaler.joblib' 
            )
            
            # Load PCA
            self.pca = self._load_component(
                "PCA", 
                'parkinson_pca.joblib' 
            )
            
            # Load classifier (Random Forest)
            self.classifier = self._load_component(
                "RF Classifier", 
                'parkinson_rf_model.joblib'
            )
            
            # Load SVM classifier
            self.svm_classifier = self._load_component(
                "SVM Classifier", 
                'parkinson_svm_model.joblib'
            )
            
            if self.classifier is None:
                logger.warning("RF Classifier model not found.")
            
            if self.svm_classifier is None:
                logger.warning("SVM Classifier model not found.")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            
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
        
        # Get predictions
        pd_prob_rf = 0.0
        pd_prob_svm = 0.0
        
        # Random Forest Prediction
        if self.classifier:
            try:
                pd_prob_rf = self.classifier.predict_proba(X)[0][1]
            except Exception as e:
                logger.error(f"RF prediction error: {e}")
        
        # SVM Prediction
        if self.svm_classifier:
            try:
                # Check if SVM supports predict_proba
                if hasattr(self.svm_classifier, "predict_proba"):
                    pd_prob_svm = self.svm_classifier.predict_proba(X)[0][1]
                else:
                    # Use decision function and sigmoid or just basic prediction
                    pred = self.svm_classifier.predict(X)[0]
                    pd_prob_svm = 1.0 if pred == 1 else 0.0
            except Exception as e:
                logger.error(f"SVM prediction error: {e}")
        
        # Calculate feature importance (simplified)
        feature_importance = self.calculate_feature_importance(features_dict)
        
        # Using RF probability for stage calculation for consistency
        stage_probs = self.calculate_stage_probabilities(pd_prob_rf)
        
        return {
            "pd_probability": round(pd_prob_rf, 3), # Default for existing frontend
            "pd_probability_rf": round(pd_prob_rf, 3),
            "pd_probability_svm": round(pd_prob_svm, 3),
            "stage_probs": stage_probs,
            "top_features": feature_importance
        }
    
    def calculate_feature_importance(self, features_dict):
        """Calculate feature importance for explanation"""
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

class ModelTrainer:
    """Helper class to train and save models"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)  # Keep 95% of variance
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        
    def train_model(self, X_train, y_train):
        """Train the complete pipeline"""
        X_scaled = self.scaler.fit_transform(X_train)
        X_pca = self.pca.fit_transform(X_scaled)
        
        # Train classifier
        self.classifier.fit(X_pca, y_train)
        
        return self
    
    def evaluate_model(self, X_test, y_test):
        """Evaluate model performance"""
        # Transform test data
        X_scaled = self.scaler.transform(X_test)
        X_pca = self.pca.transform(X_scaled)
        
        # Make predictions
        y_pred = self.classifier.predict(X_pca)
        
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred)
        
        return accuracy, report
    
    def save_models(self, model_dir='model/'):
        """Save all model components"""
        model_path = Path(model_dir)
        model_path.mkdir(exist_ok=True, parents=True) # Added parents=True for robustness
        
        # Save scaler
        with open(model_path / 'parkinson_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save PCA
        with open(model_path / 'parkinson_pca.pkl', 'wb') as f:
            pickle.dump(self.pca, f)
        
        # Save classifier
        with open(model_path / 'parkinson_rf_model.pkl', 'wb') as f:
            pickle.dump(self.classifier, f)
        
        print(f"Models saved to {model_path}")

def create_sample_data():
    """Create sample training data for testing"""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    data = {
        'age': np.random.normal(65, 15, n_samples),
        'tremor_score': np.random.uniform(0, 5, n_samples),
        'handwriting_score': np.random.uniform(0, 5, n_samples),
        'jitter_local': np.random.exponential(0.001, n_samples),
        'shimmer_local': np.random.exponential(0.02, n_samples)
    }
    
    # Create target variable (simplified logic)
    y = ((data['age'] > 60) & 
         (data['tremor_score'] > 2.5) | 
         (data['jitter_local'] > 0.002) |
         (data['handwriting_score'] > 3)).astype(int)
    
    return pd.DataFrame(data), y

if __name__ == "__main__":
    # Create sample data
    X, y = create_sample_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    trainer = ModelTrainer()
    trainer.train_model(X_train, y_train)
    
    # Evaluate model
    accuracy, report = trainer.evaluate_model(X_test, y_test)
    print(f"Model Accuracy: {accuracy:.3f}")
    print(f"Classification Report:\n{report}")
    
    # Save models
    trainer.save_models()