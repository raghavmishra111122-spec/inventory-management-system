def test_create_customer(client):
    response = client.post("/customers", json={
        "full_name": "John Doe",
        "email": "john.doe@gmail.com",
        "phone_number": "+1234567890"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "John Doe"
    assert data["email"] == "john.doe@gmail.com"
    assert data["phone_number"] == "+1234567890"
    assert "id" in data

def test_duplicate_email_rejected(client):
    # Register first customer
    client.post("/customers", json={
        "full_name": "John Doe",
        "email": "john.doe@gmail.com",
        "phone_number": "+1234567890"
    })
    # Try duplicate
    response = client.post("/customers", json={
        "full_name": "Johnny",
        "email": "john.doe@gmail.com",
        "phone_number": "+9876543210"
    })
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_invalid_email_format_rejected(client):
    response = client.post("/customers", json={
        "full_name": "Bad Email",
        "email": "not-an-email-address",
        "phone_number": "12345"
    })
    assert response.status_code == 422 # Pydantic EmailStr validation

def test_delete_customer(client):
    res = client.post("/customers", json={
        "full_name": "John Doe",
        "email": "john.doe@gmail.com",
        "phone_number": "+1234567890"
    })
    cust_id = res.json()["id"]

    del_res = client.delete(f"/customers/{cust_id}")
    assert del_res.status_code == 200

    get_res = client.get(f"/customers/{cust_id}")
    assert get_res.status_code == 404
