import joblib
import pickle
import pandas as pd
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
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
        self.classifier = None # RF
        self.svm_classifier = None
        self.knn_classifier = None
        self.dt_classifier = None
        self.lstm_audio_model = None
        self.lstm_audio_input_shape = None
        self.lstm_audio_load_error = None
        self.feature_names = [
            'age', 'tremor_score', 'handwriting_score', 
            'jitter_local', 'shimmer_local'
        ]
        self.load_models()
    
    def _load_component(self, name, joblib_name, pkl_name=None):
        """Helper to load a component trying joblib first then pickle"""
        path1 = self.model_path / joblib_name
        
        if path1.exists():
            try:
                # Try loading with joblib first
                try:
                    component = joblib.load(path1)
                except:
                    with open(path1, 'rb') as f:
                        component = pickle.load(f)
                logger.info(f"{name} loaded successfully from {path1}")
                return component
            except Exception as e:
                logger.error(f"Error loading {name} from {joblib_name}: {e}")
                
        if pkl_name:
            pkl_path = self.model_path / pkl_name
            if pkl_path.exists():
                try:
                    with open(pkl_path, 'rb') as f:
                        component = pickle.load(f)
                    logger.info(f"{name} loaded successfully from {pkl_path}")
                    return component
                except Exception as e:
                    logger.error(f"Error loading {name} from {pkl_name}: {e}")
        
        return None

    def load_models(self):
        """Load all model components"""
        try:
            # Load scaler
            self.scaler = self._load_component("Scaler", 'feature_scaler.pkl', 'parkinson_scaler.joblib')
            
            # Load PCA
            self.pca = self._load_component("PCA", 'pca_model.pkl', 'parkinson_pca.joblib')
            
            # Load classifier (Random Forest)
            self.classifier = self._load_component("RF Classifier", 'random_forest.pkl', 'parkinson_rf_model.joblib')
            
            # Load SVM classifier
            self.svm_classifier = self._load_component("SVM Classifier", 'svm.pkl', 'parkinson_svm_model.joblib')
            
            # Load KNN classifier
            self.knn_classifier = self._load_component("KNN Classifier", 'knn.pkl')

            # Load Decision Tree classifier
            self.dt_classifier = self._load_component("DT Classifier", 'decision_tree.pkl')

            # Load LSTM audio model (optional dependency: tensorflow)
            self._load_lstm_audio_model()
            
            if self.classifier is None:
                logger.warning("RF Classifier model not found.")
            
            if self.svm_classifier is None:
                logger.warning("SVM Classifier model not found.")

            if self.knn_classifier is None:
                logger.warning("KNN Classifier model not found.")
                
            if self.dt_classifier is None:
                logger.warning("DT Classifier model not found.")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")

    def _load_lstm_audio_model(self):
        """Load LSTM audio model saved as .h5"""
        h5_path = self.model_path / 'lstm_voice_model.h5'
        if not h5_path.exists():
            logger.warning("LSTM audio model not found.")
            return

        try:
            from tensorflow.keras.models import load_model  # type: ignore

            self.lstm_audio_model = load_model(h5_path)
            self.lstm_audio_input_shape = self.lstm_audio_model.input_shape
            self.lstm_audio_load_error = None
            logger.info(f"LSTM audio model loaded successfully from {h5_path}")
            logger.info(f"LSTM input shape: {self.lstm_audio_input_shape}")
        except Exception as e:
            self.lstm_audio_load_error = str(e)
            logger.error(f"Failed to load LSTM audio model: {e}")
            self.lstm_audio_model = None
            self.lstm_audio_input_shape = None
            
    def is_model_loaded(self):
        """Check if models are properly loaded"""
        return self.classifier is not None

    def is_audio_model_loaded(self):
        return self.lstm_audio_model is not None

    def _prepare_lstm_audio_input(self, file_path):
        """
        Build MFCC + delta + delta2 features and shape them to match
        the loaded LSTM model input.
        """
        y, sr = librosa.load(file_path, sr=22050, duration=5.0)
        if y is None or len(y) == 0:
            raise ValueError("Empty audio signal")

        # Training-compatible features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        features = np.concatenate([mfcc, delta, delta2], axis=0)  # (39, T)
        seq = features.T.astype(np.float32)  # (T, 39)

        waveform_preview = np.abs(y[:22050]).astype(np.float32)  # up to first ~1s preview
        step = max(1, len(waveform_preview) // 120)
        waveform_preview = waveform_preview[::step][:120]
        waveform_preview = waveform_preview / (np.max(waveform_preview) + 1e-8)

        shape = self.lstm_audio_input_shape
        if isinstance(shape, list):
            shape = shape[0]

        if not shape or len(shape) < 2:
            raise ValueError("Unexpected LSTM input shape")

        if len(shape) == 3:
            target_steps = shape[1]
            target_features = shape[2]

            if target_features is not None:
                if seq.shape[1] < target_features:
                    pad_cols = target_features - seq.shape[1]
                    seq = np.pad(seq, ((0, 0), (0, pad_cols)), mode='constant')
                elif seq.shape[1] > target_features:
                    seq = seq[:, :target_features]

            if target_steps is not None:
                if seq.shape[0] < target_steps:
                    pad_rows = target_steps - seq.shape[0]
                    seq = np.pad(seq, ((0, pad_rows), (0, 0)), mode='constant')
                elif seq.shape[0] > target_steps:
                    seq = seq[:target_steps, :]

            model_input = np.expand_dims(seq, axis=0)
        else:
            # Dense/flat fallback
            target = shape[1] if len(shape) > 1 else seq.size
            flat = seq.flatten()
            if target is not None:
                if flat.shape[0] < target:
                    flat = np.pad(flat, (0, target - flat.shape[0]), mode='constant')
                elif flat.shape[0] > target:
                    flat = flat[:target]
            model_input = np.expand_dims(flat, axis=0).astype(np.float32)

        return model_input, {
            "mfcc_mean": float(np.mean(mfcc)),
            "delta_mean": float(np.mean(delta)),
            "delta2_mean": float(np.mean(delta2)),
            "waveform_preview": waveform_preview.tolist(),
        }

    def predict_audio_lstm(self, file_path):
        """Predict Parkinson likelihood from audio using LSTM."""
        if not self.is_audio_model_loaded():
            detail = self.lstm_audio_load_error or "Unknown load-time error"
            raise RuntimeError(f"LSTM audio model not loaded. Details: {detail}")

        model_input, meta = self._prepare_lstm_audio_input(file_path)
        pred = self.lstm_audio_model.predict(model_input, verbose=0)
        pred = np.asarray(pred)

        if pred.ndim == 2 and pred.shape[1] >= 2:
            # softmax: assume index 1 = parkinson class
            pd_probability = float(pred[0][1])
        else:
            # sigmoid or scalar output
            pd_probability = float(pred.reshape(-1)[0])

        pd_probability = max(0.0, min(1.0, pd_probability))
        label = "Parkinson" if pd_probability >= 0.5 else "Normal"
        confidence = pd_probability if label == "Parkinson" else (1.0 - pd_probability)

        return {
            "prediction_label": label,
            "prediction_confidence": round(confidence, 4),
            "pd_probability": round(pd_probability, 4),
            "feature_means": {
                "mfcc_mean": round(meta["mfcc_mean"], 6),
                "delta_mean": round(meta["delta_mean"], 6),
                "delta2_mean": round(meta["delta2_mean"], 6),
            },
            "waveform_preview": meta["waveform_preview"],
        }
    
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
            features_transformed = self.pca.transform(df_scaled.values)
        else:
            features_transformed = df_scaled.values
        
        return features_transformed
    
    def predict_single(self, features_dict):
        """Make prediction for single instance"""
        if not self.is_model_loaded():
            raise RuntimeError("Model not loaded")
        
        # Preprocess features
        X = self.preprocess_features(features_dict)
        
        # Initialize probabilities
        pd_prob_rf = 0.0
        pd_prob_svm = 0.0
        pd_prob_knn = 0.0
        pd_prob_dt = 0.0
        
        # Random Forest Prediction
        if self.classifier:
            try:
                pd_prob_rf = self.classifier.predict_proba(X)[0][1]
            except Exception as e:
                logger.error(f"RF prediction error: {e}")
        
        # SVM Prediction
        if self.svm_classifier:
            try:
                if hasattr(self.svm_classifier, "predict_proba"):
                    pd_prob_svm = self.svm_classifier.predict_proba(X)[0][1]
                else:
                    pred = self.svm_classifier.predict(X)[0]
                    pd_prob_svm = 1.0 if pred == 1 else 0.0
            except Exception as e:
                logger.error(f"SVM prediction error: {e}")

        # KNN Prediction
        if self.knn_classifier:
            try:
                pd_prob_knn = self.knn_classifier.predict_proba(X)[0][1]
            except Exception as e:
                logger.error(f"KNN prediction error: {e}")

        # Decision Tree Prediction
        if self.dt_classifier:
            try:
                pd_prob_dt = self.dt_classifier.predict_proba(X)[0][1]
            except Exception as e:
                logger.error(f"DT prediction error: {e}")
        
        # Calculate feature importance (simplified)
        feature_importance = self.calculate_feature_importance(features_dict)
        
        valid_probs = []
        if self.classifier: valid_probs.append(pd_prob_rf)
        if self.svm_classifier: valid_probs.append(pd_prob_svm)
        if self.knn_classifier: valid_probs.append(pd_prob_knn)
        if self.dt_classifier: valid_probs.append(pd_prob_dt)
        
        avg_prob = sum(valid_probs) / len(valid_probs) if valid_probs else 0.0
        
        stage_probs = self.calculate_stage_probabilities(avg_prob)
        
        return {
            "pd_probability": round(avg_prob, 3), # Consolidated probability
            "pd_probability_rf": round(pd_prob_rf, 3),
            "pd_probability_svm": round(pd_prob_svm, 3),
            "pd_probability_knn": round(pd_prob_knn, 3),
            "pd_probability_dt": round(pd_prob_dt, 3),
            "stage_probs": stage_probs,
            "top_features": feature_importance
        }
    
    def calculate_feature_importance(self, features_dict):
        """Calculate feature importance for explanation"""
        importance_scores = {}
        
        # Calculate scores for all features to ensure we always have enough data for the chart
        # Weights approximate relative visual importance (0-100 scale)
        importance_scores['tremor_score'] = features_dict.get('tremor_score', 0) * 25
        importance_scores['rigidity'] = features_dict.get('rigidity', 0) * 25
        importance_scores['bradykinesia'] = features_dict.get('bradykinesia', 0) * 25
        importance_scores['handwriting_score'] = features_dict.get('handwriting_score', 0) * 25
        
        # Acoustic features (scaled up from small decimals)
        importance_scores['jitter_local'] = features_dict.get('jitter_local', 0) * 2000  
        importance_scores['shimmer_local'] = features_dict.get('shimmer_local', 0) * 500 
        
        # Age contribution
        age = features_dict.get('age', 0)
        importance_scores['age'] = max(0, (age - 50) * 2)

        # Sort by importance and return top 5 with scores
        sorted_features = sorted(importance_scores.items(), key=lambda x: x[1], reverse=True)
        return [{"name": feature[0], "value": feature[1]} for feature in sorted_features[:5]]
    
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
            "models_available": {
                "rf": self.classifier is not None,
                "svm": self.svm_classifier is not None,
                "knn": self.knn_classifier is not None,
                "dt": self.dt_classifier is not None,
                "lstm_audio": self.lstm_audio_model is not None,
            },
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
        self.rf_classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.svm_classifier = SVC(probability=True, random_state=42)
        self.knn_classifier = KNeighborsClassifier(n_neighbors=5)
        self.dt_classifier = DecisionTreeClassifier(random_state=42)
        
    def train_model(self, X_train, y_train):
        """Train the complete pipeline"""
        # Fit scaler and PCA
        X_scaled = self.scaler.fit_transform(X_train)
        X_pca = self.pca.fit_transform(X_scaled)
        
        # Train classifiers
        print("Training Random Forest...")
        self.rf_classifier.fit(X_pca, y_train)
        
        print("Training SVM...")
        self.svm_classifier.fit(X_pca, y_train)
        
        print("Training KNN...")
        self.knn_classifier.fit(X_pca, y_train)
        
        print("Training Decision Tree...")
        self.dt_classifier.fit(X_pca, y_train)
        
        return self
    
    def evaluate_model(self, X_test, y_test):
        """Evaluate model performance"""
        # Transform test data
        X_scaled = self.scaler.transform(X_test)
        X_pca = self.pca.transform(X_scaled)
        
        # Make predictions (using RF as primary)
        y_pred = self.rf_classifier.predict(X_pca)
        
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred)
        
        # Simple evaluation for others
        print(f"SVM Accuracy: {self.svm_classifier.score(X_pca, y_test):.3f}")
        print(f"KNN Accuracy: {self.knn_classifier.score(X_pca, y_test):.3f}")
        print(f"DT Accuracy: {self.dt_classifier.score(X_pca, y_test):.3f}")
        
        return accuracy, report
    
    def save_models(self, model_dir='ml_models/'):
        """Save all model components"""
        model_path = Path(model_dir)
        model_path.mkdir(exist_ok=True, parents=True)
        
        # Save scaler
        with open(model_path / 'feature_scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save PCA
        with open(model_path / 'pca_model.pkl', 'wb') as f:
            pickle.dump(self.pca, f)
        
        # Save classifiers
        with open(model_path / 'random_forest.pkl', 'wb') as f:
            pickle.dump(self.rf_classifier, f)
            
        with open(model_path / 'svm.pkl', 'wb') as f:
            pickle.dump(self.svm_classifier, f)
            
        with open(model_path / 'knn.pkl', 'wb') as f:
            pickle.dump(self.knn_classifier, f)

        with open(model_path / 'decision_tree.pkl', 'wb') as f:
            pickle.dump(self.dt_classifier, f)
        
        print(f"All models saved to {model_path}")

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
    # Higher scores/age -> higher chance of PD (1)
    score = (
        (data['age'] - 60) / 20 + 
        data['tremor_score'] + 
        data['handwriting_score'] + 
        data['jitter_local']*500 + 
        data['shimmer_local']*50
    )
    # Sigmoid probability
    prob = 1 / (1 + np.exp(-(score - 5)))
    y = (prob > 0.5).astype(int)
    
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
    print(f"RF Model Accuracy: {accuracy:.3f}")
    print(f"Classification Report:\n{report}")
    
    # Save models
    trainer.save_models()
