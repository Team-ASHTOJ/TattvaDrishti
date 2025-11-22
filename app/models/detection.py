import math
import re
import statistics
from collections import Counter
from typing import Dict, List, Optional, Tuple

from ..config import get_settings
from ..integrations.hf_detector import get_hf_detector
from ..integrations.ollama_client import OllamaClient
from ..schemas import ContentIntake, DetectionBreakdown


class DetectorEngine:
    """Heuristic + lightweight ML-style scoring without external dependencies."""

    SUSPECT_PLATFORMS = {"unknown-forum", "darknet", "anonymized-messaging"}
    HIGH_RISK_TAGS = {"election", "extremism", "disinfo-campaign"}
    FUNCTION_WORDS = {
        "the",
        "a",
        "to",
        "of",
        "and",
        "in",
        "that",
        "is",
        "for",
        "on",
        "with",
    }

    def __init__(self) -> None:
        self.settings = get_settings()
        # Weights mimicking a trained linear model; tuned for interpretability.
        self.weights = {
            "avg_token_length": 0.9,
            "type_token_ratio": -1.3,
            "sentence_length_var": 0.8,
            "burstiness": 1.2,
            "function_word_ratio": -0.7,
            "uppercase_ratio": 0.6,
        }
        self.bias = -0.25
        self._hf_detector = get_hf_detector()
        self._ollama = OllamaClient()

    def detect(self, intake: ContentIntake) -> Tuple[float, str, DetectionBreakdown]:
        features = self._extract_features(intake.text)
        score = self._score_features(features)
        heuristics = self._run_heuristics(intake, features)
        behavior_score = self._behavioral_boost(intake, features, heuristics)
        hf_score = self._hf_probability(intake.text)
        ollama_score = self._ollama_risk(intake.text)
        if hf_score is not None:
            heuristics.append(
                f"HuggingFace detector indicates AI likelihood {hf_score:.2f}."
            )
        if ollama_score is not None:
            heuristics.append(
                f"Ollama analyst model returned risk {ollama_score:.2f}."
            )

        base_score = self._sigmoid(score + behavior_score)
        composite = self._blend_scores(base_score, hf_score, ollama_score)
        classification = self._classify(composite)

        breakdown = DetectionBreakdown(
            linguistic_score=self._sigmoid(score),
            behavioral_score=behavior_score,
            hf_probability=hf_score,
            ollama_risk=ollama_score,
            stylometric_anomalies={k: round(v, 3) for k, v in features.items()},
            heuristics=heuristics,
        )
        return composite, classification, breakdown

    def _extract_features(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        token_count = len(tokens) or 1
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_lengths = [len(self._tokenize(sentence)) for sentence in sentences] or [token_count]

        avg_token_length = sum(len(token) for token in tokens) / token_count
        type_token_ratio = len(set(tokens)) / token_count
        hapax = sum(1 for _, count in Counter(tokens).items() if count == 1)
        hapax_ratio = hapax / token_count

        try:
            sentence_length_var = statistics.variance(sentence_lengths)
        except statistics.StatisticsError:
            sentence_length_var = 0.0

        uppercase_tokens = sum(1 for token in tokens if token.isupper() and len(token) > 2)
        function_words = sum(1 for token in tokens if token.lower() in self.FUNCTION_WORDS)

        bursts = self._burstiness(tokens)

        return {
            "avg_token_length": avg_token_length,
            "type_token_ratio": type_token_ratio,
            "hapax_ratio": hapax_ratio,
            "sentence_length_var": sentence_length_var,
            "burstiness": bursts,
            "function_word_ratio": function_words / token_count,
            "uppercase_ratio": uppercase_tokens / token_count,
        }

    def _score_features(self, features: Dict[str, float]) -> float:
        normalized = self._normalize_features(features)
        score = self.bias
        for name, weight in self.weights.items():
            score += weight * normalized.get(name, 0.0)
        # Penalize aggressive lexical novelty (already normalized 0-1)
        score += 0.5 * max(0.0, normalized.get("hapax_ratio", 0.0) - 0.45)
        score -= self._human_likeness_bonus(features)
        return score

    def _run_heuristics(
        self,
        intake: ContentIntake,
        features: Dict[str, float],
    ) -> List[str]:
        heuristics: List[str] = []

        if features.get("burstiness", 0) > 0.65:
            heuristics.append("High token burstiness consistent with templated LLM output.")
        if features.get("type_token_ratio", 0) < 0.35:
            heuristics.append("Low lexical diversity suggests automated paraphrasing.")
        if features.get("uppercase_ratio", 0) > 0.12:
            heuristics.append("Elevated uppercase usage, possible emphasis engineering.")
        if intake.metadata and intake.metadata.platform in self.SUSPECT_PLATFORMS:
            heuristics.append("Source platform flagged from threat intel.")
        if intake.tags and any(tag in self.HIGH_RISK_TAGS for tag in intake.tags):
            heuristics.append("Tags overlap with tracked influence narratives.")
        if "http" in intake.text and intake.text.count("http") > 3:
            heuristics.append("Multiple embedded links, check for malware payload.")

        if (
            features.get("type_token_ratio", 0) > 0.55
            and features.get("hapax_ratio", 0) > 0.4
            and features.get("function_word_ratio", 0) > 0.12
        ):
            heuristics.append("High lexical diversity and function-word balance consistent with human-authored prose.")

        return heuristics

    def _normalize_features(self, features: Dict[str, float]) -> Dict[str, float]:
        # Map raw stylometric statistics into bounded ranges so literature-like passages do not saturate scores.
        avg_token_length = min(features.get("avg_token_length", 0.0) / 8.0, 1.5)
        type_token_ratio = max(0.0, min(features.get("type_token_ratio", 0.0), 1.0))
        hapax_ratio = max(0.0, min(features.get("hapax_ratio", 0.0), 1.0))
        sentence_length_var = math.tanh(features.get("sentence_length_var", 0.0) / 30.0)
        burstiness = max(0.0, min(features.get("burstiness", 0.0), 1.0))
        function_word_ratio = max(0.0, min(features.get("function_word_ratio", 0.0) * 1.4, 1.0))
        uppercase_ratio = max(0.0, min(features.get("uppercase_ratio", 0.0) * 2.0, 1.0))

        return {
            "avg_token_length": avg_token_length,
            "type_token_ratio": type_token_ratio,
            "hapax_ratio": hapax_ratio,
            "sentence_length_var": sentence_length_var,
            "burstiness": burstiness,
            "function_word_ratio": function_word_ratio,
            "uppercase_ratio": uppercase_ratio,
        }

    def _human_likeness_bonus(self, features: Dict[str, float]) -> float:
        bonus = 0.0
        type_token_ratio = features.get("type_token_ratio", 0.0)
        hapax_ratio = features.get("hapax_ratio", 0.0)
        function_word_ratio = features.get("function_word_ratio", 0.0)
        sentence_var = features.get("sentence_length_var", 0.0)

        if type_token_ratio > 0.52:
            bonus += 0.15
        if hapax_ratio > 0.38:
            bonus += 0.1
        if function_word_ratio > 0.14:
            bonus += 0.06
        if sentence_var > 35 and type_token_ratio > 0.45:
            bonus += 0.04

        return min(bonus, 0.18)

    def _blend_scores(
        self,
        base_score: float,
        hf_score: Optional[float],
        ollama_score: Optional[float],
    ) -> float:
        weights = []
        scores = []

        weights.append(0.45)
        scores.append(base_score)

        if hf_score is not None:
            weights.append(0.1)
            scores.append(hf_score)
        if ollama_score is not None:
            weights.append(0.55)
            scores.append(ollama_score)
        total_weight = sum(weights)
        composite = sum(w * s for w, s in zip(weights, scores)) / total_weight
        return max(0.0, min(1.0, composite))

    def _behavioral_boost(
        self,
        intake: ContentIntake,
        features: Dict[str, float],
        heuristics: List[str],
    ) -> float:
        """
        Derive a behavioural risk modifier using metadata, triggered heuristics,
        and stylometric cues so analysts see a meaningful non-zero signal.
        """
        boost = 0.0
        metadata = intake.metadata

        if metadata:
            region = (metadata.region or "").upper()
            if region in {"RU", "IR", "KP"}:
                boost += 0.2
            elif region in {"CN", "SY", "BY"}:
                boost += 0.1

            if metadata.platform in self.SUSPECT_PLATFORMS:
                boost += 0.1

        if intake.tags:
            flagged = sum(1 for tag in intake.tags if tag in self.HIGH_RISK_TAGS)
            if flagged:
                boost += 0.08 * flagged

        heuristic_weights = {
            "High token burstiness": 0.08,
            "Low lexical diversity": 0.06,
            "Elevated uppercase usage": 0.04,
            "Multiple embedded links": 0.05,
            "Source platform flagged": 0.05,
            "Tags overlap with tracked influence narratives.": 0.04,
        }
        for message, weight in heuristic_weights.items():
            if any(message in heuristic for heuristic in heuristics):
                boost += weight

        if features.get("burstiness", 0.0) > 0.75:
            boost += 0.05
        if features.get("hapax_ratio", 1.0) < 0.22:
            boost += 0.04
        if features.get("function_word_ratio", 1.0) < 0.09:
            boost += 0.03

        if boost > 0.0:
            boost = max(boost, 0.06)
        return min(boost, 0.65)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"\b\w+\b", text)

    @staticmethod
    def _burstiness(tokens: List[str]) -> float:
        if not tokens:
            return 0.0
        windows = [
            tokens[i : i + 10] for i in range(0, len(tokens), 10) if len(tokens[i : i + 10]) == 10
        ]
        if not windows:
            return 0.0
        uniques = [len(set(window)) / len(window) for window in windows]
        return sum(uniques) / len(uniques)

    @staticmethod
    def _sigmoid(x: float) -> float:
        return 1 / (1 + math.exp(-x))

    @staticmethod
    def _classify(score: float) -> str:
        if score >= 0.68:
            return "high-risk"
        if score >= 0.4:
            return "medium-risk"
        return "low-risk"

    def _hf_probability(self, text: str) -> Optional[float]:
        if not self._hf_detector.available:
            return None
        probability = self._hf_detector.score(text)
        if probability is None:
            return None
        calibrated = probability ** 0.8
        return max(probability, min(1.0, calibrated))

    def _ollama_risk(self, text: str) -> Optional[float]:
        return self._ollama.risk_assessment(text)
