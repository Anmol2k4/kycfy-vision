import os
import secrets
from pathlib import Path


class LocalDocumentStorage:
    """Development storage adapter; stored keys are random and never user paths."""

    def __init__(self) -> None:
        self.root = Path(os.getenv("UPLOAD_DIR", "./data/uploads")).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, content: bytes, extension: str) -> str:
        key = f"{secrets.token_hex(20)}{extension}"
        (self.root / key).write_bytes(content)
        return key

    def resolve(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if path.parent != self.root:
            raise ValueError("Invalid storage key")
        return path


storage = LocalDocumentStorage()
