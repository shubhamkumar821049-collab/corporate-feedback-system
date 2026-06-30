from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import User, Review, AnonymousBoard, ChatMessage

import random
import string


# ============================================================
# APP
# ============================================================

app = FastAPI(title="Corporate Feedback API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup():
    create_db_and_tables()


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Corporate Feedback API Running Successfully"
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def generate_manager_code():
    """
    Example:
    MGR-A82X9P
    """
    random_part = "".join(
        random.choices(
            string.ascii_uppercase + string.digits,
            k=6
        )
    )

    return f"MGR-{random_part}"


def manager_code_exists(code: str):
    with Session(engine) as session:
        manager = session.exec(
            select(User).where(User.manager_code == code)
        ).first()

        return manager


def create_unique_manager_code():

    while True:

        code = generate_manager_code()

        if not manager_code_exists(code):
            return code


# ============================================================
# USER SIGNUP
# ============================================================

@app.post("/api/users")
def create_user(user: User):

    with Session(engine) as session:

        existing = session.exec(
            select(User).where(User.email == user.email)
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already exists."
            )

        # -------------------------
        # MANAGER SIGNUP
        # -------------------------

        if user.role == "Manager":

            user.manager_code = create_unique_manager_code()

            user.status = "approved"

            user.manager_id = None

        # -------------------------
        # EMPLOYEE SIGNUP
        # -------------------------

        else:

            if not user.manager_code:

                raise HTTPException(
                    status_code=400,
                    detail="Manager Code is required."
                )

            manager = session.exec(
                select(User).where(
                    User.manager_code == user.manager_code
                )
            ).first()

            if not manager:

                raise HTTPException(
                    status_code=404,
                    detail="Invalid Manager Code."
                )

            user.manager_id = manager.id

            user.status = "pending"

        session.add(user)
        session.commit()
        session.refresh(user)

        return user
    
    # ============================================================
# LOGIN
# ============================================================

@app.post("/api/login")
def login(login_data: dict):

    email = login_data.get("email")
    password = login_data.get("password")
    role = login_data.get("role")

    with Session(engine) as session:

        user = session.exec(
            select(User).where(User.email == email)
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        if user.password != password:
            raise HTTPException(
                status_code=401,
                detail="Invalid password."
            )

        if user.role != role:
            raise HTTPException(
                status_code=401,
                detail="Invalid role."
            )

        # Employee Approval Check
        if user.role == "Employee":

            if user.status == "pending":
                raise HTTPException(
                    status_code=403,
                    detail="Waiting for manager approval."
                )

            if user.status == "rejected":
                raise HTTPException(
                    status_code=403,
                    detail="Your request was rejected by the manager."
                )

        return {
            "message": "Login Successful",
            "user": user
        }


# ============================================================
# GET ALL USERS
# ============================================================

@app.get("/api/users")
def get_all_users():

    with Session(engine) as session:

        users = session.exec(
            select(User)
        ).all()

        return users


# ============================================================
# GET SINGLE USER
# ============================================================

@app.get("/api/users/{user_id}")
def get_user(user_id: int):

    with Session(engine) as session:

        user = session.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        return user


# ============================================================
# DELETE USER
# ============================================================

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):

    with Session(engine) as session:

        user = session.get(User, user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        session.delete(user)
        session.commit()

        return {
            "message": f"{user.name} deleted successfully."
        }


# ============================================================
# GET MANAGER DETAILS
# ============================================================

@app.get("/api/manager/{manager_code}")
def get_manager(manager_code: str):

    with Session(engine) as session:

        manager = session.exec(
            select(User).where(
                User.manager_code == manager_code
            )
        ).first()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found."
            )

        return {
            "id": manager.id,
            "name": manager.name,
            "email": manager.email,
            "manager_code": manager.manager_code
        }
    
    # ============================================================
# PENDING EMPLOYEE REQUESTS
# ============================================================

@app.get("/api/pending/{manager_id}")
def get_pending_requests(manager_id: int):

    with Session(engine) as session:

        employees = session.exec(
            select(User).where(
                User.manager_id == manager_id,
                User.role == "Employee",
                User.status == "pending"
            )
        ).all()

        return employees


# ============================================================
# APPROVED EMPLOYEES
# ============================================================

@app.get("/api/employees/{manager_id}")
def get_manager_employees(manager_id: int):

    with Session(engine) as session:

        employees = session.exec(
            select(User).where(
                User.manager_id == manager_id,
                User.role == "Employee",
                User.status == "approved"
            )
        ).all()

        return employees


# ============================================================
# APPROVE EMPLOYEE
# ============================================================

@app.put("/api/approve/{employee_id}")
def approve_employee(employee_id: int):

    with Session(engine) as session:

        employee = session.get(User, employee_id)

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )

        employee.status = "approved"

        session.add(employee)
        session.commit()
        session.refresh(employee)

        return {
            "message": f"{employee.name} approved successfully.",
            "employee": employee
        }


