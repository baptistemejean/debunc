from flaskr.lib.check import ClaimCheck
from flaskr.lib.extract import ClaimExtraction
from flaskr.utils.parser import Parser
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import json
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException, Unauthorized, InternalServerError
from flask_socketio import SocketIO, emit, ConnectionRefusedError
import json
import requests
import db
from flaskr.lib.types import PostData

        
load_dotenv()

def generate(data: PostData, sid: str):
    claim_extraction = ClaimExtraction(socketio)
    extracted = claim_extraction.extract(data.text, data.images, sid)
    # data = claim_check.batch_check(extracted["claims"])

    return data

def format_request_data(data):
    try:
        images = data["images"]
        for v in data["videos"]:
            images.append(v["thumbnail"])
        text = f"{data['name']} (@{data['handle']}):\n{data['text']}"

        return text, images
    except Exception as e:
        print(f"Wrong request format: {e}")

app = Flask(__name__)

# Production configuration
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
    ENV=os.getenv('FLASK_ENV', 'production'),
    DEBUG=os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
    TESTING=False,
    # Security settings
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=3600,
)

# CORS(app, resources={
#     r"/*": {
#         "origins": f"chrome-extension://{os.getenv('EXTENSION_ID')}"
#     }
# })

# limiter = Limiter(
#     get_remote_address,
#     app=app,
#     default_limits=["200 per day"],
#     storage_uri="memory://",
# )

socketio = SocketIO(app, logger=True, json=json, always_connect=False, cors_credentials=True, cors_allowed_origins=f"chrome-extension://{os.getenv('EXTENSION_ID')}")

@app.errorhandler(HTTPException)
def handle_exception(e):
    response = e.get_response()

    response.data = json.dumps({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    return response

# @app.route("/", methods=["POST"])
# def home():
#     content = request.json

#     text, images = format_request_data(content)
#     data = fact_check(text, images)

#     return data

GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"

@socketio.on('connect')
def handle_connect(json):
    try:
        headers = {"Authorization": f"Bearer {json['token']}"}
        r = requests.get(GOOGLE_USERINFO_ENDPOINT, headers=headers)

        if r.status_code != 200:
            raise Unauthorized("Invalid or expired token")

        user_info = r.json()
        sub = user_info.get("sub")  # unique user ID from Google

        if not sub:
            raise InternalServerError("Unable to retrieve user info")
        

        uid, reqs_left = db.fetch_user(conn, sub)
        db.create_connection(conn, request.sid, uid)

        emit("accepted")
        emit("update", {"requestsLeft": reqs_left})
        
    except Exception as e:
        raise ConnectionRefusedError(f"Unauthorized {e}")
    
@socketio.on("disconnect")
def handle_disconnect():
    db.delete_connection(conn, request.sid)
    print(f"disconnected {request.sid}")

@socketio.on("generate")
def handle_generate(json):
    try:
        data = PostData.model_validate(json)
        generate(data, request.sid)
        return
    except Exception as e:
        raise InternalServerError(e)


if __name__ == "__main__":
    conn = db.connect()
    if (conn): 
        socketio.run(app)
        conn.close()
