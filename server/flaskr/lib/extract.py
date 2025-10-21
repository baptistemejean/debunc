import io
import re
from openai import OpenAI
import os
import json
from typing import Any, Dict
from flaskr.lib.check import ClaimCheck
from flaskr.lib.types import ClaimExtract, Claims
from json_stream import load, to_standard_types
from json_stream.base import TransientStreamingJSONObject
from flask_socketio import SocketIO

class ClaimExtraction():
  def __init__(self, socket: SocketIO):
    self.client = OpenAI()
    self.prompt_id = "pmpt_68de89ee123c8194ac4d8bd452eafc810e2280cfde2ef08f"
    self.version = 7
    self.claim_check = ClaimCheck(socket)
    self.socket = socket

  def extract(self, text, images, conn_id) -> Claims:
    try:
      content = []
      content.append({"type": "input_text", "text": text})
      for image in images:
        content.append({
                "type": "input_image",
                "image_url": image,
        })

      label_pattern = re.compile(r'"label"\s*:\s*"([^"]*)$')

      string_buffer = ""
      current_label = ""
      in_label = False
      current_id = 0

      buffer = io.StringIO()
      validated_claims = []

      with self.client.responses.stream(
        model="gpt-4.1",
        prompt={
          "id": self.prompt_id,
          "version": str(self.version)
        },
        input=[{
          "role": "user",
          "content": content,
        }],
        text_format=Claims,
        max_output_tokens=2048,
        store=True
      ) as stream:
          for event in stream:
            if event.type == "response.output_text.delta":
              # Little hack to allow streaming live labels to the client
              token = event.delta
              string_buffer += token

              if not in_label:
                match = label_pattern.search(string_buffer)
                if match:
                    in_label = True
                    current_label = match.group(1)
                    self.stream_update(current_id, current_label, conn_id)
              else:
                current_label += token
                if '"' in token:
                    in_label = False
                    current_id += 1
                    self.stream_new(current_id, conn_id)
                else: self.stream_update(current_id, token, conn_id)

              buffer.write(token)

              try:
                buffer.seek(0)
                parser: TransientStreamingJSONObject = load(buffer, persistent=False)

                for claim in parser.get("claims", []):
                    if current_id - 1 not in validated_claims:
                      claim = to_standard_types(claim)
                      if isinstance(claim, dict):
                        claim = ClaimExtract(**claim)
                        validated_claims.append(current_id - 1)
                        if (claim.worth): self.generate_check(claim, current_id - 1, conn_id)

              except Exception:
                # Likely incomplete JSON — safe to ignore and continue
                pass
              finally:
                buffer.seek(0, io.SEEK_END)

    except Exception as e:
        print(f"Error during claim extraction: {e.__class__} {e}")
        return None
      
  def stream_update(self, id, token, conn_id):
    self.socket.emit("label_delta", {"token": token, "id": id}, to=conn_id)

  def stream_new(self, id, conn_id):
    self.socket.emit("label_new", {"id": id}, to=conn_id)

  def generate_check(self, claim: ClaimExtract, id, conn_id, ):
     self.claim_check.check_single(claim, id, conn_id)