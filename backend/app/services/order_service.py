from sqlalchemy.orm import Session
from app.models import Order, OrderItem, Product, Customer
from app.schemas import OrderCreate
from fastapi import HTTPException, status
from decimal import Decimal

def get_orders(db: Session):
    # Eagerly load items and customer to ensure clean API output
    orders = db.query(Order).order_by(Order.id.desc()).all()
    # Format each order with customer and product names for visual utility
    for order in orders:
        order.customer_name = order.customer.full_name if order.customer else "Unknown"
        for item in order.items:
            item.product_name = item.product.name if item.product else "Unknown Product"
            item.product_sku = item.product.sku if item.product else "Unknown SKU"
    return orders

def get_order_by_id(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    order.customer_name = order.customer.full_name if order.customer else "Unknown"
    for item in order.items:
        item.product_name = item.product.name if item.product else "Unknown Product"
        item.product_sku = item.product.sku if item.product else "Unknown SKU"
    return order

def create_order(db: Session, order_in: OrderCreate):
    # 1. Validate customer existence
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} does not exist"
        )

    # 2. Check that items exist in request
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one product item"
        )

    # 3. Create the database Order object
    db_order = Order(
        customer_id=order_in.customer_id,
        total_amount=Decimal('0.00'),
        status="Active"
    )
    db.add(db_order)
    db.flush() # Populate db_order.id

    running_total = Decimal('0.00')
    
    # 4. Process each item inside transaction
    for item_in in order_in.items:
        # Fetch product
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_in.product_id} does not exist"
            )

        # Enforce server-side stock validation
        if product.quantity_in_stock < item_in.quantity:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory stock for product '{product.name}' (SKU: {product.sku}). Requested: {item_in.quantity}, Available: {product.quantity_in_stock}"
            )

        # Decrement product stock levels
        product.quantity_in_stock -= item_in.quantity

        # Capture price at order time and calculate line total
        captured_price = product.price
        line_total = captured_price * item_in.quantity
        running_total += line_total

        # Build order item
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=captured_price,
            line_total=line_total
        )
        db.add(db_item)

    # 5. Save calculated order total
    db_order.total_amount = running_total
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process database transaction: {str(e)}"
        )

    db.refresh(db_order)
    return get_order_by_id(db, db_order.id)

def delete_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )

    try:
        # Atomic stock restoration back to products
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity

        # Remove the order (cascades automatically to order_items based on ondelete="CASCADE")
        db.delete(order)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete order and restore stock: {str(e)}"
        )

    return {"message": "Order successfully deleted and inventory restored"}
