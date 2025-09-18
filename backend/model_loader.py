import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from pathlib import Path

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
        # Fit scaler
        X_scaled = self.scaler.fit_transform(X_train)
        
        # Fit PCA
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
        model_path.mkdir(exist_ok=True)
        
        # Save scaler
        joblib.dump(self.scaler, model_path / 'scaler.joblib')
        
        # Save PCA
        joblib.dump(self.pca, model_path / 'pca.joblib')
        
        # Save classifier
        joblib.dump(self.classifier, model_path / 'classifier.joblib')
        
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