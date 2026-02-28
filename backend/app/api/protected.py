from fastapi import APIRouter, Depends
from app.api.auth_deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def read_current_user(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
    }