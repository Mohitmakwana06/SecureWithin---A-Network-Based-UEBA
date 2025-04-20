from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketState
from database import SessionLocal, engine, Base
from models import Organization, Clients
from schemas import OrganizationCreate, UserResponse, OrganizationJoin, OTPVerification, UserLogin, VerifySignupRequest, VerifyJoinRequest, ClientData, ClientInput, ClientDetails, Log, Website
from hash_password import hash_password, verify_password
from jwt_utils import create_jwt_token, verify_jwt_token
from password_generator import generate_org_code, generate_password
from email_service import send_email 
from validation import is_valid_email
from typing import Annotated, List, Dict, Set
from collections import defaultdict
import logging
import urllib3
import csv
import json
import re
from elasticsearch import Elasticsearch
from datetime import datetime, timedelta
from dateutil import parser
import asyncio
import time
import tldextract
import random
import os

urllib3.disable_warnings()

app = FastAPI()
ELASTICSEARCH_URL = "https://localhost:9200"
USERNAME = "elastic"
PASSWORD = "OU=7ze4HXE1ihPOptGBC"
INDEX_NAME = "proxy-logs"

RESTRICTED_DOMAINS_FILE = "D:/UEBA/ueba/server/app/restricted_domains.csv"

URL_FIELD = "destination.domain"
TIMESTAMP_FIELD = "@timestamp"

HYBRID_ANALYSIS_URL = "https://www.hybrid-analysis.com/api/v2/search/hash"
HYBRID_ANALYSIS_HEADERS = {"User-Agent": "Falcon Sandbox"}

LOG_PAGE_SIZE = 100
CLIENT_ID_FIELD = "client_id.keyword"

ALERT_COOLDOWN = 300

recent_alerts = defaultdict(dict)

logging.getLogger("elastic_transport").setLevel(logging.WARNING)
logging.getLogger("elastic_transport.transport").setLevel(logging.WARNING)

es = Elasticsearch(
        [ELASTICSEARCH_URL],
        basic_auth=(USERNAME, PASSWORD),  # Authentication
        verify_certs=False  # Set to True for security (if using a valid SSL cert)
    )

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000"], # Allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
active_connections: List[WebSocket] = []
# Cache for last seen timestamps and status
client_last_seen: Dict[str, datetime] = {}
client_status_cache: Dict[str, str] = {}
# Track WebSocket connections by client_id
client_connections: Dict[str, Set[WebSocket]] = {}

active_connections = []

otp_storage = {}

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
@app.post("/signup/")
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
import logging

