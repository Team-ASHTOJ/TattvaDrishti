"""
Cryptographic helpers for the federated ledger.
"""
import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
import hashlib

from ..config import get_settings

settings = get_settings()
fernet = Fernet(settings.federated_encryption_key.encode())

# Generate a node-specific key pair. In a real-world scenario, this would be loaded from a secure store.
PRIVATE_KEY = Ed25519PrivateKey.generate()
PUBLIC_KEY = PRIVATE_KEY.public_key()


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def encrypt_data(data: dict) -> str:
    return fernet.encrypt(json.dumps(data).encode()).decode()


def decrypt_data(enc: str) -> dict:
    return json.loads(fernet.decrypt(enc.encode()).decode())


def get_public_key_hex() -> str:
    return PUBLIC_KEY.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    ).hex()


def sign_payload(payload: str) -> str:
    return PRIVATE_KEY.sign(payload.encode()).hex()


def verify_signature(pubkey_hex: str, payload: str, sig_hex: str) -> bool:
    try:
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(pubkey_hex))
        pub.verify(bytes.fromhex(sig_hex), payload.encode())
        return True
    except Exception:
        return False
