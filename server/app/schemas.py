from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
    name: str
    email: EmailStr
    password: str
    organization_code: Optional[str] = None  
    is_admin: Optional[bool] = False

class UserSignup(UserBase):
    password: str

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class OrganizationCreate(UserSignup):
    is_admin: bool = True 

class OrganizationJoin(UserBase):
    name: str
    email: EmailStr
    password: str
    organization_code: str
    organization_password: str
    is_admin: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    organization_code: str

class VerifySignupRequest(BaseModel):
    email: str
    otp: str
    name:str
    password:str

# ✅ Define a combined request model
class VerifyJoinRequest(BaseModel):
    email: EmailStr
    otp: str
    name: str
    password: str
    organization_code: str
    organization_password: str  # ✅ Now includes organization password

class ClientData(BaseModel):
    id: str
    client_name: str
    client_role: str
    status: str

class ClientInput(BaseModel):
    id: str
    client_name:str
    client_role: str

class Log(BaseModel):
    id: str
    timestamp: str
    client_name: str 
    host_id: Optional[str] 
    os_platform: Optional[str] 
    network_transport: Optional[str] 
    network_type: Optional[str] 
    source_bytes: Optional[int] 
    destination_ip: Optional[str] 
    event_action: Optional[str] 
    event_duration: Optional[int] 
    source_mac: Optional[str] 
    flow_id: Optional[str] 
    server_domain: Optional[str] 

class ClientDetails(BaseModel):
    id: str
    name: str
    role: str
    status: str
    logs: List[Log]

class Website(BaseModel):
    url: str

# ✅ User Response Schema (Excludes Password)
class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True  # ✅ Enables ORM model conversion for SQLAlchemy
