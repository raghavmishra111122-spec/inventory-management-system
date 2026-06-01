from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.schemas import OrderCreate, OrderOut
from app.services import order_service
from app.services.auth_service import require_admin, require_employee_or_admin

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.get("", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return order_service.get_orders(db)

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return order_service.get_order_by_id(db, order_id)

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return order_service.create_order(db, order_in)

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return order_service.delete_order(db, order_id)

