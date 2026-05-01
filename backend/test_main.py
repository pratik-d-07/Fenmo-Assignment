from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from .main import app
from .database import Base, get_db

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_expense():
    expense_data = {
        "amount": 50.5,
        "category": "Test",
        "description": "Test expense",
        "date": "2023-10-27T10:00:00Z",
        "idempotency_key": str(uuid.uuid4())
    }
    response = client.post("/expenses", json=expense_data)
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 50.5
    assert data["category"] == "Test"
    assert "id" in data

def test_create_expense_idempotency():
    idem_key = str(uuid.uuid4())
    expense_data = {
        "amount": 100,
        "category": "Food",
        "description": "Lunch",
        "date": "2023-10-27T12:00:00Z",
        "idempotency_key": idem_key
    }
    
    # First request
    response1 = client.post("/expenses", json=expense_data)
    assert response1.status_code == 200
    data1 = response1.json()
    
    # Second request with same idempotency key
    response2 = client.post("/expenses", json=expense_data)
    assert response2.status_code == 200
    data2 = response2.json()
    
    # Verify both returned the exact same object (same ID)
    assert data1["id"] == data2["id"]

def test_get_expenses():
    response = client.get("/expenses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
