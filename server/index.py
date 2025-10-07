from lib.check import ClaimCheck, score_labels
from lib.extract import ClaimExtraction
from utils.parser import Parser
from flask import Flask
from flask_cors import CORS, cross_origin
import json
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

        
load_dotenv()

def fact_check(text, images):
    claim_extraction = ClaimExtraction()
    claim_check = ClaimCheck()
    parser = Parser()
    extracted = claim_extraction.extract(text, images, parser)
    data = claim_check.batch_check(extracted["claims"], parser)

    return data

def format_request_data(data):
    try:
        images = data["images"]
        for v in data["videos"]:
            images.append(v["thumbnail"])
        text = f"{data["name"]} (@{data["handle"]}):\n{data["text"]}"

        return text, images
    except Exception as e:
        print(f"Wrong request format: {e}")

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": f"chrome-extension://{os.getenv("EXTENSION_ID")}"
    }
})

# limiter = Limiter(
#     get_remote_address,
#     app=app,
#     default_limits=["200 per day"],
#     storage_uri="memory://",
# )

@app.errorhandler(HTTPException)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    # start with the correct headers and status code from the error
    response = e.get_response()
    # replace the body with JSON
    response.data = json.dumps({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    return response

@app.route("/", methods=["POST"])
def home():
    content = request.json

    text, images = format_request_data(content)
    data = fact_check(text, images)

    return data



if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)