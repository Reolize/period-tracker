from sqlalchemy.orm import Session
from datetime import timedelta

from app.models.cycle import Cycle
from app.services.prediction_engine import PredictionEngine


class PredictionService:

    @staticmethod
    def get_fertility_prediction(db: Session, user_id: int):

        cycles = (
            db.query(Cycle)
            .filter(Cycle.user_id == user_id)
            .order_by(Cycle.start_date)
            .all()
        )

        if len(cycles) < 1: # Reduced to 1 to allow ML fallback to work even with just 1 logged cycle
            return None

        result = PredictionEngine.predict(db, user_id, cycles)

        if not result:
            return None

        return result