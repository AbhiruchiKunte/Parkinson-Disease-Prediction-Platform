# 🧠 Parkinson's Disease Prediction Platform

An AI-powered platform for early prediction and stage classification of Parkinson's Disease using multi-modal analysis (clinical data, voice patterns, and handwriting).

## 🚀 Project Status

**Current Phase:** Feature Implementation

We have successfully built the core predictive engine and a modern responsive frontend. The system is operational for clinical assessment testing.

### ✅ Completed Features

- **AI-Models Engine**: Integrated **Random Forest**, **Support Vector Machine (SVM)**, **Decision Trees** and **K-Nearest Neighbors (KNN)** models for robust prediction.
    - *Confidence Scoring*: Real-time confidence probability display for all models.
    - *Auto-Loading*: Intelligent model loader (`pkl` support).
- **Modern Frontend Interface**:
    - Responsive React + Vite application.
    - Interactive Assessment Form with real-time validation.
    - Visual results dashboard with stage probability graphs.
- **Developer Experience**:
    - **One-Click Startup**: `start.bat` launches the project.
    - **Health Checks**: API endpoints for system status monitoring.

## 🛠️ Project Structure

```
Parkinson-Disease-Prediction-Platform/
├── backend/                # Python Flask API
│   ├── app.py              # Main application point
│   ├── model_loader.py     # AI Model handler (RF, SVM, DT, KNN & LSTM)
│   ├── model/              # Trained Model files (.pkl)
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript Frontend
│   ├── src/                # Source code
│   │   ├── components/     # UI Components (Forms, Charts)
│   │   └── lib/            # API clients and utilities
│   └── package.json        # Node dependencies
├── start.bat               # STARTUP SCRIPT
└── README.md               # Project Documentation
```

## 🏁 Getting Started

### Prerequisites

- **Python and pip installed
- **Node.js and npm installed

### Quick Start

1. **Clone the repository**.
2. **Double-click `start.bat`** in the root directory.

- Start the Python Backend on `http://localhost:5000`
- Start the React Frontend on `http://localhost:5173`

