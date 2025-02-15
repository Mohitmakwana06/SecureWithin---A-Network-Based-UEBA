from database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    organization_code = Column(String, nullable=False)
    organization_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)