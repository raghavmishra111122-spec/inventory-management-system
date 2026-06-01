from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.schemas import ProductCreate, ProductUpdate, ProductOut
from app.services import product_service
from app.services.auth_service import require_admin, require_employee_or_admin

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return product_service.get_products(db)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_employee_or_admin)):
    return product_service.get_product_by_id(db, product_id)

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return product_service.create_product(db, product_in)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return product_service.update_product(db, product_id, product_in)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    return product_service.delete_product(db, product_id)

