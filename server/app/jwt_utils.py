import os
import jwt as pyjwt
import datetime
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")
EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION"))

def create_jwt_token(data: dict):
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes = EXPIRATION_MINUTES)
    data.update({"exp": expiry})
    return pyjwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_jwt_token(token: str):
    try:
        decoded_token = pyjwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
        return decoded_token
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.InvalidTokenError:
        return None
