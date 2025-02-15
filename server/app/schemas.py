from pydantic import BaseModel, EmailStr
from typing import Optional

# ✅ Base Schema (Shared Fields)
class UserBase(BaseModel):
    name: str
    email: EmailStr
    organization_code: Optional[str] = None  # Optional for initial signup
    is_admin: Optional[bool] = False  # Default to False (only creator is admin)

# ✅ Signup Schema (Includes Password, No Org Code Initially)
class UserSignup(UserBase):
    password: str

# ✅ Schema for OTP Verification
class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

# ✅ Organization Creation Schema (Used when creating an org)
class OrganizationCreate(UserSignup):
    is_admin: bool = True  # ✅ Ensure creator is admin

# ✅ Organization Join Schema (User joins an existing org)
class OrganizationJoin(UserSignup):
    organization_code: str
    organization_password: str
    is_admin: bool = False  # ✅ Ensure joining user is NOT an admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    organization_code: str
    organization_password: str

# ✅ User Response Schema (Excludes Password)
class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True  # ✅ Enables ORM model conversion for SQLAlchemy
