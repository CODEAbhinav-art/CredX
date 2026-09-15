"""
CredX - Database Connection Layer (PostgreSQL Neon with SQLite Fallback)
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local fallback if DATABASE_URL is not set
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "credx.db"))
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    DATABASE_URL = f"sqlite:///{sqlite_path}"

# Handle connection arguments cleanly
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print(f"Connected to Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as e:
    print(f"Primary DB connection failed ({e}). Falling back to local SQLite.")
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "credx.db"))
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    DATABASE_URL = f"sqlite:///{sqlite_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency generator for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
