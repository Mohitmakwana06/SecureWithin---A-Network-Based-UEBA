import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
import logging

# Set up logging to debug connection issues
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database URL
URL_DATABASE = os.getenv("DATABASE_URL")

if not URL_DATABASE:
    raise ValueError("DATABASE_URL is not set in environment variables")

# Create engine with optimized connection pool settings
try:
    engine = create_engine(
    URL_DATABASE,
    pool_size=8,           # Increased to handle more concurrent connections
    max_overflow=4,        # Allow more overflow for traffic spikes
    pool_recycle=300,      # Keep recycling every 5 minutes to prevent stale connections
    pool_timeout=20,       # Wait 20s before failing to reduce timeout errors
    pool_pre_ping=True,    # Check connection health before use
    pool_use_lifo=True     # Reuse recent connections for better performance
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()