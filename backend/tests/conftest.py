import os
# Force testing environment to use isolated SQLite database to avoid PostgreSQL connection attempts
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.db import Base, get_db
from app.models import Product, Customer, Order, OrderItem
from app.main import app

# Use an in-memory SQLite engine with StaticPool to share connection across threads/sessions
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Setup: Create tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Teardown: Drop tables
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    from fastapi.testclient import TestClient
    
    # Override get_db dependency
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_client(db_session, client):
    from app.services.auth_service import hash_password, create_access_token
    from app.models import User
    
    # Seed an Admin user
    admin_user = User(
        full_name="System Admin",
        email="admin@system.com",
        password_hash=hash_password("admin_pass_123"),
        role="Admin"
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    # Generate token
    token = create_access_token(data={"sub": admin_user.email})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture(scope="function")
def employee_client(db_session, client):
    from app.services.auth_service import hash_password, create_access_token
    from app.models import User
    
    # Seed an Employee user
    employee_user = User(
        full_name="Regular Employee",
        email="employee@system.com",
        password_hash=hash_password("employee_pass_123"),
        role="Employee"
    )
    db_session.add(employee_user)
    db_session.commit()
    db_session.refresh(employee_user)
    
    # Generate token
    token = create_access_token(data={"sub": employee_user.email})
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

