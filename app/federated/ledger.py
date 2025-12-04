"""
Blockchain data structures.
"""
import json
import time
from dataclasses import dataclass, asdict

from .crypto import sha256, sign_payload, get_public_key_hex


@dataclass
class Block:
    index: int
    timestamp: float
    data_encrypted: str
    previous_hash: str
    hash: str
    signature: str
    public_key: str

    def payload(self) -> str:
        """
        Canonical JSON representation for hashing and signing.
        The hash and signature are excluded from the payload itself.
        """
        obj = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data_encrypted": self.data_encrypted,
            "previous_hash": self.previous_hash,
            "public_key": self.public_key,
        }
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))

    @classmethod
    def create_new(cls, index: int, data_encrypted: str, previous_hash: str) -> "Block":
        """Creates and signs a new block."""
        new_block = cls(
            index=index,
            timestamp=time.time(),
            data_encrypted=data_encrypted,
            previous_hash=previous_hash,
            public_key=get_public_key_hex(),
            signature="",
            hash="",
        )
        payload = new_block.payload()
        new_block.hash = sha256(payload)
        new_block.signature = sign_payload(payload)
        return new_block
