from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.cycle import Cycle
from app.schemas.cycle_schema import PredictionResponse
from app.services.prediction_engine import PredictionEngine

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

    result = PredictionEngine.predict(cycles)

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Not enough valid cycle data"
        )

    return result


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
    db:Session=Depends(get_db)
):

    cycle=db.query(Cycle).filter(Cycle.id==cycle_id).first()

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
    db:Session=Depends(get_db)
):

    cycle=db.query(Cycle).filter(Cycle.id==cycle_id).first()

    if not cycle:
        raise HTTPException(status_code=404,detail="Cycle not found")

    db.delete(cycle)
    db.commit()

    return {"message":"Cycle deleted"}