# FORTIS
### Deep Learning for Athlete Workload Management & Injury Forecasting

> A professional-grade, full-stack AI system that predicts musculoskeletal injury risk in athletes before it happens — combining multimodal wearable sensor data, a binary ANN, a FastAPI inference server, and a premium React clinical dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [Dataset](#dataset)
4. [Key Design Decisions](#key-design-decisions)
5. [ML Pipeline](#ml-pipeline)
6. [Model Architecture](#model-architecture)
7. [Results](#results)
8. [System Architecture](#system-architecture)
9. [Tech Stack](#tech-stack)
10. [Project Structure](#project-structure)
11. [Setup & Running](#setup--running)
12. [API Reference](#api-reference)
13. [Frontend](#frontend)
14. [Notebook Guide](#notebook-guide)

---

## Overview

**FORTIS** (Latin: *strong, resilient*) is an early-warning injury prediction system designed for use by sports medical staff and performance coaches. By analyzing multimodal time-series data from wearable sensors — spanning physiology, biomechanics, environment, and training workload — FORTIS uses an Artificial Neural Network to identify hidden patterns of fatigue and flag athletes at elevated injury risk before they step onto the pitch.

### What FORTIS Is

| Layer | Description |
|---|---|
| **ML Model** | Binary ANN trained on 11,961 real sessions, achieving 88.2% recall on the Injured class |
| **REST API** | FastAPI server serving live predictions with rolling feature computation at inference time |
| **Dashboard** | React clinical dashboard — squad overview, athlete profiles, session timelines, live predictions |

### What FORTIS Is Not

FORTIS is a decision support tool, not a diagnostic system. Predictions are probabilistic signals to inform coaching and medical decisions — not clinical diagnoses.

---

## The Problem

Non-contact musculoskeletal injuries in professional sports are largely driven by:

- **Cumulative fatigue** — repeated high-load sessions without adequate recovery
- **ACWR spikes** — acute workload exceeding chronic baseline (danger threshold: > 1.5)
- **Poor recovery markers** — low sleep quality combined with elevated stress
- **Reactive management** — injuries detected after they occur, not before

Traditional monitoring is reactive. FORTIS is proactive.

---

## Dataset

**Source:** [Multimodal Sports Injury Prediction Dataset — Kaggle](https://www.kaggle.com/datasets/anjalibhegam/multimodal-sports-injury-dataset)
**License:** CC BY-NC-SA 4.0 (non-commercial use only)

| Property | Value |
|---|---|
| Total samples | 15,420 |
| Athletes | 156 (68% Male, 32% Female) |
| Sessions per athlete | ~99 sequential sessions |
| Sports | Soccer 35% · Basketball 25% · Track 20% · Other 20% |
| Sensor features | 22 across 4 modalities |
| Original target classes | 3 — Healthy (64%) · Low Risk (21%) · Injured (15%) |
| Final formulation | Binary — Healthy (85%) · Injured (15%) |
| Missing data | ~3% across 6 columns |

### Feature Modalities

```
Physiological (6):   heart_rate · body_temperature · hydration_level
                     sleep_quality · recovery_score · stress_level

Biomechanical (8):   muscle_activity · joint_angles · gait_speed · cadence
                     step_count · jump_height · ground_reaction_force · range_of_motion

Environmental (4):   ambient_temperature · humidity · altitude · playing_surface

Workload (4):        training_intensity · training_duration · training_load · fatigue_index

Athlete Profile (2): age · bmi
```

### EDA Key Findings

1. **Top predictors:** `recovery_score`, `sleep_quality`, and `fatigue_index` dominate correlation rankings by a wide margin over environmental features
2. **Environmental features are weak:** humidity, altitude, and ambient temperature show near-zero correlation with injury — retained but contribute little
3. **ACWR precedes injury:** longitudinal plots show training_load spikes and recovery crashes 1–3 sessions before injury events — rolling features are essential
4. **Injury clustering:** 34.71% of injuries occur in back-to-back sessions; median gap between events is 2 sessions
5. **Missing data is MAR:** nulls uniformly distributed across injury classes — justifies KNN imputation
6. **4.26:1 class imbalance** between Healthy and Injured requiring deliberate handling

---

## Key Design Decisions

### Decision 1 — Rolling Features over Static Sessions

Static session values don't capture accumulated fatigue. A single high training_load session is less dangerous than three consecutive ones. FORTIS engineers 7 rolling features per session:

- `training_load_roll3`, `training_load_roll7` — 3 and 7-session means
- `fatigue_roll3`, `fatigue_roll7`
- `recovery_roll3`, `recovery_roll7`
- `acwr` = roll3 / roll7, clipped at 2.5 (validated sports science metric)

### Decision 2 — Binary Reformulation (Critical)

The original 3-class formulation (Healthy / Low Risk / Injured) was abandoned after confirming that **Low Risk has no predictive signal.**

KDE plots across all 6 top predictors showed Healthy and Low Risk distributions as near-identical on every feature. No classifier — regardless of architecture, sampling strategy, or loss weighting — can reliably separate two classes that are indistinguishable in feature space.

**Resolution:** Low Risk (class 1) collapsed into Healthy (class 0) via `{1: 0, 2: 1}`. Binary problem: 0 = Healthy, 1 = Injured.

**Clinical justification:** Low Risk is an ambiguous transitional label. A binary model that reliably identifies Injured athletes (Recall: 0.882) is more actionable in a real sports medicine context than a 3-class model hedging across an indeterminate middle category.

### Decision 3 — SMOTE Removed

Initial SMOTE training produced 98.9% val_accuracy but test macro F1 of only 0.4965. The model learned synthetic interpolated distributions, not real class boundaries. SMOTE was removed entirely. Class imbalance is handled via `class_weight='balanced'` in `model.fit()` — keeping the training set on real data (11,961 samples).

### Decision 4 — KNN Imputation

Missing values (~3%) are uniformly distributed across classes (MAR). KNNImputer with `n_neighbors=5` preserves local feature structure. Always fit on training data only and transform both sets separately.

### Decision 5 — StandardScaler over MinMaxScaler

Dataset contains real outliers confirmed in EDA. MinMaxScaler uses range and is sensitive to outliers. StandardScaler uses mean and standard deviation — more robust for this dataset. ANNs require scaled inputs; StandardScaler is the correct choice here.

### Decision 6 — Clinical Optimisation over Statistical Optimisation

The ANN's macro F1 (0.70) trails Logistic Regression (0.72). This is a deliberate trade-off. `class_weight='balanced'` pushes the model toward maximising Injured recall at the cost of precision.

**A false alarm = a rest day. A missed injury = weeks on the sideline.**

In clinical deployment context, this is the correct direction.

---

## ML Pipeline

The preprocessing order is non-negotiable. Any deviation introduces data leakage or incorrect results:

```
1.  Sort by [athlete_id, session_id]          ← chronological order required for rolling
2.  Binary remap: {1→0, 2→1}                 ← before any feature engineering
3.  Compute rolling features                  ← 7 new engineered columns
4.  Drop sessions 1–3 per athlete             ← insufficient rolling history
5.  One-hot encode sport_type (drop_first)    ← 3 dummy columns, Basketball is base
6.  Encode gender: Male=0, Female=1
7.  Define X and y, drop metadata columns
8.  Train/test split: 80/20, stratified       ← fit nothing before this line
9.  KNNImputer: fit on X_train, transform both
10. StandardScaler: fit on X_train, transform both
11. class_weight='balanced' in model.fit()    ← replaces SMOTE, applied at training time
```

**Final dimensions:**
- X_train: (11,961 × 35) — 22 original + 7 rolling + 6 encoded
- X_test:  (2,991 × 35)

---

## Model Architecture

```
Input (35 features)
    │
Dense(256, ReLU, L2=1e-4)
BatchNormalization()
Dropout(0.3)
    │
Dense(128, ReLU, L2=1e-4)
BatchNormalization()
Dropout(0.3)
    │
Dense(64, ReLU)
Dropout(0.2)
    │
Dense(2, Softmax)
```

| Config | Value |
|---|---|
| Loss | Binary Crossentropy |
| Optimizer | Adam (lr = 5e-4) |
| Batch size | 256 |
| Early stopping | patience=15, restore_best_weights=True |
| LR decay | ReduceLROnPlateau factor=0.5, patience=7 |
| Class weighting | balanced |
| Trainable params | ~42,000 |
| Saved format | `.keras` (Keras 3 native format) |

---

## Results

| Model | Macro F1 | AUC-ROC | Injured Recall | Injured Precision |
|---|---|---|---|---|
| Logistic Regression | 0.7227 | 0.9039 | — | — |
| Random Forest | 0.6793 | 0.8940 | — | — |
| **FORTIS ANN** | **0.7018** | **0.8998** | **0.8820** | **0.5477** |

The ANN's lower macro F1 relative to Logistic Regression is a deliberate trade-off. Class weighting pushed the model toward maximising Injured recall. AUC-ROC of 0.900 confirms strong discriminative ability. The headline metric for clinical use is **Injured Recall: 88.2%**.

---

## System Architecture

```
Raw CSV Data
     │
     ▼
02_preprocessing.ipynb
  Sort → Binary Remap → Rolling Features
  → Encode → Split → KNN Impute
  → StandardScale
     │
     ▼  saves artifacts
┌──────────────────────────────────────┐
│  models/                             │
│    fortis_ann.keras                  │
│    knn_imputer.joblib                │
│    standard_scaler.joblib            │
│  data/processed/                     │
│    model_schema.json                 │
│    processed_data.npz                │
└──────────────┬───────────────────────┘
               │ loaded at startup
               ▼
  FastAPI Backend (backend/)
    predictor.py  — model loading, rolling feature computation, inference
    schemas.py    — Pydantic request/response models
    main.py       — routes, CORS, in-memory athlete store
               │
               │ HTTP / REST (proxied via Vite /api)
               ▼
  React Frontend (frontend/)
    Dashboard      — squad overview, hero stats, athlete cards
    AthleteProfile — session timeline, ACWR chart, risk gauge
    Predict        — live prediction form with rolling history
```

---

## Tech Stack

### Machine Learning
| Tool | Version | Purpose |
|---|---|---|
| Python | 3.12 | Language |
| TensorFlow | 2.21.0 | ANN training and inference |
| Keras | 3.14.0 | Model API (multi-backend) |
| scikit-learn | 1.8.0 | Preprocessing, metrics, baselines |
| imbalanced-learn | 0.14.1 | SMOTE (explored, removed) |
| pandas | 3.0.2 | Data manipulation |
| numpy | 2.4.4 | Array operations |
| joblib | 1.5.3 | Artifact serialization |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| Pydantic v2 | Request/response validation |
| Uvicorn | ASGI server |
| pandas | In-memory athlete data store |

### Frontend
| Tool | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| Tailwind CSS v4 | Utility styling |
| Recharts | Session timeline and ACWR charts |
| Axios | HTTP client |
| React Router v6 | Page navigation |
| Lucide React | Icon system |

### Environment
| Tool | Purpose |
|---|---|
| uv | Python package and environment management |
| Python 3.12 (pinned) | Runtime via `.python-version` |
| FORTIS kernel | EDA + preprocessing notebooks | Model Training

---

## Project Structure

```
fortis/
│
├── data/
│   ├── raw/
│   │   └── multimodal_sports_injury_dataset.csv
│   ├── processed/
│   │   ├── processed_data.npz          ← X_train, X_test, y_train, y_test
│   │   ├── model_schema.json           ← feature columns, class labels
│   │   ├── class_overlap_kde.png       ← EDA: justification for binary reformulation
│   │   ├── confusion_matrix.png
│   │   └── training_curves.png
│   └── feature_groups.json             ← modality groupings (EDA reference)
│
├── models/
│   ├── fortis_ann.keras                ← trained model (Keras 3 format)
│   ├── knn_imputer.joblib              ← fitted KNNImputer
│   └── standard_scaler.joblib          ← fitted StandardScaler
│
├── notebooks/
│   ├── 01_eda.ipynb                    ← FORTIS kernel
│   ├── 02_preprocessing.ipynb          ← FORTIS kernel
│   └── 03_model.ipynb                  ← FORTIS kernel
│
├── backend/
│   ├── main.py                         ← FastAPI app, routes, CORS, data store
│   ├── schemas.py                      ← Pydantic models
│   ├── predictor.py                    ← artifact loading, rolling features, inference
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js               ← axios instance, all API functions
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Shell.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── ui/
│   │   │   │   ├── RiskBadge.jsx
│   │   │   │   ├── RiskGauge.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   └── charts/
│   │   │       ├── SessionTimeline.jsx
│   │   │       └── AcwrChart.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AthleteProfile.jsx
│   │   │   └── Predict.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── pyproject.toml
├── .python-version                     ← pinned to 3.12
├── uv.lock
└── README.md
```

---

## Setup & Running

### Prerequisites

- Python 3.12
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Node.js 18+
- Notebooks 01, 02 and 03 must be run before starting the backend (they generate model artifacts)

### 1. Python Environment

```bash
git clone https://github.com/AZTR3K/Fortis
cd fortis

# Install Python dependencies
uv sync

# Register Jupyter kernel
uv run python -m ipykernel install --user --name=fortis --display-name "FORTIS (3.12)"

# Launch Jupyter
uv run jupyter lab
```

Run notebooks in order: `01_eda.ipynb` → `02_preprocessing.ipynb` → `03_model.ipynb`

### 2. Backend

```bash
# From the project root
uv add fastapi uvicorn joblib tensorflow

# Start the server
uv run uvicorn backend.main:app --reload --port 8000
```

API docs (auto-generated Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000` — no CORS issues in development.

> Both the backend and frontend must be running simultaneously for the app to work.

---

## API Reference

**Base URL:** `http://localhost:8000`
**Interactive docs:** `http://localhost:8000/docs`

---

### `GET /`
Health check.

**Response:**
```json
{ "status": "ok", "model": "FORTIS ANN", "version": "1.0.0" }
```

---

### `GET /athletes`
Returns all 156 athletes with their latest session's risk status (from the raw dataset).

**Response:** Array of `AthleteOverview` objects.

```json
[
  {
    "athlete_id": 1,
    "sport_type": "Basketball",
    "gender": "Female",
    "age": 18.0,
    "latest_risk_class": 0,
    "latest_risk_label": "Healthy",
    "latest_session_id": 99
  }
]
```

---

### `GET /athlete/{athlete_id}`
Full profile for one athlete — demographics and latest risk from the dataset.

**Response:** Single `AthleteOverview` object.

---

### `GET /athlete/{athlete_id}/history`
All sessions for one athlete with key metrics. Used to render the session timeline and ACWR chart.

**Response:** Array of `AthleteSession` objects.

```json
[
  {
    "session_id": 1,
    "risk_class": 0,
    "risk_label": "Healthy",
    "confidence": {},
    "training_load": 712.4,
    "fatigue_index": 38.2,
    "recovery_score": 74.1,
    "acwr": 0.0
  }
]
```

---

### `POST /predict`
Run a live inference for a specific athlete. The server computes rolling features from session history and runs the ANN.

**Request body:**
```json
{
  "athlete_id": 1,
  "session_data": {
    "heart_rate": 95.0,
    "body_temperature": 37.8,
    "hydration_level": 62.0,
    "sleep_quality": 4.5,
    "recovery_score": 38.0,
    "stress_level": 0.78,
    "muscle_activity": 420.0,
    "joint_angles": 142.0,
    "gait_speed": 2.1,
    "cadence": 148.0,
    "step_count": 9800,
    "jump_height": 0.42,
    "ground_reaction_force": 1850.0,
    "range_of_motion": 118.0,
    "ambient_temperature": 28.0,
    "humidity": 65.0,
    "altitude": 120.0,
    "playing_surface": 2,
    "training_intensity": 7.5,
    "training_duration": 95.0,
    "training_load": 712.0,
    "fatigue_index": 68.0,
    "sport_type": "Soccer",
    "gender": "Male",
    "age": 26,
    "bmi": 23.4
  },
  "history": []
}
```

All sensor fields are `Optional[float]` — missing values are handled by the KNN imputer. `sport_type` and `gender` are required.

`history` is an array of prior `SessionData` objects. Include the last 7 sessions for meaningful ACWR computation. When empty, ACWR defaults to 1.0.

**Response:**
```json
{
  "athlete_id": 1,
  "risk_class": 1,
  "risk_label": "Injured",
  "confidence": {
    "Healthy": 0.4325,
    "Injured": 0.5675
  },
  "acwr": 1.63,
  "top_risk_features": ["cadence", "stress_level", "recovery_roll7"]
}
```

`top_risk_features` — the 3 features with the highest absolute scaled values post-StandardScaler. Computed after scaling so all features are on the same scale.

---

## Frontend

### Pages

| Page | Route | Description |
|---|---|---|
| Squad Dashboard | `/` | All 156 athletes as cards with hero stats, sport-color coding, risk badges, ACWR display, filter and search |
| Athlete Profile | `/athlete/:id` | Session timeline chart, ACWR trend, risk gauge, top risk factors, stat cards |
| Live Prediction | `/athlete/:id/predict` | Sensor input form pre-populated from last session, live inference result with confidence breakdown and alert |

### Design System

- **Theme:** Deep navy dark (`#080d1a` base, `#0d1526` surfaces)
- **Accent:** Electric blue `#3b82f6`
- **Risk states:** `#10b981` Healthy · `#ef4444` Injured · `#f59e0b` ACWR warning
- **Typography:** Inter (UI) · JetBrains Mono (all numeric values)
- **Animation:** `fadeUp`, `fadeIn`, `scaleIn` entrance animations with staggered delays · hover lift on cards · arc draw on gauge · pulse ring on Injured badges
- **Card design:** Sport-color top stripe · risk-tinted background for injured athletes · hover elevation with box shadow

---

## Notebook Guide

| Notebook | Kernel | Purpose | Key outputs |
|---|---|---|---|
| `01_eda.ipynb` | FORTIS (3.12) | Dataset exploration, correlation analysis, temporal plots, class imbalance audit | `feature_groups.json`, EDA visualizations |
| `02_preprocessing.ipynb` | FORTIS (3.12) | Full preprocessing pipeline — binary remap, rolling features, encoding, split, impute, scale | `processed_data.npz`, `knn_imputer.joblib`, `standard_scaler.joblib`, `model_schema.json` |
| `03_model.ipynb` | FORTIS (3.12) | ANN architecture, training, evaluation, baseline comparison | `fortis_ann.keras`, training curves, confusion matrix, classification report |

---

## Modelling Decision Log

Three pivots made during development — each documented with root cause analysis:

| # | Problem | Root Cause | Resolution |
|---|---|---|---|
| 01 | SMOTE validation illusion — 98.9% val_accuracy, 0.4965 test F1 | Model learned synthetic interpolated distributions, not real boundaries | Removed SMOTE entirely |
| 02 | Low Risk class collapse — no improvement after removing SMOTE | Healthy and Low Risk are indistinguishable in feature space (confirmed by KDE) | Collapsed Low Risk → Healthy, binary reformulation |
| 03 | ANN macro F1 (0.70) trails Logistic Regression (0.72) | class_weight='balanced' trades precision for recall | Accepted — Injured recall 0.882 is the clinically correct metric to optimise |

---

*Built with TensorFlow · FastAPI · React · Keras · scikit-learn*
*Dataset: CC BY-NC-SA 4.0 — Anjali Bhegam et al., 2025*
