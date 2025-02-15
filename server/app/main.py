from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Organization
from schemas import OrganizationCreate, UserResponse, OrganizationJoin, OTPVerification, UserLogin
from hash_password import hash_password, verify_password
from jwt_utils import create_jwt_token, verify_jwt_token
from password_generator import generate_org_code, generate_password
from email_service import send_email 
from validation import is_valid_email
from typing import Annotated
import random
import os

# ✅ Initialize FastAPI app
app = FastAPI()

# ✅ CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Temporary OTP Storage (Use Redis/DB in production)
otp_storage = {}

# ✅ Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# ✅ Initialize database tables
Base.metadata.create_all(bind=engine)

# --------------------------------
# ✅ User Signup (Step 1: Send OTP)
# --------------------------------
@app.post("/signup/", response_model=UserResponse)
def send_signup_otp(user: OrganizationCreate, db: Session = Depends(get_db)):
    """
    Sends OTP for new user registration.
    """
    existing_user = db.query(Organization).filter(Organization.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not is_valid_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    otp = generate_password(6, 0, 6, 0)
    otp_storage[user.email] = otp

    send_email(user.email, "Your OTP Verification Code", f"Your OTP is: {otp}")

    return {"message": "OTP sent to your email"}

# --------------------------------
# ✅ User Signup (Step 2: Verify OTP & Create Organization)
# --------------------------------
@app.post("/verify-signup/", response_model=UserResponse)
def verify_signup(user: OrganizationCreate, otp_data: OTPVerification, db: Session = Depends(get_db)):
    """
    Verifies OTP and creates a new organization with the user as admin.
    """
    if otp_data.email not in otp_storage or otp_storage[otp_data.email] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    del otp_storage[otp_data.email]

    hashed_password = hash_password(user.password)
    org_code = generate_org_code()
    org_password = generate_password(10, 2, 2, 4)

    new_user = Organization(
        name=user.name,
        email=user.email,
        password=hashed_password,
        organization_code=org_code,
        organization_password=hash_password(org_password),
        is_admin=True  # ✅ Creator is always an admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_email(user.email, "Your Organization Credentials", f"Org Code: {org_code}\nOrg Password: {org_password}")

    token = create_jwt_token({
        "user_id": new_user.id,
        "email": new_user.email,
        "organization_code": new_user.organization_code,
        "is_admin": new_user.is_admin
    })

    return {
        "message": "Organization created successfully!",
        "organization_code": org_code,
        "organization_password": org_password,
        "token": token
    }

# --------------------------------
# ✅ Join Organization (Step 1: Send OTP)
# --------------------------------
@app.post("/join-organization/")
def send_otp_join_org(user: OrganizationJoin, db: Session = Depends(get_db)):
    """
    Sends OTP when joining an existing organization.
    """
    org = db.query(Organization).filter(Organization.organization_code == user.organization_code).first()
    
    if not org or not verify_password(user.organization_password, org.organization_password):
        raise HTTPException(status_code=400, detail="Invalid organization credentials")

    existing_user = db.query(Organization).filter(Organization.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered in an organization")

    otp = generate_password(6, 0, 6, 0)
    otp_storage[user.email] = otp

    send_email(user.email, "Your OTP Verification Code", f"Your OTP is: {otp}")

    return {"message": "OTP sent successfully"}

# --------------------------------
# ✅ Join Organization (Step 2: Verify OTP & Register User)
# --------------------------------
@app.post("/verify-join-organization/")
def verify_join_org(user: OrganizationJoin, otp_data: OTPVerification, db: Session = Depends(get_db)):
    """
    Verifies OTP and joins the user to an existing organization as a regular user.
    """
    if otp_data.email not in otp_storage or otp_storage[otp_data.email] != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    del otp_storage[otp_data.email]

    hashed_password = hash_password(user.password)

    new_user = Organization(
        name=user.name,
        email=user.email,
        password=hashed_password,
        organization_code=user.organization_code,
        is_admin=False  # ✅ Regular users are not admins
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_jwt_token({
        "user_id": new_user.id,
        "email": new_user.email,
        "organization_code": new_user.organization_code,
        "is_admin": new_user.is_admin
    })

    return {
        "message": "User successfully joined the organization",
        "token": token
    }

# --------------------------------
# ✅ User Login (JWT Authentication)
# --------------------------------
@app.post("/login/")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and returns a JWT token.
    """
    existing_user = db.query(Organization).filter(
        Organization.email == user.email, Organization.organization_code == user.organization_code
    ).first()

    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or organization code")

    if not verify_password(user.password, existing_user.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_jwt_token({
        "user_id": existing_user.id,
        "email": existing_user.email,
        "organization_code": existing_user.organization_code,
        "is_admin": existing_user.is_admin
    })

    return {
        "message": "Login Successful",
        "id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "organization_code": existing_user.organization_code,
        "is_admin": existing_user.is_admin,
        "token": token
    }

# --------------------------------
# ✅ Protected Route (Requires JWT Token)
# --------------------------------
@app.get("/protected-route/")
def protected_route(token: str):
    """
    Example of a protected route that requires authentication.
    """
    decoded_token = verify_jwt_token(token)
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    return {"message": "Access granted", "user": decoded_token}

# ✅ Run Server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
