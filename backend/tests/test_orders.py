def test_create_order_success(admin_client):
    # 1. Create a customer
    cust_res = admin_client.post("/customers", json={
        "full_name": "Alice Mercer",
        "email": "alice@gmail.com",
        "phone_number": "555-1234"
    })
    cust_id = cust_res.json()["id"]

    # 2. Create products
    prod1_res = admin_client.post("/products", json={
        "name": "Laptop", "sku": "LP-100", "price": 999.99, "quantity_in_stock": 10
    })
    prod1_id = prod1_res.json()["id"]

    prod2_res = admin_client.post("/products", json={
        "name": "Mouse", "sku": "MS-200", "price": 25.50, "quantity_in_stock": 50
    })
    prod2_id = prod2_res.json()["id"]

    # 3. Place order
    order_res = admin_client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prod1_id, "quantity": 2},
            {"product_id": prod2_id, "quantity": 10}
        ]
    })
    assert order_res.status_code == 201
    order_data = order_res.json()

    # Assert correct calculated total: (2 * 999.99) + (10 * 25.50) = 1999.98 + 255.00 = 2254.98
    assert float(order_data["total_amount"]) == 2254.98
    assert len(order_data["items"]) == 2

    # Assert stock levels were decremented correctly
    p1_get = admin_client.get(f"/products/{prod1_id}").json()
    p2_get = admin_client.get(f"/products/{prod2_id}").json()
    assert p1_get["quantity_in_stock"] == 8
    assert p2_get["quantity_in_stock"] == 40


def test_insufficient_stock_fails(admin_client):
    cust_res = admin_client.post("/customers", json={
        "full_name": "Alice Mercer",
        "email": "alice@gmail.com",
        "phone_number": "555-1234"
    })
    cust_id = cust_res.json()["id"]

    prod_res = admin_client.post("/products", json={
        "name": "Laptop", "sku": "LP-100", "price": 999.99, "quantity_in_stock": 5
    })
    prod_id = prod_res.json()["id"]

    # Try to order more than available (5 items)
    order_res = admin_client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 6}
        ]
    })
    assert order_res.status_code == 400
    assert "Insufficient inventory stock" in order_res.json()["detail"]

    # Verify stock remained at 5 (no partial deduction occurred)
    prod_get = admin_client.get(f"/products/{prod_id}").json()
    assert prod_get["quantity_in_stock"] == 5


def test_transactional_rollback_on_partial_failure(admin_client):
    cust_res = admin_client.post("/customers", json={
        "full_name": "Alice Mercer",
        "email": "alice@gmail.com",
        "phone_number": "555-1234"
    })
    cust_id = cust_res.json()["id"]

    # Create Product A with sufficient stock
    prodA_res = admin_client.post("/products", json={
        "name": "Product A", "sku": "SKU-A", "price": 10.00, "quantity_in_stock": 10
    })
    prodA_id = prodA_res.json()["id"]

    # Create Product B with insufficient stock
    prodB_res = admin_client.post("/products", json={
        "name": "Product B", "sku": "SKU-B", "price": 20.00, "quantity_in_stock": 2
    })
    prodB_id = prodB_res.json()["id"]

    # Try to order 2 of A (valid) and 3 of B (invalid: exceeds stock of 2)
    order_res = admin_client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prodA_id, "quantity": 2},
            {"product_id": prodB_id, "quantity": 3}
        ]
    })
    assert order_res.status_code == 400

    # Assert atomic transaction rolled back completely - stock for A must STILL be 10!
    pA_get = admin_client.get(f"/products/{prodA_id}").json()
    pB_get = admin_client.get(f"/products/{prodB_id}").json()
    assert pA_get["quantity_in_stock"] == 10
    assert pB_get["quantity_in_stock"] == 2


def test_delete_order_restores_stock(admin_client):
    # 1. Prepare data
    cust_res = admin_client.post("/customers", json={
        "full_name": "Alice Mercer",
        "email": "alice@gmail.com",
        "phone_number": "555-1234"
    })
    cust_id = cust_res.json()["id"]

    prod_res = admin_client.post("/products", json={
        "name": "Laptop", "sku": "LP-100", "price": 100.00, "quantity_in_stock": 10
    })
    prod_id = prod_res.json()["id"]

    # 2. Place order for 3 items (stock drops to 7)
    order_res = admin_client.post("/orders", json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 3}]
    })
    order_id = order_res.json()["id"]

    p_after_order = admin_client.get(f"/products/{prod_id}").json()
    assert p_after_order["quantity_in_stock"] == 7

    # 3. Delete/Cancel order
    del_res = admin_client.delete(f"/orders/{order_id}")
    assert del_res.status_code == 200

    # 4. Verify stock restored back to 10!
    p_after_delete = admin_client.get(f"/products/{prod_id}").json()
    assert p_after_delete["quantity_in_stock"] == 10

