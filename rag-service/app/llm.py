"""LLM dispatcher: Ollama (primary) -> OpenRouter (fallback) -> rule-based (final).

The order is intentional: local + free + offline first, network LLM second,
canned advice last. This is the inverse of the brief, which had OpenRouter
as primary; OpenRouter requires network + API key + isn't always available.
"""
from __future__ import annotations
import os
import asyncio
from dataclasses import dataclass
from typing import Optional, Tuple

import httpx


SYSTEM_PROMPT = (
    "You are PetHub Assistant, a helpful AI for pet owners. "
    "Use ONLY the provided context to answer. "
    "If the context does not contain enough information, say so plainly and recommend "
    "consulting a veterinarian. Keep responses concise (under 200 words). "
    "Never recommend specific medication doses without telling the user to confirm with a vet. "
    "If the question describes an emergency (bleeding, seizure, collapse, poisoning, "
    "difficulty breathing, bloated abdomen), tell the user to seek emergency veterinary care immediately."
)


@dataclass
class LLMResult:
    text: str
    source: str  # "ollama" | "openrouter" | "rule_based"


def _build_prompt(question: str, context: str, pet_context: Optional[dict]) -> str:
    pet_block = ""
    if pet_context:
        bits = []
        if pet_context.get("name"): bits.append(f"name={pet_context['name']}")
        if pet_context.get("species"): bits.append(f"species={pet_context['species']}")
        if pet_context.get("breed"): bits.append(f"breed={pet_context['breed']}")
        if pet_context.get("age") is not None: bits.append(f"age={pet_context['age']}y")
        if pet_context.get("weightKg") is not None: bits.append(f"weight={pet_context['weightKg']}kg")
        if pet_context.get("history"): bits.append(f"history={pet_context['history']}")
        if bits:
            pet_block = "\n\nPet profile: " + ", ".join(bits)
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context:\n{context or '(no documents indexed)'}\n"
        f"{pet_block}\n\n"
        f"Question: {question}\n\nAnswer:"
    )


async def _try_ollama(prompt: str) -> Optional[str]:
    url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "phi3:mini")
    timeout = float(os.getenv("OLLAMA_TIMEOUT_S", "20"))
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(
                f"{url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False,
                      "options": {"temperature": 0.3, "num_predict": 400}},
            )
            r.raise_for_status()
            data = r.json()
            text = (data.get("response") or "").strip()
            return text or None
    except Exception as e:
        print(f"[llm:ollama] failed: {e}")
        return None


async def _try_openrouter(prompt: str) -> Optional[str]:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        return None
    model = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct:free")
    timeout = float(os.getenv("OPENROUTER_TIMEOUT_S", "25"))
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "PetHub MVP",
                },
                json={"model": model, "messages": [{"role": "user", "content": prompt}],
                      "max_tokens": 400, "temperature": 0.3},
            )
            r.raise_for_status()
            data = r.json()
            return (data["choices"][0]["message"]["content"] or "").strip() or None
    except Exception as e:
        print(f"[llm:openrouter] failed: {e}")
        return None


def _rule_based(question: str, pet_context: Optional[dict]) -> str:
    """Final fallback. Catches a handful of common topics."""
    q = question.lower()
    who = f"For {pet_context['name']}: " if pet_context and pet_context.get("name") else ""
    if any(w in q for w in ["vomit", "blood", "seizure", "collaps", "poison", "breath", "bloat"]):
        return f"{who}These signs can be a veterinary emergency. Please contact an emergency clinic immediately."
    if any(w in q for w in ["food", "diet", "eat", "treat"]):
        return (f"{who}Match diet to species, life stage, and weight. "
                "Avoid chocolate, grapes/raisins, onions, garlic, xylitol, and macadamia nuts for dogs. "
                "Cats should not have lilies, onions, or excessive raw fish. Discuss specifics with your vet.")
    if "vaccin" in q:
        return (f"{who}Core canine vaccines: rabies, distemper, parvo, adenovirus. "
                "Core feline: rabies, FVRCP. Schedule depends on age and prior history.")
    if any(w in q for w in ["flea", "tick", "worm"]):
        return (f"{who}Year-round parasite prevention is recommended in most regions. "
                "Common options include Bravecto, NexGard, Frontline (topical), and Heartgard.")
    return (f"{who}I'm having trouble reaching the AI service. "
            "Please consult a veterinarian for guidance specific to your pet.")


async def generate_answer(
    question: str, context: str, pet_context: Optional[dict]
) -> LLMResult:
    prompt = _build_prompt(question, context, pet_context)
    text = await _try_ollama(prompt)
    if text:
        return LLMResult(text=text, source="ollama")
    text = await _try_openrouter(prompt)
    if text:
        return LLMResult(text=text, source="openrouter")
    return LLMResult(text=_rule_based(question, pet_context), source="rule_based")