# ============================================================
# REJECT EMPLOYEE
# ============================================================

@app.put("/api/reject/{employee_id}")
def reject_employee(employee_id: int):

    with Session(engine) as session:

        employee = session.get(User, employee_id)

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )

        employee.status = "rejected"

        session.add(employee)
        session.commit()
        session.refresh(employee)

        return {
            "message": f"{employee.name} rejected.",
            "employee": employee
        }


# ============================================================
# EMPLOYEE STATUS
# ============================================================

@app.get("/api/status/{employee_id}")
def employee_status(employee_id: int):

    with Session(engine) as session:

        employee = session.get(User, employee_id)

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )

        return {
            "status": employee.status
        }


# ============================================================
# MANAGER DETAILS BY EMPLOYEE
# ============================================================

@app.get("/api/employee-manager/{employee_id}")
def employee_manager(employee_id: int):

    with Session(engine) as session:

        employee = session.get(User, employee_id)

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )

        if employee.manager_id is None:
            raise HTTPException(
                status_code=404,
                detail="Manager not assigned."
            )

        manager = session.get(User, employee.manager_id)

        return manager
    
    # ============================================================
# CREATE REVIEW
# ============================================================

@app.post("/api/reviews")
def create_review(review: Review):

    with Session(engine) as session:

        session.add(review)
        session.commit()
        session.refresh(review)

        return review


# ============================================================
# GET EMPLOYEE REVIEWS
# ============================================================

@app.get("/api/reviews/{employee_id}")
def get_employee_reviews(employee_id: int):

    with Session(engine) as session:

        reviews = session.exec(
            select(Review).where(
                Review.employee_id == employee_id
            )
        ).all()

        return reviews


# ============================================================
# ANONYMOUS BOARD
# ============================================================

@app.post("/api/anonymous")
def create_anonymous_message(msg: AnonymousBoard):

    with Session(engine) as session:

        session.add(msg)
        session.commit()
        session.refresh(msg)

        return msg


@app.get("/api/anonymous")
def get_anonymous_messages():

    with Session(engine) as session:

        return session.exec(
            select(AnonymousBoard)
        ).all()


# ============================================================
# SEND CHAT MESSAGE
# ============================================================

@app.post("/api/chat")
def send_chat(message: ChatMessage):

    with Session(engine) as session:

        sender = session.get(User, message.sender_id)
        receiver = session.get(User, message.receiver_id)

        if not sender or not receiver:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        # Employee -> Manager
        if sender.role == "Employee":

            if sender.manager_id != receiver.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only message your own manager."
                )

        # Manager -> Employee
        if sender.role == "Manager":

            if receiver.manager_id != sender.id:
                raise HTTPException(
                    status_code=403,
                    detail="Employee is not assigned to you."
                )

        session.add(message)
        session.commit()
        session.refresh(message)

        return message


# ============================================================
# GET CHAT
# ============================================================

@app.get("/api/chat/{user_id}")
def get_chat(user_id: int):

    with Session(engine) as session:

        chats = session.exec(
            select(ChatMessage).where(
                (ChatMessage.sender_id == user_id)
                |
                (ChatMessage.receiver_id == user_id)
            )
        ).all()

        return chats


# ============================================================
# CLEAR CHAT
# ============================================================

@app.delete("/api/chat/{chat_id}")
def delete_chat(chat_id: int):

    with Session(engine) as session:

        chat = session.get(ChatMessage, chat_id)

        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found."
            )

        session.delete(chat)
        session.commit()

        return {
            "message": "Chat deleted successfully."
        }


# ============================================================
# DASHBOARD STATS
# ============================================================

@app.get("/api/dashboard/{manager_id}")
def dashboard(manager_id: int):

    with Session(engine) as session:

        pending = session.exec(
            select(User).where(
                User.manager_id == manager_id,
                User.status == "pending"
            )
        ).all()

        approved = session.exec(
            select(User).where(
                User.manager_id == manager_id,
                User.status == "approved"
            )
        ).all()

        reviews = session.exec(
            select(Review).where(
                Review.manager_id == manager_id
            )
        ).all()

        chats = session.exec(
            select(ChatMessage).where(
                ChatMessage.receiver_id == manager_id
            )
        ).all()

        return {
            "pending_requests": len(pending),
            "approved_employees": len(approved),
            "reviews_written": len(reviews),
            "messages_received": len(chats)
        }