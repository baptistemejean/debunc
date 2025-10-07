from openai import OpenAI
import os
import json
from typing import Any, Dict

score_labels = [
    "Solid Fax 📠 (the claim checks out)",
    "Missing Pieces 🧩 (partly true, but lacking context)",
    "Stretched Truth 🪢 (exaggerated or cherry-picked)",
    "Twisted Story 🔀 (seriously misleading)",
    "Made-Up Myth 🐉 (completely fake and harmful)"
]

class ClaimExtraction():
    def __init__(self):
        self.client = OpenAI()
        self.prompt_id = "pmpt_68de89ee123c8194ac4d8bd452eafc810e2280cfde2ef08f"
        self.version = 5

    def extract(self, text, images, parser):
        try:
            content = []
            content.append({"type": "input_text", "text": text})
            for image in images:
                content.append({
                        "type": "input_image",
                        "image_url": image,
                })

            response = self.client.responses.create(
              prompt={
                "id": self.prompt_id,
                "version": str(self.version)
              },
              input=[{
                "role": "user",
                "content": content,
              }],
              text={
                "format": {
                  "type": "text"
                }
              },
              reasoning={},
              max_output_tokens=2048,
              store=True,
            )

            data = parser.parse_claim_extraction(response.output_text)

            return data

        except Exception as e:
            print(f"Error during claim extraction: {e.__class__} {e}")
            return None