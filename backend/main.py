from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import User, Review  # Ek hi line mein dono import kar liye

app = FastAPI(title="Corporate Feedback API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # "*" ka matlab kisi bhi port se request aane do
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server start hote hi database tables banayega
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Backend server is running successfully!"}

@app.get("/api/test")
def test_api():
    return {"status": "ok", "data": "This is test data for frontend"}

# ==========================================
# USERS ROUTES
# ==========================================

# 1. CREATE USER (Database mein naya user save karne ke liye)
@app.post("/api/users")
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

# 2. GET ALL USERS (Database se saare users nikalne ke liye)
@app.get("/api/users")
def get_all_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users
        
# ==========================================
# REVIEWS ROUTES
# ==========================================
        
# 3. CREATE REVIEW (Naya Review save karne ke liye)
@app.post("/api/reviews")
def create_review(review: Review):
    with Session(engine) as session:
        session.add(review)
        session.commit()
        session.refresh(review)
        return review

# 4. GET EMPLOYEE REVIEWS (Kisi ek Employee ke saare reviews dekhne ke liye)
@app.get("/api/reviews/{emp_id}")
def get_employee_reviews(emp_id: int):
    with Session(engine) as session:
        # Sirf us employee ke reviews layega jiski ID match hogi
        statement = select(Review).where(Review.employee_id == emp_id)
        reviews = session.exec(statement).all()
        return reviews