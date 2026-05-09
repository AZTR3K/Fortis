import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import (
    SessionData,
    PredictionRequest,
    PredictionResponse,
    AthleteSession,
    AthleteOverview,
)
from backend.predictor import CLASSES, compute_rolling_features, predict

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "multimodal_sports_injury_dataset.csv"

df_store = pd.read_csv(RAW_DATA_PATH)
df_store.columns = (
    df_store.columns.str.strip().str.lower().str.replace(r"[\s\-]+", "_", regex=True)
)
df_store["injury_occurred"] = df_store["injury_occurred"].replace({1: 0, 2: 1})
df_store = df_store.sort_values(["athlete_id", "session_id"]).reset_index(drop=True)

app = FastAPI(
    title="FORTIS API",
    description="Athlete injury risk prediction system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "model": "FORTIS ANN", "version": "1.0.0"}


@app.get("/athletes")
def get_athletes() -> list[AthleteOverview]:
    last_rows = df_store.groupby("athlete_id").last().reset_index()
    result = []

    for _, row in last_rows.iterrows():
        result.append(
            AthleteOverview(
                athlete_id=row["athlete_id"],
                sport_type=row["sport_type"],
                gender=row["gender"],
                age=row["age"],
                latest_risk_class=int(row["injury_occurred"]),
                latest_risk_label=CLASSES[str(row["injury_occurred"])],
                latest_session_id=int(row["session_id"]),
            )
        )

    return result


@app.get("/athlete/{athlete_id}")
def get_athlete_id(athlete_id: int) -> AthleteOverview:
    df = df_store[df_store["athlete_id"] == athlete_id]
    if df.empty:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")

    row = df.iloc[0]
    result = AthleteOverview(
        athlete_id=row["athlete_id"],
        sport_type=row["sport_type"],
        gender=row["gender"],
        age=row["age"],
        latest_risk_class=int(row["injury_occurred"]),
        latest_risk_label=CLASSES[str(row["injury_occurred"])],
        latest_session_id=int(row["session_id"]),
    )

    return result


@app.get("/athlete/{athlete_id}/history")
def get_athlete_id_history(athlete_id: int) -> list[AthleteSession]:
    df = df_store[df_store["athlete_id"] == athlete_id]
    if df.empty:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")

    result = []
    for _, row in df.iterrows():
        result.append(
            AthleteSession(
                session_id=row["session_id"],
                risk_class=int(row["injury_occurred"]),
                risk_label=CLASSES[str(row["injury_occurred"])],
                confidence={},
                training_load=row["training_load"],
                fatigue_index=row["fatigue_index"],
                recovery_score=row["recovery_score"],
                acwr=0.0,
            ),
        )

    return result


@app.post("/predict")
def post_predict(request: PredictionRequest) -> PredictionResponse:
    session_dict = request.session_data.model_dump()
    history_dict = [s.model_dump() for s in request.history]
    rolling = compute_rolling_features(session_dict, history_dict)
    session_dict.update(rolling)

    session_dict["gender"] = 1 if session_dict["gender"] == "Male" else 0
    sport = session_dict.pop("sport_type")  # remove the string
    session_dict["sport_type_Other"] = 1 if sport == "Other" else 0
    session_dict["sport_type_Soccer"] = 1 if sport == "Soccer" else 0
    session_dict["sport_type_Track"] = 1 if sport == "Track" else 0

    result = predict(session_dict)

    return PredictionResponse(
        athlete_id=request.athlete_id,
        risk_class=result["risk_class"],
        risk_label=result["risk_label"],
        confidence=result["confidence"],
        acwr=result["acwr"],
        top_risk_features=result["top_risk_features"],
    )
