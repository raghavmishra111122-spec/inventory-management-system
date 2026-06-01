from sqlalchemy.orm import Session
from app.models import Customer
from app.schemas import CustomerCreate
from fastapi import HTTPException, status

def get_customers(db: Session):
    return db.query(Customer).order_by(Customer.id.asc()).all()

def get_customer_by_id(db: Session, customer_id: int):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email).first()

def create_customer(db: Session, customer_in: CustomerCreate):
    # Enforce email uniqueness
    existing = get_customer_by_email(db, customer_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_in.email}' already exists"
        )
        
    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def delete_customer(db: Session, customer_id: int):
    customer = get_customer_by_id(db, customer_id)
    db.delete(customer)
    db.commit()
    return {"message": "Customer successfully deleted"}