@app.post("/verify-signup/")
def verify_signup(user: VerifySignupRequest, db: Session = Depends(get_db)):
    try:
        if user.email not in otp_storage or otp_storage[user.email] != user.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        del otp_storage[user.email]

        hashed_password = hash_password(user.password)
        org_code = generate_org_code()
        org_password = generate_password(10, 2, 2, 4)

        new_user = Organization(
            name=user.name,
            email=user.email,
            password=hashed_password,
            organization_code=org_code,
            organization_password=hash_password(org_password),
            is_admin=True
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
    except Exception as e:
        logging.error(f"Error during verify-signup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))



# --------------------------------
# ✅ Join Organization (Step 1: Send OTP)
# --------------------------------
@app.post("/join-organization/")
def send_otp_join_org(user: OrganizationJoin, db: Session = Depends(get_db)):
    try:
        logging.info(f"Received request to join organization: {user}")

        # Check if organization code exists
        org = db.query(Organization).filter(Organization.organization_code == user.organization_code).first()
        if not org:
            logging.error("Organization code does not exist.")
            raise HTTPException(status_code=400, detail="Organization code does not exist")

        # Check if the password matches
        if not verify_password(user.organization_password, org.organization_password):
            logging.error("Invalid organization password.")
            raise HTTPException(status_code=400, detail="Invalid organization password")

        # Check if the email is already registered in any organization
        existing_user = db.query(Organization).filter(Organization.email == user.email).first()
        if existing_user:
            logging.error(f"Email {user.email} already registered in an organization.")
            raise HTTPException(status_code=400, detail="Email already registered in an organization")

        # Generate OTP
        otp = generate_password(6, 0, 6, 0)
        otp_storage[user.email] = otp

        send_email(user.email, "Your OTP Verification Code", f"Your OTP is: {otp}")

        logging.info("OTP sent successfully.")
        return {"message": "OTP sent successfully"}

    except Exception as e:
        logging.error(f"Error in join-organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))



# --------------------------------
# ✅ Join Organization (Step 2: Verify OTP & Register User)
# --------------------------------
from sqlalchemy.exc import IntegrityError

@app.post("/verify-join-organization/")
def verify_join_org(user: VerifyJoinRequest, db: Session = Depends(get_db)):
    try:
        # Check if the OTP exists for the user
        if user.email not in otp_storage:
            logging.warning(f"OTP for email {user.email} not found.")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        if otp_storage[user.email] != user.otp:
            logging.warning(f"Invalid OTP provided for {user.email}.")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        del otp_storage[user.email]

        hashed_password = hash_password(user.password)
        
        # Log the organization password being used
        logging.info(f"Attempting to insert organization_password: {user.organization_password}")

        new_user = Organization(
            name=user.name,
            email=user.email,
            password=hashed_password,
            organization_code=user.organization_code,
            is_admin=False
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

    except Exception as e:
        logging.error(f"Unexpected error while verifying join organization: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


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

@app.post("/verify-organization-password/")
def verify_org_password(organization_code: str, entered_password: str, db: Session = Depends(get_db)):
    # Fetch the admin of the organization
    admin = db.query(Organization).filter(
        Organization.organization_code == organization_code, Organization.is_admin == True
    ).first()

    if not admin or not admin.organization_password:
        raise HTTPException(status_code=403, detail="Organization password not found")

    # Verify the entered password with the stored password
    if not verify_password(entered_password, admin.organization_password):
        raise HTTPException(status_code=403, detail="Invalid organization password")

    return {"message": "Password verified successfully"}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

def is_client_online(client_id: str) -> str:
    time_threshold = (datetime.utcnow() - timedelta(minutes=5)).isoformat() + "Z"
    
    query = {
        "query": {
            "bool": {
                "must": [
                    {"match": {"client_id.keyword": client_id}},
                    {"range": {"@timestamp": {"gte": time_threshold}}}
                    #{"range": {"timestamp": {"gte": "2025-02-24T06:31:15.016Z"}}}
                ]
            }
        },
    }

    response = es.search(index="proxy-logs", body=query)
    return "Online" if response["hits"]["total"]["value"] > 0 else "Offline"

# Background task to check status frequently
async def monitor_client_status():
    while True:
        db = next(get_db())
        clients = db.query(Clients).all()

        for client in clients:
            current_status = is_client_online(client.id)

            # If status changed or new client, notify via WebSocket
            if client.id not in client_status_cache or client_status_cache[client.id] != current_status:
                client_status_cache[client.id] = current_status

                # Notify all connected clients
                for connection in active_connections:
                    await connection.send_json({
                        "client_id": client.id,
                        "status": current_status
                    })

        # Check every 10 seconds for quicker updates
        await asyncio.sleep(10)

# Original endpoint for initial data load
@app.get("/clients", response_model=List[ClientData])
async def get_clients(db: Session = Depends(get_db)):
    response = db.query(Clients).all()
    if not response:
        return []  # Return an empty list if no clients exist

    clients = response  # Ensure `clients` is a list

    client_list = []
    for client in clients:
        client_data = client.__dict__  # Convert to dictionary if necessary
        client_data["status"] = is_client_online(client.id)
        client_status_cache[client.id] = client_data["status"]
        client_list.append(client_data)

    return client_list

@app.post("/client-input/")
def put_client(user: ClientInput, db: Session = Depends(get_db)):
    try:

        # Check if organization code exists
        client = db.query(Clients).filter(Clients.id == user.id).first()
        if client:
            raise HTTPException(status_code=400, detail="Same Client Exist")
        new_client = Clients(
            id=user.id,
            client_name=user.client_name,
            client_role=user.client_role,
        )

        db.add(new_client)
        db.commit()
        db.refresh(new_client)

        return {"message": "Client Added Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
@app.websocket("/ws/logs/{client_id}")
async def websocket_logs(websocket: WebSocket, client_id: str):
    await websocket.accept()

    # Add this connection to the client's connection pool
    if client_id not in client_connections:
        client_connections[client_id] = set()
    client_connections[client_id].add(websocket)

    try:
        # Keep connection open and listen for any client messages
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Remove connection when client disconnects
        client_connections[client_id].remove(websocket)
        if not client_connections[client_id]:
            del client_connections[client_id]

# Background task to monitor logs and push updates
    
# Helper function to validate client ID
def validate_client_id(client_id: str):
    if not re.match(r"^[a-zA-Z0-9_-]+$", client_id):
        raise HTTPException(status_code=400, detail="Invalid client ID format")

@app.get("/clients/{client_id}")
async def get_client_details(client_id: str, db: Session = Depends(get_db)):
    try:
        validate_client_id(client_id)
        logging.info(f"Fetching details for client ID: {client_id}")

        # Fetch client details from DB
        client = db.query(Clients).filter(Clients.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Set up initial client details
        client_details = {
            "id": client.id,
            "name": client.client_name,
            "role": client.client_role,
            "status": is_client_online(client.id),
            "logs": [],
            "next_start": LOG_PAGE_SIZE
        }

        # Elasticsearch query to get the latest logs
        logs_query = {
            "query": {"match": {CLIENT_ID_FIELD: client.id}},
            "size": LOG_PAGE_SIZE,
            "sort": [{"@timestamp": {"order": "desc"}}]
        }

        logs_response = es.search(index="proxy-logs", body=logs_query)

        # Extract logs
        logs = []
        if "hits" in logs_response and "hits" in logs_response["hits"]:
            for hit in logs_response["hits"]["hits"]:
                _source = hit["_source"]
                logs.append({
                    "id": hit["_id"],
                    "timestamp": _source.get("@timestamp", "N/A"),
                    "client_name": _source.get("client_name", "Unknown"),
                    "host_id": _source.get("host", {}).get("id", "N/A"),
                    "os_platform": _source.get("host", {}).get("os", {}).get("platform", "N/A"),
                    "network_transport": _source.get("network", {}).get("transport", "N/A"),
                    "network_type": _source.get("network", {}).get("type", "N/A"),
                    "source_bytes": _source.get("source", {}).get("bytes", 0),
                    "destination_ip": _source.get("destination", {}).get("ip", "N/A"),
                    "event_action": _source.get("event", {}).get("action", "N/A"),
                    "event_duration": _source.get("event", {}).get("duration", 0),
                    "source_mac": _source.get("source", {}).get("mac", "N/A"),
                    "flow_id": _source.get("flow", {}).get("id", "N/A"),
                    "server_domain": _source.get("server", {}).get("domain", "N/A")
                })

        client_details["logs"] = logs
        return client_details

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")

@app.get("/clients/{client_id}/refresh")
async def refresh_logs(client_id: str, start: int = 0, db: Session = Depends(get_db)):
    try:
        validate_client_id(client_id)
        logging.info(f"Refreshing logs for client ID: {client_id}, start: {start}")

        # Fetch client details from DB
        client = db.query(Clients).filter(Clients.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Elasticsearch query for paginated logs
        logs_query = {
            "query": {"match": {CLIENT_ID_FIELD: client.id}},
            "size": LOG_PAGE_SIZE,
            "from": start,
            "sort": [{"@timestamp": {"order": "desc"}}]
        }

        logs_response = es.search(index="proxy-logs", body=logs_query)

        # Extract logs
        logs = []
        if "hits" in logs_response and "hits" in logs_response["hits"]:
            for hit in logs_response["hits"]["hits"]:
                _source = hit["_source"]
                logs.append({
                    "id": hit["_id"],
                    "timestamp": _source.get("@timestamp", "N/A"),
                    "client_name": _source.get("client_name", "Unknown"),
                    "host_id": _source.get("host", {}).get("id", "N/A"),
                    "os_platform": _source.get("host", {}).get("os", {}).get("platform", "N/A"),
                    "network_transport": _source.get("network", {}).get("transport", "N/A"),
                    "network_type": _source.get("network", {}).get("type", "N/A"),
                    "source_bytes": _source.get("source", {}).get("bytes", 0),
                    "destination_ip": _source.get("destination", {}).get("ip", "N/A"),
                    "event_action": _source.get("event", {}).get("action", "N/A"),
                    "event_duration": _source.get("event", {}).get("duration", 0),
                    "source_mac": _source.get("source", {}).get("mac", "N/A"),
                    "flow_id": _source.get("flow", {}).get("id", "N/A"),
                    "server_domain": _source.get("server", {}).get("domain", "N/A")
                })

        # Prepare response
        client_details = {
            "id": client.id,
            "name": client.client_name,
            "role": client.client_role,
            "status": is_client_online(client.id),
            "logs": logs,
            "next_start": start + LOG_PAGE_SIZE if len(logs) == LOG_PAGE_SIZE else None
        }

        return client_details

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")
    
def init_csv():
    if not os.path.exists(RESTRICTED_DOMAINS_FILE):
        with open(RESTRICTED_DOMAINS_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["url"])

init_csv()

# Load all restricted websites into a set
def load_restricted_websites():
    websites = set()
    if os.path.exists(RESTRICTED_DOMAINS_FILE):
        with open(RESTRICTED_DOMAINS_FILE, "r", newline="") as file:
            reader = csv.reader(file)
            for row in reader:
                if row and row[0].strip():  # Ensure the row is not empty
                    websites.add(row[0].strip())  # Add domain URL to the set
    return websites

# ✅ Add a website
@app.post("/add-website")
def add_website(website: Website):
    if not website.url.strip():
        raise HTTPException(status_code=400, detail="Website URL cannot be empty.")

    websites = load_restricted_websites()
    if website.url in websites:
        return {"message": "Website already exists in the list."}

    # Append the new website URL to the CSV file on a new line
    with open(RESTRICTED_DOMAINS_FILE, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([website.url.strip()])  # Strip to ensure no extra spaces

    return {"message": "Website added to the list."}

# ✅ Get all restricted websites
@app.get("/get-websites")
def get_websites():
    websites = load_restricted_websites()
    return {"websites": list(websites)}

# ✅ Delete a website
@app.delete("/delete-website")
def delete_website(website: Website):
    if not os.path.exists(RESTRICTED_DOMAINS_FILE):
        raise HTTPException(status_code=404, detail="CSV file not found.")

    with open(RESTRICTED_DOMAINS_FILE, "r") as file:
        rows = list(csv.reader(file))

    if len(rows) <= 1:
        return {"message": "No websites to delete."}

    header, data = rows[0], rows[1:]
    updated_data = [row for row in data if row[0] != website.url]

    with open(RESTRICTED_DOMAINS_FILE, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(header)
        writer.writerows(updated_data)
    
    return {"message": "Website deleted from the list."}


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_alert(self, message: str):
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                print(f"⚠️ Client disconnected: {connection}")
                disconnected_clients.append(connection)

        # Remove disconnected clients
        for client in disconnected_clients:
            self.active_connections.remove(client)

manager = ConnectionManager()

# Function to extract the root domain
def extract_root_domain(domain):
    extracted = tldextract.extract(domain)
    return f"{extracted.domain}.{extracted.suffix}" if extracted.suffix else extracted.domain

class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode)
        self.is_end = False

class DomainTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, domain):
        node = self.root
        for char in domain[::-1]:  # Reverse for suffix-based search
            node = node.children[char]
        node.is_end = True

    def search(self, domain):
        node = self.root
        for char in domain[::-1]:  # Reverse search
            if char not in node.children:
                return False
            node = node.children[char]
            if node.is_end:
                return True  # Allow subdomain matches
        return node.is_end
    
restricted_domains = DomainTrie()

# Load restricted domains from CSV file
def load_restricted_domains():
    try:
        with open(RESTRICTED_DOMAINS_FILE, "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    cleaned_domain = extract_root_domain(row[0].strip().lower())
                    restricted_domains.insert(cleaned_domain)  # 🔧 Fixed insert → add()
    except FileNotFoundError:
        print(f"❌ CSV file '{RESTRICTED_DOMAINS_FILE}' not found!")
        exit(1)
    except Exception as e:
        print(f"❌ Error loading restricted domains: {e}")


# Detect restricted domains from logs
async def detect_restricted_domains():
    if not es:
        print("❌ Elasticsearch connection not established!")
        return
    
    while True:
        try:
            load_restricted_domains()

            if not manager.active_connections:
                await asyncio.sleep(1)
                continue

            # Elasticsearch query
            search_query = {
                "size": 100,
                "_source": ["destination.domain", "client_name"],
                "query": {"exists": {"field": "destination.domain"}},
                "sort": [{"@timestamp": {"order": "desc"}}]
            }

            response = es.search(index=INDEX_NAME, body=search_query)
            if "hits" not in response or "hits" not in response["hits"]:
                print("⚠️ Invalid Elasticsearch response")
                await asyncio.sleep(1)
                continue
            logs = response["hits"]["hits"]

            surfed_domains = set()
            for log in logs:
                _source = log.get("_source", {})
                domain_value = _source.get("destination", {}).get("domain", "N/A")
                client_name = _source.get("client_name", "Unknown")

                # Ensure client_name is a string
                if isinstance(client_name, list):
                    client_name = client_name[0] if client_name else "Unknown"
                elif not isinstance(client_name, str):
                    client_name = str(client_name)

                # Process domain_value if it’s a string
                if domain_value and isinstance(domain_value, str) and domain_value != "N/A":
                    root_domain = extract_root_domain(domain_value)
                    if isinstance(root_domain, str):
                        surfed_domains.add((client_name, root_domain))
                    else:
                        print(f"⚠️ Skipping invalid root_domain: {root_domain}")
                else:
                    print(f"⚠️ Invalid domain_value: {domain_value}")

            # Check if the domain is restricted
            matched_alerts = set()
            for client, domain in surfed_domains:
                if isinstance(domain, str) and restricted_domains.search(domain):
                    matched_alerts.add((client, domain))

            # Send alerts only if they are new (not in cooldown)
            current_time = time.time()
            for client, domain in matched_alerts:
                last_alert_time = recent_alerts.get(client, {}).get(domain, 0)
                if current_time - last_alert_time > ALERT_COOLDOWN:
                    alert_message = {
                        "type": "alert",
                        "message": f"🚨 ALERT: {client} accessed a restricted domain: {domain}",
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                    await manager.send_alert(json.dumps(alert_message))
                    if client not in recent_alerts:
                        recent_alerts[client] = {}
                    recent_alerts[client][domain] = current_time

        except Exception as e:
            print(f"❌ Error in detect_restricted_domains: {e}")

        await asyncio.sleep(1)


# Function to check if a timestamp is outside working hours (9 AM - 5 PM)
def is_outside_working_hours(timestamp):
    try:
        if isinstance(timestamp, str):
            timestamp = datetime.strptime(timestamp, "%b %d, %Y @ %H:%M:%S.%f")
        return timestamp.hour < 9 or timestamp.hour >= 17  # Office hours: 9 AM - 5 PM
    except Exception as e:
        print(f"❌ Invalid timestamp format: {timestamp} ({e})")
        return False

async def detect_outside_working_hours():
    try:
        if isinstance(timestamp, str):
            timestamp = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        return timestamp.hour < 9 or timestamp.hour >= 17  # Office hours: 9 AM - 5 PM
    except Exception as e:
        print(f"❌ Invalid timestamp format: {timestamp} ({e})")
        return False


async def detect_outside_working_hours():
    if not es:
        print("❌ Elasticsearch connection not established!")
        return  

    while True:
        try:
            search_query = {
                "size": 100,
                "_source": ["client_name", "client_id", "destination.domain", "@timestamp"],
                "query": {"exists": {"field": "destination.domain"}},
                "sort": [{"@timestamp": {"order": "desc"}}]
            }

            response = es.search(index=INDEX_NAME, body=search_query)
            logs = response.get("hits", {}).get("hits", [])

            if not logs:
                print("⚠️ No logs found in Elasticsearch response")
                await asyncio.sleep(300)
                continue

            current_time = time.time()

            for log in logs:
                source = log.get("_source", {})
                timestamp_str = source.get("@timestamp", "")
                client_name = source.get("client_name", "Unknown Client")
                client_id = source.get("client_id", "Unknown ID")

                if isinstance(client_id, list):
                    client_id = str(client_id)


                if not timestamp_str:
                    print(f"⚠️ Missing timestamp for client {client_id}")
                    continue

                try:
                    # Parse the timestamp in the format "2025-04-01T15:21:03.479Z"
                    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                except ValueError as e:
                    print(f"❌ Failed to parse timestamp: {timestamp_str} ({e})")
                    continue

                # Check if access is outside working hours
                if is_outside_working_hours(timestamp):
                    if client_id not in recent_alerts:
                        recent_alerts[client_id] = {}
                    
                    last_alert_time = recent_alerts[client_id].get("outside_working_hours", 0)
                    time_since_last_alert = current_time - last_alert_time

                    if time_since_last_alert > ALERT_COOLDOWN:
                        alert_message = {
                            "type": "warning",
                            "message": f"⚠️ {client_name} (ID: {client_id}) accessed outside working hours at {timestamp_str}",
                            "timestamp": timestamp_str,
                        }
                        try:
                            await manager.send_alert(json.dumps(alert_message))
                            recent_alerts[client_id]["outside_working_hours"] = current_time
                        except Exception as e:
                            print(f"❌ Failed to send alert: {str(e)}")
                            print(f"Alert details: {alert_message}")

        except Exception as e:
            print(f"❌ Error in detect_outside_working_hours: {e}")

        await asyncio.sleep(300)  # Wait 5 minutes
        
@app.websocket("/ws/alert")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"ℹ️ Client {websocket.client.host} disconnected")
        manager.disconnect(websocket)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.websocket("/ws/visualizations")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async def fetch_data(initial: bool = False):
        try:
            # Shared aggregation structure
            aggs = {
                "top_clients": {
                    "terms": {
                        "field": "client_id.keyword",
                        "size": 5,
                        "order": {"total_bytes": "desc"}
                    },
                    "aggs": {
                        "total_bytes": {
                            "sum": {"field": "network.bytes"}
                        }
                    }
                },
                "network_trend": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "fixed_interval": "5m",
                        "format": "yyyy-MM-dd HH:mm:ss"
                    },
                    "aggs": {
                        "total_bytes": {
                            "sum": {"field": "network.bytes"}
                        }
                    }
                },
                "protocol_usage": {
                    "terms": {
                        "field": "network.protocol.keyword",
                        "size": 5,
                        "order": {"total_bytes": "desc"}
                    },
                    "aggs": {
                        "total_bytes": {
                            "sum": {"field": "network.bytes"}
                        }
                    }
                },
                "record_counts_over_time": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "fixed_interval": "12h",
                        "format": "d MMM yyyy",
                        "min_doc_count": 0
                    }
                },
                "top_domains": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "fixed_interval": "1d",
                        "format": "yyyy-MM-dd",
                        "min_doc_count": 0
                    },
                    "aggs": {
                        "domains": {
                            "terms": {
                                "field": "destination.domain.keyword",
                                "size": 10
                            },
                            "aggs": {
                                "visit_count": {
                                    "cardinality": {
                                        "field": "destination.domain.keyword",
                                        "missing": "unknown"
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if initial:
                initial_query = {
                    "size": 100,
                    "query": {
                        "match_all": {}
                    },
                    "sort": [
                        {"@timestamp": {"order": "asc"}}
                    ]
                }
                initial_response = es.search(index="proxy-logs", body=initial_query)

                if not initial_response["hits"]["hits"]:
                    return {
                        "top_clients": [],
                        "network_trend": [],
                        "protocol_usage": [],
                        "record_counts_over_time": [],
                        "most_visited_domains": []
                    }

                hits = initial_response["hits"]["hits"]
                start_time = hits[0]["_source"]["@timestamp"]
                end_time = hits[-1]["_source"]["@timestamp"]

                query = {
                    "size": 0,
                    "query": {
                        "bool": {
                            "filter": [
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": start_time,
                                            "lte": end_time
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    "aggs": aggs
                }
            else:
                query = {
                    "size": 0,
                    "query": {
                        "bool": {
                            "filter": [
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": "now-1h",
                                            "lte": "now"
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    "aggs": aggs
                }

            response = es.search(index="proxy-logs", body=query)

            aggregations = response["aggregations"]

            top_clients = [
                {"client_id": bucket["key"], "bytes": bucket["total_bytes"]["value"]}
                for bucket in aggregations["top_clients"]["buckets"]
            ]

            network_trend = [
                {"timestamp": bucket["key_as_string"], "bytes": bucket["total_bytes"]["value"]}
                for bucket in aggregations["network_trend"]["buckets"]
            ]

            protocol_usage = [
                {"protocol": bucket["key"], "bytes": bucket["total_bytes"]["value"]}
                for bucket in aggregations["protocol_usage"]["buckets"]
            ]

            record_counts_over_time = [
                {
                    "date": bucket["key_as_string"],
                    "count": bucket["doc_count"]
                }
                for bucket in aggregations["record_counts_over_time"]["buckets"]
            ]

            most_visited_domains = [
                {
                    "month": date_bucket["key_as_string"],
                    "domains": [
                        {
                            "domain": bucket["key"],
                            "visits": bucket["visit_count"]["value"]
                        }
                        for bucket in date_bucket["domains"]["buckets"]
                    ]
                }
                for date_bucket in aggregations["top_domains"]["buckets"]
            ]

            result = {
                "top_clients": top_clients,
                "network_trend": network_trend,
                "protocol_usage": protocol_usage,
                "record_counts_over_time": record_counts_over_time,
                "most_visited_domains": most_visited_domains
            }
            # print(f"Sending MainGrid data: {json.dumps({
            #     'top_clients': top_clients,
            #     'network_trend': network_trend,
            #     'protocol_usage': protocol_usage
            # }, indent=2)}")
            return result

        except Exception as e:
            print(f"Elasticsearch error: {str(e)}")
            return {
                "top_clients": [],
                "network_trend": [],
                "protocol_usage": [],
                "record_counts_over_time": [],
                "most_visited_domains": []
            }

    async def heartbeat():
        """Send custom ping message to keep connection alive."""
        while True:
            try:
                await websocket.send_json({"type": "ping"})
                start_time = time.time()
                while time.time() - start_time < 5:
                    msg = await asyncio.wait_for(websocket.receive_json(), timeout=1)
                    if msg.get("type") == "pong":
                        break
                else:
                    print()
                await asyncio.sleep(30)
            except WebSocketDisconnect:
                break
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                break

    try:
        heartbeat_task = asyncio.create_task(heartbeat())
        data = await fetch_data(initial=True)
        await websocket.send_json(data)

        while True:
            data = await fetch_data(initial=False)
            await websocket.send_json(data)
            await asyncio.sleep(60)

    except WebSocketDisconnect:
        print("WebSocket disconnected by client")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            print("Heartbeat task cancelled")
        print("WebSocket handler terminated")

# Ensure this is within your FastAPI app definition

@app.on_event("startup")
async def startup_event():
    """Start background tasks when FastAPI starts."""
    asyncio.create_task(detect_restricted_domains())
    asyncio.create_task(detect_outside_working_hours())
    asyncio.create_task(monitor_client_status())


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup before shutdown (if needed)."""

# ✅ Run Server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

#haarcb