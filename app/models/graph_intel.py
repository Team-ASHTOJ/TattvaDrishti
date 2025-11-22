from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Tuple

import networkx as nx

from ..schemas import ContentIntake, GraphSummary


class GraphIntelEngine:
    def __init__(self) -> None:
        self.graph = nx.Graph()

    def ingest(
        self,
        intake_id: str,
        intake: ContentIntake,
        classification: str,
        composite_score: float,
    ) -> GraphSummary:
        content_node = f"content::{intake_id}"
        self.graph.add_node(
            content_node,
            type="content",
            score=composite_score,
            classification=classification,
            ts=datetime.utcnow().isoformat(),
        )

        actor_id = (
            intake.metadata.actor_id
            if intake.metadata and intake.metadata.actor_id
            else f"actor::anon::{hash(intake.source) % 10000}"
        )
        self.graph.add_node(actor_id, type="actor")
        self.graph.add_edge(actor_id, content_node, relation="published")

        if intake.tags:
            for tag in intake.tags:
                tag_node = f"narrative::{tag}"
                self.graph.add_node(tag_node, type="narrative")
                self.graph.add_edge(content_node, tag_node, relation="targets")

        if intake.metadata and intake.metadata.region:
            region_node = f"region::{intake.metadata.region}"
            self.graph.add_node(region_node, type="region")
            self.graph.add_edge(actor_id, region_node, relation="origin")

        return self._summarise()

    def summary(self) -> GraphSummary:
        return self._summarise()

    def _summarise(self) -> GraphSummary:
        node_count = self.graph.number_of_nodes()
        edge_count = self.graph.number_of_edges()
        high_risk = self._top_risk_actors()
        communities = self._communities_snapshot()

        return GraphSummary(
            node_count=node_count,
            edge_count=edge_count,
            high_risk_actors=high_risk,
            communities=communities,
        )

    def _top_risk_actors(self, limit: int = 5) -> List[str]:
        actors = [
            (node, data)
            for node, data in self.graph.nodes(data=True)
            if data.get("type") == "actor"
        ]
        scores: List[Tuple[str, float]] = []
        for actor, _ in actors:
            neighbor_scores = [
                self.graph.nodes[n].get("score", 0.0)
                for n in self.graph.neighbors(actor)
                if self.graph.nodes[n].get("type") == "content"
            ]
            if neighbor_scores:
                scores.append((actor, sum(neighbor_scores) / len(neighbor_scores)))
        scores.sort(key=lambda item: item[1], reverse=True)
        return [actor for actor, _ in scores[:limit]]

    def _communities_snapshot(self) -> List[Dict[str, List[str]]]:
        communities: List[Dict[str, List[str]]] = []
        for component in nx.connected_components(self.graph):
            content = [node for node in component if node.startswith("content::")]
            actors = [node for node in component if node.startswith("actor::")]
            if content or actors:
                communities.append({"actors": actors, "content": content})
        return communities
