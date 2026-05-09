# Imports
import json
import keras
import joblib
import numpy as np
from pathlib import Path

# File path constants
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
PROCESSED_DIR = BASE_DIR / "data/processed"

# Load Artifacts
imputer = joblib.load(MODELS_DIR / "knn_imputer.joblib")
scaler = joblib.load(MODELS_DIR / "standard_scaler.joblib")
model = keras.models.load_model(MODELS_DIR / "fortis_ann.keras")

with open(PROCESSED_DIR / "model_schema.json") as f:
    schema = json.load(f)

FEATURE_COLUMNS = schema["feature_columns"]
CLASSES = schema["classes"]


# Rolling feature computation function
def compute_rolling_features(current_session: dict, history: list[dict]) -> dict:
    all_sessions = history + [current_session]

    # Training
    all_loads = [
        s["training_load"] for s in all_sessions if s.get("training_load") is not None
    ]
    if not all_loads:
        raise ValueError("No valid training_load values in session history")

    last_3 = all_loads[-3:]
    training_roll3 = sum(last_3) / len(last_3)
    last_7 = all_loads[-7:]
    training_roll7 = sum(last_7) / len(last_7)

    # Fatigue
    all_fatigue = [
        s["fatigue_index"] for s in all_sessions if s.get("fatigue_index") is not None
    ]
    if not all_fatigue:
        raise ValueError("No valid fatigue_index values in session history")

    last_3 = all_fatigue[-3:]
    fatigue_roll3 = sum(last_3) / len(last_3)
    last_7 = all_fatigue[-7:]
    fatigue_roll7 = sum(last_7) / len(last_7)

    # Recovery
    all_recovery = [
        s["recovery_score"] for s in all_sessions if s.get("recovery_score") is not None
    ]
    if not all_recovery:
        raise ValueError("No valid recovery_score in session history")

    last_3 = all_recovery[-3:]
    recovery_roll3 = sum(last_3) / len(last_3)
    last_7 = all_recovery[-7:]
    recovery_roll7 = sum(last_7) / len(last_7)

    # ACWR
    acwr = training_roll3 / training_roll7 if training_roll7 != 0 else 0.0
    acwr = min(acwr, 2.5)

    return {
        "training_load_roll3": training_roll3,
        "training_load_roll7": training_roll7,
        "fatigue_roll3": fatigue_roll3,
        "fatigue_roll7": fatigue_roll7,
        "recovery_roll3": recovery_roll3,
        "recovery_roll7": recovery_roll7,
        "acwr": acwr,
    }


# Main predict function
def predict(features: dict) -> dict:
    ordered_values = [features.get(col) for col in FEATURE_COLUMNS]
    if not ordered_values:
        raise ValueError(
            "No feature values could be extracted — check FEATURE_COLUMNS and input dict"
        )

    input_array = np.array(ordered_values).reshape(1, -1)

    imputed_data = imputer.transform(input_array)
    scaled_data = scaler.transform(imputed_data)

    proba = model.predict(scaled_data, verbose=0)
    if proba.shape[0] == 0:
        raise ValueError("Model returned empty predictions array")

    risk_class = int(np.argmax(proba[0]))

    confidence_dict = {CLASSES[str(i)]: float(proba[0][i]) for i in range(len(CLASSES))}

    return {
        "risk_class": risk_class,
        "risk_label": CLASSES[str(risk_class)],
        "confidence": confidence_dict,
        "acwr": features.get("acwr", 0.0),
    }
