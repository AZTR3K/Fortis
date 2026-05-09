# FORTIS — Deep Learning for Athlete Workload Management & Injury Forecasting

> A professional-grade, full-stack AI system that predicts musculoskeletal injury risk
> in athletes before it happens — combining multimodal wearable data, a deep ANN, and
> a live clinical dashboard.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Dataset](#2-dataset)
3. [Architecture](#3-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Folder Structure](#5-folder-structure)
6. [Key Design Decisions](#6-key-design-decisions)
7. [ML Pipeline](#7-ml-pipeline)
8. [API Reference](#8-api-reference)
9. [Frontend](#9-frontend)
10. [Setup & Running the Project](#10-setup--running-the-project)
11. [Notebook Guide](#11-notebook-guide)
12. [Presentation Story](#12-presentation-story)

---

## 1. Project Overview

**FORTIS** (Latin: *strong, resilient*) is an early-warning injury prediction system
designed for use by sports medical staff and performance coaches. By analyzing
multimodal time-series data from wearable sensors — spanning physiology, biomechanics,
environment, and training workload — FORTIS uses an Artificial Neural Network (ANN) to
identify hidden patterns of fatigue and flag athletes at elevated injury risk before
they step onto the pitch.

### The Problem

Non-contact musculoskeletal injuries in professional sports are largely driven by:
- Cumulative fatigue and inadequate recovery
- Spikes in training load relative to chronic baseline (ACWR > 1.5)
- Poor sleep quality combined with high stress markers
- Suboptimal workload periodization over multi-session windows

Traditional monitoring is reactive. FORTIS is proactive.

### The Product

A full-stack clinical decision support tool with three layers:

| Layer | What it does |
|---|---|
| **ML Model** | ANN trained on 15,420 sessions predicts 3-class injury risk |
| **REST API** | FastAPI server serves predictions and athlete data |
| **Dashboard** | React frontend shows squad overview, athlete profiles, live predictions |

### Target Users

Sports physicians, physiotherapists, and performance coaches managing professional
or semi-professional squads.

---

## 2. Dataset

**Source:** [Multimodal Sports Injury Prediction Dataset — Kaggle](https://www.kaggle.com/datasets/anjalibhegam/multimodal-sports-injury-dataset)

**License:** CC BY-NC-SA 4.0 (non-commercial use)

### Stats at a Glance

| Property | Value |
|---|---|
| Total samples | 15,420 |
| Athletes | 156 (68% Male, 32% Female) |
| Sessions per athlete | ~99 (sequential, chronological) |
| Sports | Soccer 35%, Basketball 25%, Track 20%, Other 20% |
| Features | 22 sensor features + 7 metadata columns |
| Target classes | 3 — Healthy (64%), Low Risk (21%), Injured (15%) |
| Class imbalance ratio | 4.26:1 (Healthy:Injured) |
| Missing data | ~3% across 6 columns |

### Feature Modalities

**Physiological (6):** heart_rate, body_temperature, hydration_level, sleep_quality,
recovery_score, stress_level

**Biomechanical (8):** muscle_activity, joint_angles, gait_speed, cadence, step_count,
jump_height, ground_reaction_force, range_of_motion

**Environmental (4):** ambient_temperature, humidity, altitude, playing_surface

**Workload (4):** training_intensity, training_duration, training_load, fatigue_index

**Athlete Profile (2):** age, bmi

### Target Variable

| Class | Label | Count | % |
|---|---|---|---|
| 0 | Healthy | 9,868 | 64.0% |
| 1 | Low Risk | 3,238 | 21.0% |
| 2 | Injured | 2,314 | 15.0% |

### Key EDA Findings

1. **Top predictors:** `recovery_score`, `sleep_quality`, and `fatigue_index` are the
   strongest linear predictors of injury — by a wide margin over environmental features.
2. **Environmental features are weak:** humidity, ambient_temperature, and altitude show
   near-zero correlation with injury. They are retained but expected to contribute little.
3. **ACWR is a strong signal:** The Acute:Chronic Workload Ratio (3-session load /
   7-session baseline) visually precedes Class 2 injury events in longitudinal plots.
4. **Injury clustering:** 34.71% of injuries occur in back-to-back sessions. Median gap
   between injury events is 2 sessions — compounding risk is real.
5. **100% of athletes** experienced at least one Class 2 injury event across 6 months.
6. **Multicollinearity:** Strong correlation between training_load, training_duration,
   and training_intensity. Regularization (Dropout + L2) applied in the ANN to handle.
7. **Missing data is MAR:** Nulls are uniformly distributed across injury classes,
   justifying KNN imputation (preserves local structure).
8. **Class imbalance (4.26:1)** motivates SMOTE oversampling on the training set.

---

## 3. Architecture

```
Raw CSV Data
     │
     ▼
┌─────────────────────────────┐
│   02_preprocessing.ipynb    │
│                             │
│  Sort → Rolling Features    │
│  → Encode → Split →         │
│  KNN Impute → Scale →       │
│  SMOTE                      │
└────────────┬────────────────┘
             │ saves artifacts
             ▼
┌─────────────────────────────┐
│        /models/             │
│  knn_imputer.joblib         │
│  standard_scaler.joblib     │
│  fortis_ann.keras           │
│                             │
│        /data/processed/     │
│  processed_data.npz         │
│  model_schema.json          │
└────────────┬────────────────┘
             │ loaded by
             ▼
┌─────────────────────────────┐
│    FastAPI Backend          │
│    backend/main.py          │
│                             │
│  POST /predict              │
│  GET  /athletes             │
│  GET  /athlete/{id}         │
│  GET  /athlete/{id}/history │
└────────────┬────────────────┘
             │ HTTP / REST
             ▼
┌─────────────────────────────┐
│    React Frontend           │
│                             │
│  Squad Dashboard            │
│  Athlete Profile View       │
│  Live Prediction Form       │
└─────────────────────────────┘
```

---

## 4. Tech Stack

### Machine Learning
| Tool | Purpose |
|---|---|
| Python 3.12 | Language |
| pandas, numpy | Data manipulation |
| scikit-learn | Preprocessing (KNNImputer, StandardScaler, metrics) |
| imbalanced-learn | SMOTE oversampling |
| TensorFlow / Keras | ANN model (trained on GPU via Sem-6 kernel) |
| joblib | Artifact serialization |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| Pydantic | Request/response validation and schemas |
| uvicorn | ASGI server |
| joblib / numpy | Load model and preprocessing artifacts |

### Frontend
| Tool | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| Tailwind CSS | Styling |
| Recharts | Time-series and risk charts |
| Axios | HTTP client for API calls |
| React Router | Page navigation |

### Environment
| Tool | Purpose |
|---|---|
| uv | Python package and environment management |
| Jupyter Lab | Notebook environment |
| FORTIS kernel | EDA and preprocessing notebooks (uv venv) |
| Sem-6 .ai kernel | Model training notebook (GPU-enabled) |
| Git | Version control |

---

## 5. Folder Structure

```
fortis/
│
├── data/
│   ├── raw/
│   │   └── multimodal_sports_injury_dataset.csv
│   ├── processed/
│   │   ├── processed_data.npz
│   │   └── model_schema.json
│   └── feature_groups.json
│
├── models/
│   ├── knn_imputer.joblib
│   ├── standard_scaler.joblib
│   └── fortis_ann.keras
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_preprocessing.ipynb
│   └── 03_model.ipynb
│
├── backend/
│   ├── main.py          ← FastAPI app and route definitions
│   ├── schemas.py       ← Pydantic input/output models
│   ├── predictor.py     ← Model loading and inference logic
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  ← Reusable UI components
│   │   ├── pages/       ← Dashboard, AthleteProfile, Predict
│   │   ├── api/         ← Axios API call functions
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── pyproject.toml
├── .python-version      ← Pinned to 3.12 via uv
├── .gitignore
├── README.md            ← Setup and run instructions
└── PROJECT.md           ← This file — full project direction
```

---

## 6. Key Design Decisions

### Why rolling features?
Static session values don't capture accumulated fatigue. A single high training_load
session is less dangerous than three consecutive ones. Rolling 3-session and 7-session
windows encode this temporal context. The ACWR (roll3/roll7) is a validated sports
science metric used in professional performance monitoring.

### Why KNN Imputation over median?
Missing values (~3%) are uniformly distributed across classes (Missing At Random).
KNN imputation finds the 5 nearest neighbors in feature space and imputes from them,
preserving local structure and correlations between features. Median imputation ignores
these relationships entirely.

### Why SMOTE over class_weight='balanced'?
Both address class imbalance. SMOTE generates synthetic minority samples in feature
space, giving the model more diverse examples to learn from. class_weight simply
re-weights the loss function. For a 4.26:1 imbalance, SMOTE produces measurably better
F1 on the minority class (Injured) which is the most clinically important class to
predict correctly.

### Why StandardScaler over MinMaxScaler?
The dataset contains real outliers (confirmed in EDA — muscle_activity, step_count,
ground_reaction_force). MinMaxScaler uses range (max - min) and is therefore highly
sensitive to outliers. StandardScaler uses mean and standard deviation, which are more
robust. ANNs require scaled inputs; StandardScaler is the standard choice for tabular
data with outliers.

### Why ANN over Random Forest / XGBoost?
This is an AI course project — demonstrating deep learning is the requirement. However,
baseline comparisons against Logistic Regression and Random Forest are run in notebook
03 to demonstrate that the ANN meaningfully outperforms simpler approaches, justifying
the architectural choice.

### Preprocessing Order (critical)
The exact order matters. Any deviation introduces data leakage or incorrect results:

```
1. Sort by [athlete_id, session_id]
2. Compute rolling features (requires chronological order)
3. Drop early sessions (session_id <= 3)
4. Encode categoricals
5. Define X and y, drop metadata columns
6. Train/test split (stratified, 80/20)
7. Fit KNNImputer on X_train → transform X_train and X_test
8. Fit StandardScaler on X_train → transform X_train and X_test
9. Apply SMOTE to X_train_scaled → produces X_train_sm, y_train_sm
10. Save all artifacts
```

SMOTE is applied last and only to training data. Test data is never touched by SMOTE.
Imputer and scaler are fit only on training data. This is non-negotiable.

---

## 7. ML Pipeline

### Model: Artificial Neural Network (Keras/TensorFlow)

**Training kernel:** Sem-6 `.ai` Jupyter kernel (GPU-enabled, RTX 4060)

**Input:** ~35 features (22 original + 7 engineered rolling features + encoded
categoricals) after preprocessing

**Output:** Softmax over 3 classes (Healthy / Low Risk / Injured)

**Planned architecture:**
```
Input Layer  → [n_features]
Dense        → 256 units, ReLU, L2 regularization
BatchNorm    → stabilize activations
Dropout      → 0.3
Dense        → 128 units, ReLU, L2 regularization
BatchNorm
Dropout      → 0.3
Dense        → 64 units, ReLU
Dropout      → 0.2
Output       → 3 units, Softmax
```

**Loss:** categorical_crossentropy
**Optimizer:** Adam (lr=0.001, with ReduceLROnPlateau callback)
**Early stopping:** patience=15, restore best weights
**Evaluation metrics:** F1-macro, AUC-ROC (OvR), Confusion Matrix

**Baselines for comparison:**
- Logistic Regression
- Random Forest (100 estimators)

### Saved Artifacts

| File | Contents | Used by |
|---|---|---|
| `knn_imputer.joblib` | Fitted KNNImputer (n_neighbors=5) | FastAPI predictor |
| `standard_scaler.joblib` | Fitted StandardScaler | FastAPI predictor |
| `fortis_ann.keras` | Trained Keras model weights + architecture | FastAPI predictor |
| `processed_data.npz` | X_train, X_test, y_train, y_test arrays | Notebook 03 only |
| `model_schema.json` | Feature column list, class labels, rolling feature names | FastAPI + Frontend |

---

## 8. API Reference

**Base URL:** `http://localhost:8000`

### Endpoints

#### `POST /predict`
Submit a new session's sensor readings for a specific athlete and receive a risk
prediction with confidence scores.

**Request body:**
```json
{
  "athlete_id": 1,
  "session_data": {
    "heart_rate": 88.5,
    "body_temperature": 37.4,
    "recovery_score": 45.2,
    "fatigue_index": 71.3,
    "training_load": 920.0,
    "..."  : "... all feature columns from model_schema.json"
  }
}
```

**Response:**
```json
{
  "athlete_id": 1,
  "risk_class": 2,
  "risk_label": "Injured",
  "confidence": {
    "Healthy": 0.08,
    "Low Risk": 0.17,
    "Injured": 0.75
  },
  "acwr": 1.63,
  "top_risk_factors": ["recovery_score", "fatigue_index", "acwr"]
}
```

#### `GET /athletes`
Returns all 156 athletes with their latest session's risk status.

**Response:** Array of athlete summary objects with id, name, sport, risk_class,
risk_label, latest_session_id.

#### `GET /athlete/{athlete_id}`
Full profile for one athlete: demographics, sport, all-time injury history summary.

#### `GET /athlete/{athlete_id}/history`
All sessions for an athlete with risk scores and key metrics. Used to render the
timeline chart on the athlete profile page.

---

## 9. Frontend

### Pages

**Squad Dashboard (`/`)**
- Grid/list of all 156 athletes
- Color-coded risk badge per athlete (green / amber / red)
- Filter by sport_type, risk level, gender
- Click any athlete → navigate to their profile

**Athlete Profile (`/athlete/:id`)**
- Athlete demographics (age, BMI, sport, gender)
- Current risk level — large, prominent risk gauge
- Session history timeline chart (training_load, fatigue_index, recovery_score over
  sessions, with injury events marked)
- ACWR trend chart with danger zone (>1.5) highlighted
- Top risk contributing features for latest session
- Button to open the prediction form for a new session

**Live Prediction (`/athlete/:id/predict`)**
- Form pre-populated with the athlete's last known values
- All feature inputs grouped by modality (Physiological, Biomechanical, etc.)
- Submit → calls POST /predict → shows risk result with confidence breakdown
- Animated risk gauge updating live

### Design Direction

- Dark theme — deep navy/charcoal background, not pure black
- Accent: electric blue (#3B82F6) for primary actions, green/amber/red for risk states
- Premium data-dense aesthetic — think Whoop, Catapult, or Bloomberg Terminal
- Monospace font for numeric values, clean sans-serif for UI text
- Recharts for all data visualizations — consistent color palette throughout

---

## 10. Setup & Running the Project

### Prerequisites
- Python 3.12
- uv (Python package manager)
- Node.js 18+
- npm or yarn

### ML / Notebook Setup

```bash
# Clone the repo
git clone https://github.com/AZTR3K/Fortis
cd fortis

# Install Python dependencies
uv sync

# Register Jupyter kernel
uv run python -m ipykernel install --user --name=fortis --display-name "FORTIS (3.12)"

# Launch Jupyter
uv run jupyter lab
```

Run notebooks in order: 01 → 02 → 03.
Note: 03_model.ipynb must be run using the Sem-6 .ai kernel for GPU support.

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs` (FastAPI auto-generates Swagger UI).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

---

## 11. Notebook Guide

### 01_eda.ipynb — Exploratory Data Analysis
**Kernel:** FORTIS (3.12)
**Purpose:** Understand the dataset, identify patterns, validate assumptions.
**Key outputs:** feature_groups.json, EDA visualizations, summary findings.
**Run time:** ~2 minutes

### 02_preprocessing.ipynb — Feature Engineering & Preprocessing Pipeline
**Kernel:** FORTIS (3.12)
**Purpose:** Transform raw data into clean, model-ready arrays.
**Key outputs:** processed_data.npz, knn_imputer.joblib, standard_scaler.joblib,
model_schema.json
**Run time:** ~5 minutes (KNN imputation is the slow step)

### 03_model.ipynb — ANN Design, Training & Evaluation
**Kernel:** Sem-6 .ai (GPU)
**Purpose:** Build, train, evaluate, and save the FORTIS ANN.
**Key outputs:** fortis_ann.keras, evaluation metrics, baseline comparisons.
**Run time:** ~10–20 minutes with GPU

---

## 12. Presentation Story

The narrative arc for the presentation:

1. **The Problem** — Show a real stat: ~30% of professional athletes sustain a
   non-contact injury per season. Most are preventable with better workload management.

2. **The Data** — 156 athletes, 6 months, 4 sensor modalities. Show the EDA highlight:
   the longitudinal plot where training_load spikes and recovery crashes before a Class 2
   injury event. This is the "aha" moment.

3. **The Challenge** — 4.26:1 class imbalance. Environmental features are noisy.
   Static readings miss temporal patterns. Walk through how each decision (rolling
   features, SMOTE, KNN imputation) solves a specific real problem.

4. **The Model** — ANN architecture diagram. Training curves (loss and accuracy).
   Confusion matrix. F1-macro vs baselines. Lead with the Injured class F1 score —
   that's what matters clinically.

5. **The Product** — Live demo of FORTIS. Open the squad dashboard, click a high-risk
   athlete, submit a new session prediction. Show the risk gauge update in real time.

6. **The Impact** — One prevented injury = weeks of recovery saved, cost avoided,
   career protected. Frame the output not as a prediction but as an actionable alert
   that gives medical staff time to intervene.
