"""Load .pdf and .txt files from data/ and split into overlapping chunks."""
from __future__ import annotations
import os
from pathlib import Path
from typing import List, Tuple

from pypdf import PdfReader


def _read_pdf(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as e:  # corrupted PDF — skip but don't crash startup
        print(f"[loader] failed to read {path.name}: {e}")
        return ""


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def load_documents(data_dir: str) -> List[Tuple[str, str]]:
    """Return list of (filename, full_text)."""
    p = Path(data_dir)
    p.mkdir(parents=True, exist_ok=True)
    docs: List[Tuple[str, str]] = []
    for f in sorted(p.iterdir()):
        if not f.is_file():
            continue
        if f.suffix.lower() == ".pdf":
            text = _read_pdf(f)
        elif f.suffix.lower() in (".txt", ".md"):
            text = _read_text(f)
        else:
            continue
        if text.strip():
            docs.append((f.name, text))
    return docs


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    """Naive whitespace-aware chunking. Adequate for MVP."""
    text = " ".join(text.split())
    if not text:
        return []
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # try to end on a sentence boundary
        if end < len(text):
            for delim in (". ", "? ", "! ", "; "):
                idx = text.rfind(delim, start + chunk_size // 2, end)
                if idx != -1:
                    end = idx + len(delim)
                    break
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]
