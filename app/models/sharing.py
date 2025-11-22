import hashlib
import json
from datetime import datetime
from typing import Dict, List
from uuid import uuid4

from ..config import get_settings
from ..schemas import SharingPackage


class SharingEngine:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_package(
        self,
        intake_id: str,
        destination: str,
        payload: Dict[str, str],
        policy_tags: List[str],
    ) -> SharingPackage:
        package_id = f"pkg-{uuid4()}"
        created_at = datetime.utcnow()
        envelope = {
            "intake_id": intake_id,
            "destination": destination,
            "created_at": created_at.isoformat(),
            "payload": payload,
            "policy_tags": policy_tags,
        }
        signature = self._sign(envelope)
        return SharingPackage(
            package_id=package_id,
            created_at=created_at,
            destination=destination,
            policy_tags=policy_tags,
            payload={k: json.dumps(v) if isinstance(v, dict) else str(v) for k, v in payload.items()},
            signature=signature,
        )

    def _sign(self, envelope: Dict[str, str]) -> str:
        serialised = json.dumps(envelope, sort_keys=True)
        digest = hashlib.sha256((self.settings.secret_key + serialised).encode("utf-8"))
        return digest.hexdigest()
