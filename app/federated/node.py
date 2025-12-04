"""
Federated Node for P2P communication and chain synchronization.
"""
import requests
from typing import Set
from dataclasses import asdict

from ..config import get_settings
from .ledger import Block


class Node:
    def __init__(self):
        settings = get_settings()
        self.nodes: Set[str] = {u.strip().rstrip("/") for u in settings.federated_nodes.split(",") if u.strip()}
        self.my_url = settings.node_url.rstrip("/")

    def broadcast_block(self, block: Block):
        """Broadcasts a new block to all other nodes in the network."""
        for node_url in self.nodes:
            if node_url != self.my_url:
                try:
                    requests.post(f"{node_url}/api/v1/federated/receive_block", json=asdict(block), timeout=2)
                except requests.RequestException:
                    # Log or handle failed broadcast to a node
                    pass
