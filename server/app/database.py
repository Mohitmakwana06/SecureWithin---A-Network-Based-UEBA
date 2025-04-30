import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
import logging

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env vars
load_dotenv()

URL_DATABASE = os.getenv("DATABASE_URL")
if not URL_DATABASE:
    raise ValueError("DATABASE_URL is not set")

try:
    engine = create_engine(
        URL_DATABASE,
        pool_size=15,
        max_overflow=20,
        pool_recycle=180,
        pool_timeout=10,
        pool_pre_ping=True
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Engine creation failed: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
