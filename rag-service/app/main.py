"""FastAPI entrypoint for the RAG microservice."""
from __future__ import annotations
import os
import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
import uvicorn

from .schemas import QueryRequest, QueryResponse, Source
from .rag import RAGStore
from .llm import generate_answer
from .safety import sanitize, with_disclaimer

load_dotenv()

store: RAGStore | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global store
    store = RAGStore(
        embed_model=os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
        data_dir=os.getenv("DATA_DIR", "./data"),
        index_dir=os.getenv("INDEX_DIR", "./.faiss_index"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "800")),
        overlap=int(os.getenv("CHUNK_OVERLAP", "120")),
    )
    
    # Start loading in background so port opens immediately for Render health check
    print("[rag-service] starting background model load... (port will open now)")
    asyncio.create_task(asyncio.to_thread(store.build_or_load))
    
    yield


app = FastAPI(title="PetHub RAG Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
async def health():
    is_ready = store is not None and store.index is not None
    return {
        "ok": True, 
        "status": "ready" if is_ready else "loading",
        "chunks": len(store.chunks) if store else 0
    }


@app.post("/reindex")
async def reindex():
    """Force rebuild the index from data/. Useful after adding new PDFs."""
    if store is None or store.index is None:
        raise HTTPException(status_code=503, detail="store not ready (still loading index)")
    
    await asyncio.to_thread(store._build)  # noqa: SLF001
    await asyncio.to_thread(store._save)   # noqa: SLF001
    return {"ok": True, "chunks": len(store.chunks)}


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    if store is None or store.index is None:
        raise HTTPException(status_code=503, detail="RAG store is still initializing. Please try again in a minute.")

    top_k = int(os.getenv("TOP_K", "5"))
    hits = store.search(req.question, top_k=top_k)

    # Confidence: max retrieval score clamped to [0,1].
    confidence = max(0.0, min(1.0, hits[0][1])) if hits else 0.0

    context_parts = []
    sources: list[Source] = []
    for chunk, score in hits:
        context_parts.append(f"[{chunk.document}#{chunk.index}] {chunk.text}")
        sources.append(Source(
            document=chunk.document,
            chunk_index=chunk.index,
            score=round(score, 4),
            snippet=chunk.text[:240] + ("..." if len(chunk.text) > 240 else ""),
        ))
    context = "\n\n".join(context_parts)

    pet = req.petContext.model_dump() if req.petContext else None
    result = await generate_answer(req.question, context, pet)

    answer, safe = sanitize(result.text)
    answer = with_disclaimer(answer)

    # If we had no retrieval hits, force-confidence down regardless of LLM tone.
    if not hits:
        confidence = min(confidence, 0.2)

    return QueryResponse(
        answer=answer,
        sources=sources,
        confidence=round(confidence, 3),
        llm_used=result.source,
        safe=safe,
    )


def main():
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        reload=False,
    )


if __name__ == "__main__":
    main()
