from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Product name")
    sku: str = Field(..., min_length=1, description="Unique Stock Keeping Unit (SKU)")
    price: Decimal = Field(..., description="Product price")
    quantity_in_stock: int = Field(..., description="Available quantity in inventory")

    @field_validator('price')
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price must be a non-negative value")
        return v

    @field_validator('quantity_in_stock')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity in stock must be zero or greater")
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    sku: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = None
    quantity_in_stock: Optional[int] = None

    @field_validator('price')
    @classmethod
    def validate_price(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Price must be a non-negative value")
        return v

    @field_validator('quantity_in_stock')
    @classmethod
    def validate_quantity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Quantity in stock must be zero or greater")
        return v

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== CUSTOMER SCHEMAS ====================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Full name of customer")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: str = Field(..., min_length=1, description="Contact phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ORDER ITEM SCHEMAS ====================
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="Product ID")
    quantity: int = Field(..., description="Quantity of product ordered")

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity ordered must be greater than zero")
        return v

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


# ==================== ORDER SCHEMAS ====================
class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="Customer ID")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


# ==================== DASHBOARD SCHEMAS ====================
class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    quantity_in_stock: int

class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[LowStockProduct]
