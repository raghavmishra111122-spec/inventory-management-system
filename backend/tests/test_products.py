def test_create_product(admin_client):
    response = admin_client.post("/products", json={
        "name": "Keyboard",
        "sku": "KB-100",
        "price": 49.99,
        "quantity_in_stock": 20
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Keyboard"
    assert data["sku"] == "KB-100"
    assert float(data["price"]) == 49.99
    assert data["quantity_in_stock"] == 20
    assert "id" in data

def test_duplicate_sku_rejected(admin_client):
    # Register first product
    admin_client.post("/products", json={
        "name": "Keyboard A",
        "sku": "KB-100",
        "price": 49.99,
        "quantity_in_stock": 20
    })
    # Register second with duplicate SKU
    response = admin_client.post("/products", json={
        "name": "Keyboard B",
        "sku": "KB-100",
        "price": 59.99,
        "quantity_in_stock": 5
    })
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_invalid_price_and_quantity_rejected(admin_client):
    # Test negative price
    res_price = admin_client.post("/products", json={
        "name": "Invalid Price",
        "sku": "PR-INV",
        "price": -10.00,
        "quantity_in_stock": 5
    })
    assert res_price.status_code == 422 # Pydantic validation error

    # Test negative quantity
    res_qty = admin_client.post("/products", json={
        "name": "Invalid Qty",
        "sku": "QTY-INV",
        "price": 10.00,
        "quantity_in_stock": -5
    })
    assert res_qty.status_code == 422

def test_update_product(admin_client):
    # Register product
    res = admin_client.post("/products", json={
        "name": "Keyboard",
        "sku": "KB-100",
        "price": 49.99,
        "quantity_in_stock": 20
    })
    prod_id = res.json()["id"]

    # Perform updates
    update_res = admin_client.put(f"/products/{prod_id}", json={
        "name": "Updated Keyboard",
        "price": 54.99,
        "quantity_in_stock": 15
    })
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Updated Keyboard"
    assert float(data["price"]) == 54.99
    assert data["quantity_in_stock"] == 15
    assert data["sku"] == "KB-100" # Unchanged

def test_delete_product(admin_client):
    res = admin_client.post("/products", json={
        "name": "Keyboard",
        "sku": "KB-100",
        "price": 49.99,
        "quantity_in_stock": 20
    })
    prod_id = res.json()["id"]

    del_res = admin_client.delete(f"/products/{prod_id}")
    assert del_res.status_code == 200
    
    get_res = admin_client.get(f"/products/{prod_id}")
    assert get_res.status_code == 404

