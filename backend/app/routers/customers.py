from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.schemas import CustomerCreate, CustomerOut
from app.services import customer_service
from app.services.auth_service import require_admin, require_employee_or_admin

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)

@router.get("", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return customer_service.get_customers(db)

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return customer_service.get_customer_by_id(db, customer_id)

@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return customer_service.create_customer(db, customer_in)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return customer_service.delete_customer(db, customer_id)

