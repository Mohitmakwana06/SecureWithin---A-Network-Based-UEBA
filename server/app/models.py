from database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, CheckConstraint

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    organization_code = Column(String, nullable=False)
    organization_password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)

    __table_args__ = (
        CheckConstraint(
            "(is_admin = TRUE AND organization_password IS NOT NULL) OR (is_admin = FALSE AND organization_password IS NULL)",
            name="organization_password_check"
        ),
    )


class Clients(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True)
    client_name = Column(String, nullable=True)
    client_role = Column(String,nullable=True)