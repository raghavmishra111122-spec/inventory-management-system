from fastapi import FastAPI, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import Base, engine, get_db
from app.config import settings

# Modular routers import
from app.routers import products, customers, orders, dashboard, auth

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Production-Ready backend database API orchestrator.",
    version="1.0.0"
)


# Automatically build database schema on application startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Parse CORS Origins from environment configs
allowed_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routes
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)

@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    Checks database health and connectivity status.
    """
    try:
        # Perform a basic query to test connectivity
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return Response(
            content=f'{{"status": "unhealthy", "error": "{str(e)}"}}',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json"
        )

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to the Inventory & Order Management API. Access interactive documentation at /docs"
    }
