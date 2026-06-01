from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Product, Customer, Order
from app.schemas import DashboardSummary, LowStockProduct

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    
    # Define a low-stock threshold of 10 units
    low_stock_items = db.query(Product).filter(Product.quantity_in_stock < 10).order_by(Product.quantity_in_stock.asc()).all()
    
    formatted_low_stock = [
        LowStockProduct(
            id=item.id,
            name=item.name,
            sku=item.sku,
            quantity_in_stock=item.quantity_in_stock
        )
        for item in low_stock_items
    ]
    
    return DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=formatted_low_stock
    )
