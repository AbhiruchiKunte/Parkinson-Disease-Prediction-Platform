# 🧠 Parkinson's Disease Prediction Platform

An advanced AI-powered platform for early prediction and stage classification of Parkinson's Disease using multi-modal analysis (clinical data, voice patterns, and handwriting).

## 🚀 Project Status

**Current Phase:** Beta / Feature Implementation

We have successfully built the core predictive engine and a modern responsive frontend. The system is operational for clinical assessment testing.

### ✅ Completed Features

- **AI-Models Engine**: Integrated **Random Forest**, **Support Vector Machine (SVM)**, **Decision Trees** and **K-Nearest Neighbors (KNN)** models for robust prediction.
    - *Confidence Scoring*: Real-time confidence probability display for all models.
    - *Auto-Loading*: Intelligent model loader (`joblib`/`pkl` support).
- **Modern Frontend Interface**:
    - Responsive React + Vite application.
    - Interactive Assessment Form with real-time validation.
    - Visual results dashboard with stage probability graphs.
- **Developer Experience**:
    - **One-Click Startup**: `start.bat` launches the full stack instantly.
    - **Auto-Reload**: Backend hot-reloading enabled for rapid development.
    - **Health Checks**: API endpoints for system status monitoring.

### 🚧 Pending / Roadmap

The following features are planned for the upcoming sprints:

- [ ] **Advanced Voice Analysis**: Full integration of microphone capture and spectral analysis (Jitter/Shimmer extraction).
- [ ] **Authentication System**: Secure Access for Verified Healthcare Professionals
- [ ] **Patient Profiles**: History tracking and longitudinal analysis of symptoms.
- [ ] **Real-time Prediction**: Real-time prediction of Parkinson's Disease using AI models.
- [] **Integration of Deep Learning Models**: LSTM integration for time series analysis.
- [ ] **Production Deployment**: containerization (Docker) and cloud hosting setup.
- [ ] **Mobile Optimization in Future**: Native mobile app wrappers.

## 🛠️ Project Structure

```
Parkinson-Disease-Prediction-Platform/
├── backend/                # Python Flask API
│   ├── app.py              # Main application entry point
│   ├── model_loader.py     # AI Model handler (RF + SVM)
│   ├── model/              # Trained Model files (.joblib)
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript Frontend
│   ├── src/                # Source code
│   │   ├── components/     # UI Components (Forms, Charts)
│   │   └── lib/            # API clients and utilities
│   └── package.json        # Node dependencies
├── start.bat               # ONE-CLICK STARTUP SCRIPT
└── README.md               # Project Documentation
```

## 🏁 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**

### Quick Start

1. **Clone the repository**.
2. **Double-click `start.bat`** in the root directory.

- Start the Python Backend on `http://localhost:5000`
- Start the React Frontend on `http://localhost:5173`

*Note: The backend is configured in Development Mode, so it will auto-reload if you make code changes.*
