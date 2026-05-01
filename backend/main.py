from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from . import models, schemas, database
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/expenses", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db)
):
    # Idempotency check
    if expense.idempotency_key:
        existing_expense = db.query(models.Expense).filter(
            models.Expense.idempotency_key == expense.idempotency_key
        ).first()
        if existing_expense:
            return existing_expense

    try:
        db_expense = models.Expense(
            amount=expense.amount,
            category=expense.category,
            description=expense.description,
            date=expense.date,
            idempotency_key=expense.idempotency_key
        )
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        # If it failed due to unique constraint on idempotency_key (race condition)
        if expense.idempotency_key:
            existing_expense = db.query(models.Expense).filter(
                models.Expense.idempotency_key == expense.idempotency_key
            ).first()
            if existing_expense:
                return existing_expense
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/expenses", response_model=List[schemas.Expense])
def read_expenses(
    category: Optional[str] = None,
    sort: Optional[str] = Query(None, pattern="^(date_desc|date_asc)$"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Expense)
    
    if category:
        query = query.filter(models.Expense.category == category)
    
    if sort == "date_desc":
        query = query.order_by(models.Expense.date.desc(), models.Expense.created_at.desc())
    elif sort == "date_asc":
        query = query.order_by(models.Expense.date.asc(), models.Expense.created_at.asc())
    else:
        # Default sort
        query = query.order_by(models.Expense.date.desc(), models.Expense.created_at.desc())
        
    return query.all()

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    # Helper to get unique categories for the frontend filter
    categories = db.query(models.Expense.category).distinct().all()
    return [c[0] for c in categories]
