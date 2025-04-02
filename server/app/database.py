import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Get database URL
URL_DATABASE = os.getenv("DATABASE_URL")

if not URL_DATABASE:
    raise ValueError("DATABASE_URL is not set in environment variables")

# ✅ Ensure proper connection for PostgreSQL
engine = create_engine(
    URL_DATABASE,
    pool_size = 10,  # Adjusted pool size
    max_overflow=5,  # Adjusted max overflow
    pool_recycle=1800,  # Refresh connections every 30 minutes
    pool_timeout=30,  # Wait 30s before failing
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

