from typing import Optional
from sqlmodel import SQLModel, Field

# User Table (Manager aur Employee ke liye - Yeh aapka pehle se hai)
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True) 
    role: str                       
    password: str                   

# 👇 NAYA CODE: Review Table
class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    manager_id: int    # Kis manager ne review diya (e.g., id: 1)
    employee_id: int   # Kis employee ko review mila (e.g., id: 2)
    feedback: str      # Review ka actual text
class AnonymousBoard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    message: str