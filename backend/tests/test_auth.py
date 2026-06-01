import pytest

def test_signup_success(client):
    response = client.post("/auth/signup", json={
        "full_name": "Test User",
        "email": "test@gmail.com",
        "password": "secure_password_123",
        "role": "Employee"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Test User"
    assert data["email"] == "test@gmail.com"
    assert data["role"] == "Employee"
    assert "id" in data
    assert "password_hash" not in data  # Never expose hashed password


def test_signup_duplicate_email_rejected(client):
    client.post("/auth/signup", json={
        "full_name": "First User",
        "email": "duplicate@gmail.com",
        "password": "password123",
        "role": "Admin"
    })
    
    response = client.post("/auth/signup", json={
        "full_name": "Second User",
        "email": "duplicate@gmail.com",
        "password": "password456",
        "role": "Employee"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    # Register first
    client.post("/auth/signup", json={
        "full_name": "Login User",
        "email": "login@gmail.com",
        "password": "login_pass_321",
        "role": "Employee"
    })
    
    # Login
    response = client.post("/auth/login", json={
        "email": "login@gmail.com",
        "password": "login_pass_321"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@gmail.com"


def test_login_bad_credentials_rejected(client):
    response = client.post("/auth/login", json={
        "email": "nonexistent@gmail.com",
        "password": "wrong_password"
    })
    assert response.status_code == 401


def test_get_profile_requires_auth(client):
    response = client.get("/auth/profile")
    assert response.status_code == 401


def test_get_profile_success(employee_client):
    response = employee_client.get("/auth/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "employee@system.com"
    assert data["role"] == "Employee"


def test_employee_blocked_from_admin_actions(employee_client):
    # Regular Employee cannot create a product (requires Admin)
    response = employee_client.post("/products", json={
        "name": "Employee Keyboard",
        "sku": "KB-EMP",
        "price": 29.99,
        "quantity_in_stock": 5
    })
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]


def test_customer_email_is_masked_for_others(admin_client):
    # Create customer as Admin
    admin_client.post("/customers", json={
        "full_name": "Secret Customer",
        "email": "secret.email.address@gmail.com",
        "phone_number": "555-999"
    })
    
    # Retrieve customer list as Admin
    response = admin_client.get("/customers")
    assert response.status_code == 200
    customers = response.json()
    assert len(customers) > 0
    
    # Email should be masked: s***********************s@gmail.com
    first_customer = customers[0]
    assert first_customer["email"] != "secret.email.address@gmail.com"
    assert first_customer["email"].startswith("s")
    assert first_customer["email"].endswith("@gmail.com")
    assert "*" in first_customer["email"]
