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

class Drink(Base):
    __tablename__ = "drinks_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Drinks API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DrinkCreate(BaseModel):
    name: str
    price: float

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/drinks")
def list_drinks(db: Session = Depends(get_db)):
    return db.query(Drink).all()

@app.post("/drinks")
def create_drink(drink: DrinkCreate, db: Session = Depends(get_db)):
    item = Drink(name=drink.name, price=drink.price)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.put("/drinks/{drink_id}")
def update_drink(drink_id: int, drink: DrinkCreate, db: Session = Depends(get_db)):
    item = db.query(Drink).filter(Drink.id == drink_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Drink not found")
    item.name = drink.name
    item.price = drink.price
    db.commit()
    db.refresh(item)
    return item

@app.delete("/drinks/{drink_id}")
def delete_drink(drink_id: int, db: Session = Depends(get_db)):
    item = db.query(Drink).filter(Drink.id == drink_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Drink not found")
    db.delete(item)
    db.commit()
    return {"deleted": drink_id}