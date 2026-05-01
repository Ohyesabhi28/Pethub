from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class PetContext(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[float] = None
    weightKg: Optional[float] = None
    history: Optional[str] = None


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    petContext: Optional[PetContext] = None


class Source(BaseModel):
    document: str
    chunk_index: int
    score: float
    snippet: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    confidence: float
    llm_used: str  # "ollama" | "openrouter" | "rule_based"
    safe: bool
