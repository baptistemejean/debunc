from pydantic import BaseModel
from typing import List
from openai import types

class PostVideo(BaseModel):
    thumbnail: str
    src: str
    alt: str

class PostData(BaseModel):
    images: List[str]
    videos: List[PostVideo]
    text: str
    name: str
    handle: str
    id: str


class ClaimExtract(BaseModel):
    label: str
    context: str
    worth: bool

class Claims(BaseModel):
    claims: List[ClaimExtract]

class ClaimSearch(BaseModel):
    summary: str
    score: int

# class FullClaim(BaseModel, ClaimExtract, ClaimSearch):
#     sources: types.Se