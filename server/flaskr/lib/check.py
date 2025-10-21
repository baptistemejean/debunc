import re
from openai import OpenAI
import concurrent.futures

from flaskr.lib.types import ClaimExtract, ClaimSearch

class ClaimCheck():
  def __init__(self, socket):
      self.client = OpenAI()

      self.prompt_id = "pmpt_68de90db61ac81949aa56895e3edb56103119a8608241252"
      self.version = 7
      self.max_batch_workers = 3

      self.socket = socket

  # def batch_check(self, claims, parser):
  #   with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_batch_workers) as pool:
  #       futures = {pool.submit(self.check_single, claim, parser): claim for claim in claims}
  #       responses = []
        
  #       for future in concurrent.futures.as_completed(futures):
  #           try:
  #               result = future.result()
  #               responses.append(result)
  #           except Exception as e:
  #               print(f"Error checking claim {futures[future]}: {e}")
  #               responses.append(None)  # or handle as needed
    
  #   return responses

  def check_single(self, claim: ClaimExtract, id, conn_id):
      try:
        claim_text = f"{claim.label} {claim.context}"
        content = [{"type": "input_text", "text": claim_text}]

        summary_pattern = re.compile(r'"summary"\s*:\s*"([^"]*)$')

        string_buffer = ""
        current_summary = ""
        in_summary = False

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
          text_format=ClaimSearch,
          max_output_tokens=2048,
          store=True,
          include=["web_search_call.action.sources"]
        ) as stream:
            for event in stream:
              if event.type == "response.output_text.delta":
                # Little hack to allow streaming live summary to the client
                token = event.delta
                string_buffer += token

                if not in_summary:
                  match = summary_pattern.search(string_buffer)
                  if match:
                      in_summary = True
                      current_summary = match.group(1)
                      self.stream_update(id, current_summary, conn_id)
                else:
                  current_summary += token
                  if '"' in token:
                      in_summary = False
                      self.stream_complete(id, conn_id)
                  else: self.stream_update(id, token, conn_id)
      except Exception as e:
          print(f"Error during claim check: {e.__class__} {e}")
          return None
      
  def stream_update(self, id, token, conn_id):
    self.socket.emit("summary_delta", {"token": token, "id": id}, to=conn_id)

  def stream_complete(self, id, conn_id):
    self.socket.emit("summary_complete", {"id": id}, to=conn_id)
        