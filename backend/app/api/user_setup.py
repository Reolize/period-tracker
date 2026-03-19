from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.user_setup import UserSetup
from app.schemas.user_setup_schema import UserSetupUpsert, UserSetupResponse


router = APIRouter(prefix="/user-setup", tags=["user-setup"])


@router.get("/", response_model=UserSetupResponse | None)
def get_user_setup(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    setup = (
        db.query(UserSetup)
        .filter(UserSetup.user_id == current_user.id)
        .first()
    )
    return setup


@router.put("/", response_model=UserSetupResponse)
def upsert_user_setup(
    payload: UserSetupUpsert,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    setup = (
        db.query(UserSetup)
        .filter(UserSetup.user_id == current_user.id)
        .first()
    )

    if not setup:
        setup = UserSetup(
            user_id=current_user.id,
            last_period_start_date=payload.last_period_start_date,
            avg_period_length_days=payload.avg_period_length_days,
            avg_cycle_length_days=payload.avg_cycle_length_days,
            contraception_method=payload.contraception_method,
            app_goal=payload.app_goal,
        )
        db.add(setup)
    else:
        setup.last_period_start_date = payload.last_period_start_date
        setup.avg_period_length_days = payload.avg_period_length_days
        setup.avg_cycle_length_days = payload.avg_cycle_length_days
        setup.contraception_method = payload.contraception_method
        setup.app_goal = payload.app_goal

    db.commit()
    db.refresh(setup)
    return setup

