from typing import Optional
from sqlmodel import SQLModel, Field


# ==========================
# USER TABLE
# ==========================
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    email: str = Field(unique=True)
    password: str
    role: str

    # --------------------------
    # Manager Features
    # --------------------------

    # Sirf Manager ke liye unique code
    manager_code: Optional[str] = None

    # Employee kis manager ke under hai
    manager_id: Optional[int] = None

    # Employee signup ke baad pending rahega
    # pending | approved | rejected
    status: str = "pending"


# ==========================
# REVIEW TABLE
# ==========================
class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    manager_id: int
    employee_id: int

    feedback: str


# ==========================
# ANONYMOUS BOARD
# ==========================
class AnonymousBoard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    message: str


# ==========================
# CHAT TABLE
# ==========================
class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    sender_id: int
    receiver_id: int

    sender_name: str
    message: str