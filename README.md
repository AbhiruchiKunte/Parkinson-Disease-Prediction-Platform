# 🧠 NeuroDetect: AI-Assisted Parkinson's Disease Detection Platform

**NeuroDetect** is an AI-powered platform for the early detection and stage-wise prediction of Parkinson’s Disease using voice and clinical data. It leverages machine learning and deep learning models to deliver accurate, non-invasive analysis and actionable insights. The system helps healthcare professionals make faster, data-driven decisions for improved patient outcomes.

---

## 🏗️ Project Architecture

The platform follows a decoupled client-server architecture with high-performance ML inference:

- **Frontend (Presentation Layer)**: A responsive React 18 application built with TypeScript and Vite. It utilizes Tailwind CSS for styling and Recharts for high-fidelity clinical data visualization, including 3D symptom space projections.
- **Backend (Inference Layer)**: A Flask-based Python API that handles multi-modal data processing. It manages the inference lifecycle for multiple ML models (Random Forest, SVM, KNN, LSTM) and integrates with Supabase for persistent health records.
- **Data Layer (Storage & Auth)**: Supabase PostgreSQL provides the backbone for clinical record storage, user authentication, and secure biomarker data management.
- **ML Engine**: 
    - **Clinical Models**: Random Forest and SVM ensembles for tabular biomarker prediction.
    - **Audio Engine**: MFCC feature extraction coupled with an LSTM Neural Network for phonation analysis.
    - **Video Engine**: Template-matching algorithms for gait and tremor analysis.

---

## 📁 Project Directory Structure

```text
Parkinson-Disease-Prediction-Platform/
├── backend/                # Python Flask API & ML Inference
│   ├── app.py              # Application Entry Point
│   ├── controllers/        # Logical controllers (Prediction, Dashboard)
│   ├── routes/             # API Routes & Endpoints
│   ├── ml_models/          # Trained Model Binaries (.pkl, .h5)
│   ├── utils.py            # Feature extraction & processing utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript Frontend
│   ├── src/                # Project Source Code
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Application Screens (Analytics, Dashboard, Voice)
│   │   ├── lib/            # API Client & Constants
│   │   └── App.tsx         # Main Component & Routing
│   ├── public/             # Static Assets
│   └── package.json        # Node dependencies
├── .env                    # Configuration Secrets
├── start.bat               # Start Script
└── README.md               # Project Documentation
```

---

## 🚀 Key Features

- **Multi-Modal Diagnostics**: Analyze Parkinson's signatures through two distinct pathways:
    - **Clinical Assessment**: Tabular analysis of motor and non-motor symptoms.
    - **Voice Analysis**: Deep learning analysis of sustained phonation (Jitter, Shimmer, HNR).
- **Dynamic Analytics Dashboard**: 
    - Real-time 3D projection of patient symptom space.
    - Automated population-wide correlation studies and risk gauges.
    - Live database syncing with automated polling every 10 seconds.
- **Clinical Reporting**: Automated generation of comprehensive diagnostic reports.
- **Multi-Model Comparison**: Real-time benchmarking of RF, SVM, DT, and KNN models.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Recharts, Lucide-React |
| **Backend** | Python, Flask, Gunicorn |
| **Machine Learning** | Scikit-Learn, TensorFlow, NumPy, Pandas |
| **Database** | Supabase (PostgreSQL) |
| **DevOps** | Batch Automation, Environ Configuration |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Supabase Account** (for API keys)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AbhiruchiKunte/Parkinson-Disease-Prediction-Platform.git
   cd Parkinson-Disease-Prediction-Platform
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   HF_TOKEN=your_huggingface_token
   ```

3. **Frontend Configuration**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Platform

For a one-click startup, use the provided batch script from the root directory:
```bash
start.bat
```
---

## 📄 Research Publication

This project is supported by published research conducted during the academic year 2025-26.

- **Paper Title**: AI-Assisted Early Detection & Staging of Parkinson’s Disease
- **Published in**: The Indian Journal of Technical Education (IJTE), Vol. 49, Special Issue No. 1, February 2026.
- **Conference**: International Conference on Science, Technology, Engineering, and Mathematics for Sustainable Development (ICSTEMSD).
- **Status**: Published in Feb-2026.

---

## 👥 Meet the Team

| Name | Role | Class & Branch |
| :--- | :--- | :--- |
| **Govind Choudhari** | Full Stack Web Developer | BE IT |
| **Abhiruchi Kunte** | Full Stack Web Developer | BE IT |
| **Nishank Jain** | Full Stack Web Developer | BE IT |
| **Sahil Kale** | Full Stack Web Developer | BE IT |

### 🎓 Guidance
**Prof. Vaidehi Agrawal**  
*Department of Information Technology*  
**Atharva College of Engineering, Mumbai**

---
© 2025-26 NeuroDetect Platform. Developed at ACE, Mumbai.
