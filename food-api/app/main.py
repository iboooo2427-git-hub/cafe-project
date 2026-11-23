import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Food(Base):
    __tablename__ = "food_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Food API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FoodCreate(BaseModel):
    name: str
    price: float

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/food")
def list_food(db: Session = Depends(get_db)):
    return db.query(Food).all()

@app.post("/food")
def create_food(food: FoodCreate, db: Session = Depends(get_db)):
    item = Food(name=food.name, price=food.price)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/food/{food_id}")
def update_food(food_id: int, food: FoodCreate, db: Session = Depends(get_db)):
    item = db.query(Food).filter(Food.id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    item.name = food.name
    item.price = food.price
    db.commit()
    db.refresh(item)
    return item

@app.delete("/food/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db)):
    item = db.query(Food).filter(Food.id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(item)
    db.commit()
    return {"deleted": food_id}