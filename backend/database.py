import os
from sqlmodel import SQLModel, create_engine
from dotenv import load_dotenv

# .env file se DATABASE_URL load karna
load_dotenv()
database_url = os.environ.get("DATABASE_URL")

# SQLAlchemy engine create karna (echo=True se terminal mein SQL queries dikhengi)
engine = create_engine(database_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)