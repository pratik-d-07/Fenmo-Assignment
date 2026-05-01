from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="The amount must be greater than 0")
    category: str
    description: str
    date: datetime

class ExpenseCreate(ExpenseBase):
    idempotency_key: Optional[str] = None

class Expense(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
