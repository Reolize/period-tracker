from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.cycle import Cycle
from app.models.user_setup import UserSetup
from app.schemas.cycle_schema import PredictionResponse, HealthAlert as HealthAlertSchema, AIInsightsResponse
from app.services.prediction_engine import PredictionEngine
from app.services.health_utils import assess_cycle_health
from app.services.ai_insights_service import AIInsightsService
from app.services.symptom_pattern_service import symptom_pattern_service

from app.schemas.cycle_schema import CycleCreate, CycleResponse
from app.services.cycle_service import create_cycle

router = APIRouter(prefix="/cycles", tags=["cycles"])


@router.get("/predict", response_model=PredictionResponse)
def predict_cycle(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.asc()).all()

    # Get user's setup for prediction mode preferences
    setup = db.query(UserSetup).filter(UserSetup.user_id == current_user.id).first()
    prediction_mode = setup.prediction_mode if setup else "auto"
    manual_cycle_length = setup.manual_cycle_length if setup else 28

    result = PredictionEngine.predict(
        db, 
        current_user.id, 
        cycles,
        prediction_mode=prediction_mode,
        manual_cycle_length=manual_cycle_length
    )

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Not enough valid cycle data"
        )

    # Attach health alerts based on cycle history
    alerts = assess_cycle_health(cycles)
    result["health_alerts"] = [
        HealthAlertSchema(code=a.code, level=a.level, message=a.message) for a in alerts
    ] or None

    return result


@router.get("/insights", response_model=AIInsightsResponse)
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get personalized AI insights including:
    - Symptom probability predictions
    - Dynamic luteal phase calculation
    - Smart recommendations
    """
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.asc()).all()

    # Get user's setup for prediction mode preferences
    setup = db.query(UserSetup).filter(UserSetup.user_id == current_user.id).first()
    prediction_mode = setup.prediction_mode if setup else "smart"
    manual_cycle_length = setup.manual_cycle_length if setup else 28

    # Get prediction data to calculate cycle metrics
    prediction_result = PredictionEngine.predict(
        db, 
        current_user.id, 
        cycles,
        prediction_mode=prediction_mode,
        manual_cycle_length=manual_cycle_length
    )

    # Generate AI insights
    insights = AIInsightsService.generate_insights(
        db=db,
        user_id=current_user.id,
        cycles=cycles,
        cycle_std_dev=prediction_result.get("cycle_std_dev") if prediction_result else None,
        avg_cycle_length=prediction_result.get("cycle_length_prediction") if prediction_result else None,
        confidence_score=prediction_result.get("confidence_score") if prediction_result else None
    )

    return AIInsightsResponse(
        symptom_probabilities=insights["symptom_probabilities"],
        luteal_phase=insights["luteal_phase"],
        recommendation=insights["recommendation"],
        cycle_regularity=insights["cycle_regularity"]
    )


@router.get("/symptoms/patterns")
def get_symptom_patterns(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get top symptom patterns based on user's daily logs.
    Returns top 4 most frequent symptoms with their typical cycle day ranges.
    """
    patterns = symptom_pattern_service.get_top_symptoms_patterns(
        db=db,
        user_id=current_user.id,
        top_n=4
    )
    return {"patterns": patterns}


@router.get("/export")
def export_cycle_data(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.asc()).all()

    dataset = [
        {
            "start_date": c.start_date,
            "end_date": c.end_date,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length,
        }
        for c in cycles
    ]

    return JSONResponse(content=dataset)

@router.post("/", response_model=CycleResponse)
def create_cycle_api(
    data: CycleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cycle = create_cycle(
        db,
        current_user.id,
        data.start_date,
        data.end_date
    )

    return cycle

@router.get("/")
def get_cycles(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.desc()).all()

    return cycles


@router.put("/{cycle_id}")
def update_cycle(
    cycle_id:int,
    cycle_data:CycleCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):

    cycle=db.query(Cycle).filter(Cycle.id==cycle_id, Cycle.user_id==current_user.id).first()

    if not cycle:
        raise HTTPException(status_code=404,detail="Cycle not found")

    cycle.start_date=cycle_data.start_date
    cycle.end_date=cycle_data.end_date

    db.commit()
    db.refresh(cycle)

    return cycle

@router.delete("/{cycle_id}")
def delete_cycle(
    cycle_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):

    cycle=db.query(Cycle).filter(Cycle.id==cycle_id, Cycle.user_id==current_user.id).first()

    if not cycle:
        raise HTTPException(status_code=404,detail="Cycle not found")

    db.delete(cycle)
    db.commit()

    return {"message":"Cycle deleted"}