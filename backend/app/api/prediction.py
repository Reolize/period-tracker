from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db

from app.models.cycle import Cycle
from app.models.user import User

from app.schemas.prediction_schema import PredictionResponse

from app.services.prediction_service import PredictionService
from app.services.cycle_service import cycle_service

from app.api.auth_deps import get_current_user


router = APIRouter(prefix="/predict", tags=["Predict"])


@router.get("/")
def predict_next_cycle(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    cycles = db.query(Cycle).order_by(Cycle.start_date).all()

    if len(cycles) < 3:
        return {"prediction": None, "message": "Not enough data"}

    lengths = []

    for i in range(1, len(cycles)):
        diff = (cycles[i].start_date - cycles[i-1].start_date).days
        lengths.append(diff)

    avg_cycle = sum(lengths) / len(lengths)

    last_cycle = cycles[-1].start_date
    predicted = last_cycle + timedelta(days=round(avg_cycle))

    return {
        "predicted_next_period": predicted
    }


@router.get("/heatmap")
def cycle_heatmap(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return cycle_service.get_cycle_heatmap(db, user.id)


@router.get("/heatmap")
def cycle_heatmap(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return cycle_service.get_cycle_heatmap(db, user.id)