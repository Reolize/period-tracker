from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.user_setup import UserSetup
from app.schemas.user_setup_schema import UserSetupUpsert, UserSetupResponse, UserGoalUpdate


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
            date_of_birth=payload.date_of_birth,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
            pregnancy_due_date=payload.pregnancy_due_date,
            pregnancy_weeks_override=payload.pregnancy_weeks_override,
            pronouns=payload.pronouns,
            has_pcos_or_irregular=payload.has_pcos_or_irregular,
        )
        db.add(setup)
    else:
        setup.last_period_start_date = payload.last_period_start_date
        setup.avg_period_length_days = payload.avg_period_length_days
        setup.avg_cycle_length_days = payload.avg_cycle_length_days
        setup.contraception_method = payload.contraception_method
        setup.app_goal = payload.app_goal
        setup.date_of_birth = payload.date_of_birth
        setup.height_cm = payload.height_cm
        setup.weight_kg = payload.weight_kg
        setup.pregnancy_due_date = payload.pregnancy_due_date
        setup.pregnancy_weeks_override = payload.pregnancy_weeks_override
        setup.pronouns = payload.pronouns
        setup.has_pcos_or_irregular = payload.has_pcos_or_irregular

    db.commit()
    db.refresh(setup)
    return setup


@router.patch("/goal", response_model=UserSetupResponse)
def update_user_goal(
    payload: UserGoalUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    setup = (
        db.query(UserSetup)
        .filter(UserSetup.user_id == current_user.id)
        .first()
    )

    if not setup:
        setup = UserSetup(user_id=current_user.id)
        db.add(setup)

    setup.app_goal = payload.app_goal
    setup.pregnancy_due_date = payload.pregnancy_due_date
    setup.pregnancy_weeks_override = payload.pregnancy_weeks_override

    db.commit()
    db.refresh(setup)
    return setup

