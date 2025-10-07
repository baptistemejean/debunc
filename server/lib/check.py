from openai import OpenAI
import concurrent.futures

score_labels = [
    "Solid Fax 📠 (the claim checks out)",
    "Missing Pieces 🧩 (partly true, but lacking context)",
    "Stretched Truth 🪢 (exaggerated or cherry-picked)",
    "Twisted Story 🔀 (seriously misleading)",
    "Made-Up Myth 🐉 (completely fake and harmful)"
]

class ClaimCheck():
    def __init__(self):
        self.client = OpenAI()

        self.prompt_id = "pmpt_68de90db61ac81949aa56895e3edb56103119a8608241252"
        self.version = 7
        self.max_batch_workers = 3

    def batch_check(self, claims, parser):
      with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_batch_workers) as pool:
          futures = {pool.submit(self.check_single, claim, parser): claim for claim in claims}
          responses = []
          
          for future in concurrent.futures.as_completed(futures):
              try:
                  result = future.result()
                  responses.append(result)
              except Exception as e:
                  print(f"Error checking claim {futures[future]}: {e}")
                  responses.append(None)  # or handle as needed
      
      return responses

    def check_single(self, claim, parser):
        try:
            claim_text = f"{claim["claim"]} {claim["context"]}" 
            content = [{"type": "input_text", "text": claim_text}]

            response = self.client.responses.create(
              prompt={
                "id": self.prompt_id,
                "version": str(self.version)
              },
              input=[{
                "role": "user",
                "content": content
              }],
              text={
                "format": {
                  "type": "text"
                }
              },
              reasoning={},
              max_output_tokens=2048,
              store=True,
              include=["web_search_call.action.sources"]
            )

            data = parser.parse_claim_check(response.output_text)

            sources = []

            for output in response.output:
                if output.type == "web_search_call":
                    if output.action.type == "search":
                        for s in output.action.sources:
                            sources.append(s.to_dict())
                  

            data["claim"] = claim["claim"]
            data["sources"] = sources

            return data
        except Exception as e:
            print(f"Error during claim check: {e.__class__} {e}")
            return None
        