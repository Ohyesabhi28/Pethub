"""FAISS-backed retriever using Hugging Face Inference API for embeddings.

Index is rebuilt on startup if data/ has been modified or no index file exists.
Persisted to .faiss_index/ for warm restarts.
"""
from __future__ import annotations
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import faiss  # type: ignore
import numpy as np
import httpx

from .loader import load_documents, chunk_text


@dataclass
class Chunk:
    document: str
    index: int
    text: str


class RAGStore:
    def __init__(
        self,
        embed_model: str,
        data_dir: str,
        index_dir: str,
        chunk_size: int = 800,
        overlap: int = 120,
    ):
        self.embed_model_name = embed_model
        self.data_dir = data_dir
        self.index_dir = Path(index_dir)
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.hf_token = os.getenv("HF_API_TOKEN")
        self.index: faiss.Index | None = None
        self.chunks: List[Chunk] = []
        self.dim: int = 384  # Default for all-MiniLM-L6-v2

    # --- public ---

    def build_or_load(self) -> None:
        if self._index_is_fresh():
            self._load()
            print(f"[rag] loaded persisted index ({len(self.chunks)} chunks)")
            return
        self._build()
        self._save()
        print(f"[rag] built fresh index ({len(self.chunks)} chunks)")

    def search(self, query: str, top_k: int = 5) -> List[Tuple[Chunk, float]]:
        if not self.chunks or self.index is None:
            return []
        
        q_emb = self._get_embeddings([query])[0]
        q = np.asarray([q_emb], dtype="float32")
        
        scores, idxs = self.index.search(q, min(top_k, len(self.chunks)))
        out: List[Tuple[Chunk, float]] = []
        for score, i in zip(scores[0].tolist(), idxs[0].tolist()):
            if i < 0:
                continue
            out.append((self.chunks[i], float(score)))
        return out

    # --- internals ---

    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Fetch embeddings from Hugging Face Inference API."""
        api_url = f"https://api-inference.huggingface.co/models/{self.embed_model_name}"
        headers = {"Authorization": f"Bearer {self.hf_token}"} if self.hf_token else {}
        
        # HF API handles batches. For very large datasets, we might need to chunk this.
        max_retries = 3
        for i in range(max_retries):
            try:
                response = httpx.post(api_url, headers=headers, json={"inputs": texts, "options": {"wait_for_model": True}}, timeout=60.0)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 503 and i < max_retries - 1:
                    # Model is loading on HF side
                    time.sleep(5)
                    continue
                else:
                    print(f"[rag] HF API Error: {response.status_code} - {response.text}")
                    # Fallback to zeros if API fails (not ideal, but prevents crash)
                    return [[0.0] * self.dim for _ in texts]
            except Exception as e:
                print(f"[rag] Embedding request failed: {e}")
                if i == max_retries - 1:
                    return [[0.0] * self.dim for _ in texts]
                time.sleep(2)
        return [[0.0] * self.dim for _ in texts]

    def _index_is_fresh(self) -> bool:
        meta = self.index_dir / "meta.json"
        idx_path = self.index_dir / "index.faiss"
        if not meta.exists() or not idx_path.exists():
            return False
        try:
            m = json.loads(meta.read_text())
        except Exception:
            return False
        if m.get("embed_model") != self.embed_model_name:
            return False
        
        latest_src = 0.0
        p = Path(self.data_dir)
        if p.exists():
            for f in p.iterdir():
                if f.is_file():
                    latest_src = max(latest_src, f.stat().st_mtime)
        return idx_path.stat().st_mtime >= latest_src

    def _build(self) -> None:
        docs = load_documents(self.data_dir)
        all_chunks: List[Chunk] = []
        for name, text in docs:
            for i, c in enumerate(chunk_text(text, self.chunk_size, self.overlap)):
                all_chunks.append(Chunk(document=name, index=i, text=c))
        self.chunks = all_chunks
        
        if not self.chunks:
            self.index = faiss.IndexFlatIP(self.dim)
            return

        print(f"[rag] fetching embeddings for {len(self.chunks)} chunks via HF API...")
        embeddings = self._get_embeddings([c.text for c in self.chunks])
        embeddings = np.asarray(embeddings, dtype="float32")
        
        self.dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(self.dim)
        self.index.add(embeddings)

    def _save(self) -> None:
        self.index_dir.mkdir(parents=True, exist_ok=True)
        if self.index is not None:
            faiss.write_index(self.index, str(self.index_dir / "index.faiss"))
        (self.index_dir / "chunks.json").write_text(
            json.dumps([c.__dict__ for c in self.chunks], ensure_ascii=False)
        )
        (self.index_dir / "meta.json").write_text(
            json.dumps({"embed_model": self.embed_model_name, "dim": self.dim})
        )

    def _load(self) -> None:
        self.index = faiss.read_index(str(self.index_dir / "index.faiss"))
        raw = json.loads((self.index_dir / "chunks.json").read_text())
        self.chunks = [Chunk(**c) for c in raw]
        if self.index is not None:
            self.dim = self.index.d
