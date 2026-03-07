from sqlalchemy.orm import Session
from statistics import mean, stdev
from datetime import timedelta
import math
from app.models.cycle import Cycle


def predict_next_cycle(db: Session, user_id: int):

    cycles = db.query(Cycle).filter(
        Cycle.user_id == user_id,
        Cycle.cycle_length != None,
        Cycle.period_length != None
    ).order_by(Cycle.start_date.asc()).all()

    if len(cycles) < 4:
        return None

    cycles = cycles[-6:]

    cycle_lengths = [c.cycle_length for c in cycles]
    period_lengths = [c.period_length for c in cycles]

    def weighted_prediction(values):

        avg = mean(values)
        sd = stdev(values) if len(values) > 1 else 0

        if sd > 0:
            values = [
                v for v in values
                if abs((v - avg) / sd) <= 2
            ]

        weights = list(range(1, len(values) + 1))

        weighted_sum = sum(v * w for v, w in zip(values, weights))
        weighted_avg = round(weighted_sum / sum(weights))

        std_dev = round(stdev(values), 2) if len(values) > 1 else 0

        return weighted_avg, std_dev, len(values)

    cycle_avg, cycle_sd, cycle_n = weighted_prediction(cycle_lengths)
    period_avg, period_sd, period_n = weighted_prediction(period_lengths)

    last_cycle = cycles[-1]

    predicted_start = last_cycle.start_date + timedelta(days=cycle_avg)
    predicted_end = predicted_start + timedelta(days=period_avg - 1)

    cycle_variability = max(0, 1 - (cycle_sd / cycle_avg))
    data_score = min(1, cycle_n / 6)

    confidence = round((cycle_variability * 0.7 + data_score * 0.3) * 100, 2)

    return {
        "predicted_next_start": predicted_start,
        "predicted_next_end": predicted_end,
        "cycle_length_prediction": cycle_avg,
        "period_length_prediction": period_avg,
        "cycle_std_dev": cycle_sd,
        "period_std_dev": period_sd,
        "confidence_score": confidence
    }


def create_cycle(db: Session, user_id: int, start_date, end_date):

    period_length = None

    if end_date:
        period_length = (end_date - start_date).days + 1

    cycle = Cycle(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        period_length=period_length
    )

    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    previous_cycle = db.query(Cycle).filter(
        Cycle.user_id == user_id,
        Cycle.start_date < start_date
    ).order_by(Cycle.start_date.desc()).first()

    if previous_cycle:
        previous_cycle.cycle_length = (
            start_date - previous_cycle.start_date
        ).days
        db.commit()

    return cycle

def get_cycle_heatmap(db, user_id):
    cycles = db.query(Cycle).filter(Cycle.user_id == user_id).all()

    return [
        {
            "start_date": c.start_date,
            "length": c.length
        }
        for c in cycles
    ]
    
class CycleService:

    def get_cycle_heatmap(self, db: Session, user_id: int):

        cycles = db.query(Cycle).filter(
            Cycle.user_id == user_id
        ).all()

        heatmap = []

        for c in cycles:
            heatmap.append({
                "date": c.start_date,
                "intensity": 1
            })

        return heatmap


cycle_service = CycleService()