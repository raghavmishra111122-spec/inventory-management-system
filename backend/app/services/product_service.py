from sqlalchemy.orm import Session
from app.models import Product
from app.schemas import ProductCreate, ProductUpdate
from fastapi import HTTPException, status

def get_products(db: Session):
    return db.query(Product).order_by(Product.id.asc()).all()

def get_product_by_id(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Product with ID {product_id} not found"
        )
    return product

def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()

def create_product(db: Session, product_in: ProductCreate):
    # Enforce SKU uniqueness
    existing = get_product_by_sku(db, product_in.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
    
    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def update_product(db: Session, product_id: int, product_in: ProductUpdate):
    product = get_product_by_id(db, product_id)
    
    # Enforce SKU uniqueness if modified
    if product_in.sku is not None and product_in.sku != product.sku:
        existing = get_product_by_sku(db, product_in.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{product_in.sku}' already exists"
            )
            
    # Update fields
    if product_in.name is not None:
        product.name = product_in.name
    if product_in.sku is not None:
        product.sku = product_in.sku
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.quantity_in_stock is not None:
        product.quantity_in_stock = product_in.quantity_in_stock
        
    db.commit()
    db.refresh(product)
    return product

def delete_product(db: Session, product_id: int):
    product = get_product_by_id(db, product_id)
    db.delete(product)
    db.commit()
    return {"message": "Product successfully deleted"}
