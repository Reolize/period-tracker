from datetime import date as date_type

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.daily_log import DailyLog
from app.schemas.daily_log_schema import DailyLogUpsert, DailyLogResponse
from app.services.cycle_service import create_cycle, has_active_cycle_on_date


router = APIRouter(prefix="/daily-logs", tags=["daily-logs"])


@router.get("/", response_model=list[DailyLogResponse])
def list_daily_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    start_date: date_type | None = Query(default=None),
    end_date: date_type | None = Query(default=None),
):
    q = db.query(DailyLog).filter(DailyLog.user_id == current_user.id)

    if start_date:
        q = q.filter(DailyLog.log_date >= start_date)
    if end_date:
        q = q.filter(DailyLog.log_date <= end_date)

    logs = q.order_by(DailyLog.log_date.desc()).all()
    return logs


@router.put("/", response_model=DailyLogResponse)
def upsert_daily_log(
    payload: DailyLogUpsert,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # If user logs menstrual bleeding and no active cycle covers that date,
    # create a new cycle start automatically.
    if payload.bleeding_flow != "none" and not has_active_cycle_on_date(db, current_user.id, payload.log_date):
        create_cycle(
            db=db,
            user_id=current_user.id,
            start_date=payload.log_date,
            end_date=None,
        )

    log = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == current_user.id,
            DailyLog.log_date == payload.log_date,
        )
        .first()
    )

    if not log:
        log = DailyLog(
            user_id=current_user.id,
            log_date=payload.log_date,
            bleeding_flow=payload.bleeding_flow,
            discharge_type=payload.discharge_type,
            physical_symptoms=payload.physical_symptoms,
            moods=payload.moods,
            sex=payload.sex,
            bbt_celsius=payload.bbt_celsius,
            notes=payload.notes,
        )
        db.add(log)
    else:
        log.bleeding_flow = payload.bleeding_flow
        log.discharge_type = payload.discharge_type
        log.physical_symptoms = payload.physical_symptoms
        log.moods = payload.moods
        log.sex = payload.sex
        log.bbt_celsius = payload.bbt_celsius
        log.notes = payload.notes

    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_date}")
def delete_daily_log(
    log_date: date_type,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    log = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == current_user.id,
            DailyLog.log_date == log_date,
        )
        .first()
    )

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}

