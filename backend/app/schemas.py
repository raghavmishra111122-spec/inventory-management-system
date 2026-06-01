from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
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

# Helper to mask emails
def mask_email(email: str) -> str:
    if not email:
        return ""
    try:
        parts = email.split("@")
        if len(parts) == 2:
            name, domain = parts
            if len(name) <= 2:
                masked_name = name[0] + "*" * (len(name) - 1)
            else:
                masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
            return f"{masked_name}@{domain}"
    except Exception:
        pass
    return "******"

class CustomerOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def mask_customer_email(cls, data):
        # We mask email to protect privacy for all queries of others
        if hasattr(data, "email"):
            return {
                "id": data.id,
                "full_name": data.full_name,
                "email": mask_email(data.email),
                "phone_number": data.phone_number,
                "created_at": data.created_at
            }
        elif isinstance(data, dict) and "email" in data:
            data_copy = data.copy()
            data_copy["email"] = mask_email(data_copy["email"])
            return data_copy
        return data

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


# ==================== AUTHENTICATION SCHEMAS ====================
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., description="Admin or Employee")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ["Admin", "Employee"]:
            raise ValueError("Role must be either 'Admin' or 'Employee'")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserOutMasked(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def mask_user_email(cls, data):
        if hasattr(data, "email"):
            return {
                "id": data.id,
                "full_name": data.full_name,
                "email": mask_email(data.email),
                "role": data.role,
                "created_at": data.created_at
            }
        elif isinstance(data, dict) and "email" in data:
            data_copy = data.copy()
            data_copy["email"] = mask_email(data_copy["email"])
            return data_copy
        return data

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

