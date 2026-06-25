from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import User, Review, AnonymousBoard 

app = FastAPI(title="Corporate Feedback API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Backend server is running successfully!"}

# ==========================================
# USERS ROUTES
# ==========================================

@app.post("/api/users")
def create_user(user: User):
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@app.get("/api/users")
def get_all_users():
    with Session(engine) as session:
        return session.exec(select(User)).all()
        
# ==========================================
# REVIEWS ROUTES
# ==========================================
        
@app.post("/api/reviews")
def create_review(review: Review):
    with Session(engine) as session:
        session.add(review)
        session.commit()
        session.refresh(review)
        return review

@app.get("/api/reviews/{emp_id}")
def get_employee_reviews(emp_id: int):
    with Session(engine) as session:
        statement = select(Review).where(Review.employee_id == emp_id)
        return session.exec(statement).all()

# ==========================================
# ANONYMOUS BOARD ROUTES
# ==========================================

@app.post("/api/anonymous")
def create_anonymous_msg(msg: AnonymousBoard):
    with Session(engine) as session:
        session.add(msg)
        session.commit()
        session.refresh(msg)
        return msg

@app.get("/api/anonymous")
def get_all_anonymous_msgs():
    with Session(engine) as session:
        return session.exec(select(AnonymousBoard)).all()