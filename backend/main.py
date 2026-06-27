from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import User, Review, AnonymousBoard, ChatMessage 

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

# 👇 NAYA ROUTE: User Delete Karne Ke Liye
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    with Session(engine) as session:
        # Pehle check karo ki user database mein hai ya nahi
        user = session.get(User, user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Agar user mil gaya, toh usko delete kar do
        session.delete(user)
        session.commit()
        return {"message": f"User with ID {user_id} deleted successfully"}
        
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

# ==========================================
# CHAT / DIRECT MESSAGES ROUTES
# ==========================================

@app.post("/api/chat")
def send_message(msg: ChatMessage):
    with Session(engine) as session:
        session.add(msg)
        session.commit()
        session.refresh(msg)
        return msg

@app.get("/api/chat/{user_id}")
def get_user_messages(user_id: int):
    with Session(engine) as session:
        statement = select(ChatMessage).where(
            (ChatMessage.sender_id == user_id) | (ChatMessage.receiver_id == user_id)
        )
        return session.exec(statement).all()