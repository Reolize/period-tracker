from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models import user  # สำคัญ: ต้อง import model เพื่อ register table
from app.models import cycle  # noqa: F401
from app.models import user_setup  # noqa: F401
from app.models import daily_log  # noqa: F401

from app.api import test_db
from app.api import cycle
from app.api import auth
from app.api import protected
from app.api import prediction
from app.api import user_setup as user_setup_api
from app.api import daily_log as daily_log_api


# สร้าง app ก่อนทุกอย่าง
app = FastAPI(title="Period Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# สร้าง table
Base.metadata.create_all(bind=engine)

# include routers หลังจากสร้าง app แล้ว
app.include_router(test_db.router)
app.include_router(cycle.router)
app.include_router(auth.router)
app.include_router(protected.router)
app.include_router(prediction.router)
app.include_router(user_setup_api.router)
app.include_router(daily_log_api.router)
