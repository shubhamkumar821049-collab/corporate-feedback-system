from typing import Optional
from sqlmodel import SQLModel, Field

# User Table
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True) 
    role: str                       
    password: str                   

# Review Table
class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    manager_id: int
    employee_id: int
    feedback: str

# Anonymous Board (Aapka naya model)
class AnonymousBoard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    message: str

# Chat Table
class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int
    receiver_id: int
    message: str
    sender_name: str