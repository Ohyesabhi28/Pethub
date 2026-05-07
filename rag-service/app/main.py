"""FastAPI entrypoint for the RAG microservice."""
from __future__ import annotations
import sys
import os
import asyncio
from contextlib import asynccontextmanager

# These are light and needed for type hinting
from .schemas import QueryRequest

print("[rag-service] script starting...", flush=True)

# Move heavy imports inside to allow the server to start instantly
def get_app():
    print("[rag-service] importing dependencies...", flush=True)
    from dotenv import load_dotenv
    from fastapi import FastAPI
    
    print("[rag-service] loading .env...", flush=True)
    load_dotenv()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        print("[rag-service] lifespan starting...", flush=True)
        from .rag import RAGStore
        
        _app.state.store = RAGStore(
            embed_model=os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
            data_dir=os.getenv("DATA_DIR", "./data"),
            index_dir=os.getenv("INDEX_DIR", "./.faiss_index"),
            chunk_size=int(os.getenv("CHUNK_SIZE", "800")),
            overlap=int(os.getenv("CHUNK_OVERLAP", "120")),
        )
        
        # Start loading in background
        print("[rag-service] starting background model load...", flush=True)
        asyncio.create_task(asyncio.to_thread(_app.state.store.build_or_load))
        yield
        print("[rag-service] lifespan shutting down...", flush=True)

    print("[rag-service] creating FastAPI app...", flush=True)
    return FastAPI(title="PetHub RAG Service", version="0.1.0", lifespan=lifespan)

app = get_app()

@app.get("/health")
async def health():
    from fastapi import HTTPException
    store = getattr(app.state, "store", None)
    is_ready = store is not None and store.index is not None
    return {
        "ok": True, 
        "status": "ready" if is_ready else "loading",
        "chunks": len(store.chunks) if store else 0
    }

@app.post("/reindex")
async def reindex():
    from fastapi import HTTPException
    store = getattr(app.state, "store", None)
    if store is None or store.index is None:
        raise HTTPException(status_code=503, detail="store not ready (still loading index)")
    
    await asyncio.to_thread(store._build)
    await asyncio.to_thread(store._save)
    return {"ok": True, "chunks": len(store.chunks)}

@app.post("/query")
async def query(req: QueryRequest):
    from fastapi import HTTPException
    from .llm import generate_answer
    from .safety import sanitize, with_disclaimer
    
    store = getattr(app.state, "store", None)
    if store is None or store.index is None:
        raise HTTPException(status_code=503, detail="RAG store is still initializing.")

    top_k = int(os.getenv("TOP_K", "5"))
    hits = store.search(req.question, top_k=top_k)
    confidence = max(0.0, min(1.0, hits[0][1])) if hits else 0.0

    context_parts = []
    sources = []
    for chunk, score in hits:
        context_parts.append(f"[{chunk.document}#{chunk.index}] {chunk.text}")
        sources.append({
            "document": chunk.document,
            "chunk_index": chunk.index,
            "score": round(score, 4),
            "snippet": chunk.text[:240] + ("..." if len(chunk.text) > 240 else ""),
        })
    context = "\n\n".join(context_parts)

    pet = req.petContext.model_dump() if req.petContext else None
    result = await generate_answer(req.question, context, pet)

    answer, safe = sanitize(result.text)
    answer = with_disclaimer(answer)
    if not hits:
        confidence = min(confidence, 0.2)

    return {
        "answer": answer,
        "sources": sources,
        "confidence": round(confidence, 3),
        "llm_used": result.source,
        "safe": safe,
    }
