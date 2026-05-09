from typing import Optional, Literal
from pydantic import BaseModel, Field


class SessionData(BaseModel):
    # Physiological
    heart_rate: Optional[float] = Field(
        default=None, description="Heart rate in beats per minute (bpm)"
    )
    body_temperature: Optional[float] = Field(
        default=None, description="Core body temperature in degrees Celsius"
    )
    hydration_level: Optional[float] = Field(
        default=None, description="Body hydration percentage"
    )
    sleep_quality: Optional[float] = Field(
        default=None, description="Sleep quality score on a scale (0-10)"
    )
    recovery_score: Optional[float] = Field(
        default=None, description="Physical recovery percentage"
    )
    stress_level: Optional[float] = Field(
        default=None, description="Physiological stress index"
    )

    # Biomechanical
    muscle_activity: Optional[float] = Field(
        default=None, description="Muscle recruitment intensity (EMG)"
    )
    joint_angles: Optional[float] = Field(
        default=None, description="Dominant joint angle in degrees"
    )
    gait_speed: Optional[float] = Field(
        default=None, description="Walking/running speed in meters per second"
    )
    cadence: Optional[float] = Field(
        default=None, description="Step frequency in steps per minute"
    )
    step_count: Optional[int] = Field(
        default=None, description="Total number of steps in the session"
    )
    jump_height: Optional[float] = Field(
        default=None, description="Vertical jump height in meters"
    )
    ground_reaction_force: Optional[float] = Field(
        default=None, description="Peak force exerted on the ground in Newtons"
    )
    range_of_motion: Optional[float] = Field(
        default=None, description="Joint flexibility/range in degrees"
    )

    # Environmental
    ambient_temperature: Optional[float] = Field(
        default=None, description="Environment temperature in degrees Celsius"
    )
    humidity: Optional[float] = Field(
        default=None, description="Relative humidity percentage"
    )
    altitude: Optional[float] = Field(
        default=None, description="Elevation above sea level in meters"
    )
    playing_surface: Optional[int] = Field(
        default=None, description="Categorical index of the playing terrain (0-4)"
    )

    # Workload
    training_intensity: Optional[float] = Field(
        default=None, description="Intensity score of the training session"
    )
    training_duration: Optional[float] = Field(
        default=None, description="Total duration of the session in minutes"
    )
    training_load: Optional[float] = Field(
        default=None, description="Total workload (Intensity x Duration)"
    )
    fatigue_index: Optional[float] = Field(
        default=None, description="Cumulative fatigue score"
    )

    # Athlete Profile
    sport_type: Literal["Soccer", "Basketball", "Track", "Other"] = Field(
        ..., description="Athlete's primary sport"
    )
    gender: Literal["Male", "Female"] = Field(..., description="Biological gender")
    age: Optional[int] = Field(default=None, description="Athlete's age in years")
    bmi: Optional[float] = Field(default=None, description="Body Mass Index (kg/m²)")


class PredictionRequest(BaseModel):
    athlete_id: int
    session_data: SessionData
    history: Optional[list[SessionData]] = []


class PredictionResponse(BaseModel):
    athlete_id: int
    risk_class: int
    risk_label: str
    confidence: dict[str, float]
    acwr: float
    top_risk_features: list[str]


class AthleteSession(BaseModel):
    session_id: int
    risk_class: int
    risk_label: str
    confidence: dict[str, float]
    training_load: float
    fatigue_index: float
    recovery_score: float
    acwr: float


class AthleteOverview(BaseModel):
    athlete_id: int
    sport_type: str
    gender: str
    age: float
    latest_risk_class: int
    latest_risk_label: str
    latest_session_id: int
