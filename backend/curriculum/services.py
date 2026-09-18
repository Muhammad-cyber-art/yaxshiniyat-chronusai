import logging
import math
from typing import List, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE_TOKENS = 400
CHUNK_OVERLAP_TOKENS = 50
CHARS_PER_TOKEN_APPROX = 4

class CurriculumService:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_TOKENS, overlap: int = CHUNK_OVERLAP_TOKENS) -> List[str]:
        max_chars = chunk_size * CHARS_PER_TOKEN_APPROX
        overlap_chars = overlap * CHARS_PER_TOKEN_APPROX
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) + 2 <= max_chars:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                if len(para) > max_chars:
                    sentences = para.replace(". ", ".|").split("|")
                    temp = ""
                    for sent in sentences:
                        if len(temp) + len(sent) <= max_chars:
                            temp += (" " if temp else "") + sent
                        else:
                            if temp:
                                chunks.append(temp.strip())
                            temp = sent
                    current_chunk = temp
                else:
                    overlap_text = current_chunk[-overlap_chars:] if chunks else ""
                    current_chunk = (overlap_text + "\n\n" + para).strip()
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        return chunks

    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        api_key = getattr(settings, "OPENAI_API_KEY", "")
        if not api_key:
            return [0.0] * getattr(settings, "EMBEDDING_DIMENSION", 3072)
        try:
            import openai
            client_kwargs = {"api_key": api_key}
            base_url = getattr(settings, "AI_BASE_URL", None)
            if base_url:
                client_kwargs["base_url"] = base_url
            client = openai.OpenAI(**client_kwargs)
            resp = client.embeddings.create(
                model=getattr(settings, "EMBEDDING_MODEL", "gemini-embedding-001"),
                input=text,
                encoding_format="float"
            )
            return resp.data[0].embedding
        except Exception as exc:
            logger.exception("Embedding generation failed: %s", exc)
            return [0.0] * getattr(settings, "EMBEDDING_DIMENSION", 3072)

    @classmethod
    def chunk_and_embed_lesson(cls, lesson, re_embed: bool = False) -> int:
        from .models import DocumentChunk
        if re_embed:
            DocumentChunk.objects.filter(lesson=lesson).delete()
        chunks_text = cls.chunk_text(lesson.content)
        created = 0
        for idx, text in enumerate(chunks_text):
            emb = cls.generate_embedding(text)
            DocumentChunk.objects.create(
                lesson=lesson,
                chunk_index=idx,
                text=text,
                token_count=len(text) // CHARS_PER_TOKEN_APPROX,
                embedding=emb,
            )
            created += 1
        return created

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        mag_a = math.sqrt(sum(a ** 2 for a in vec_a))
        mag_b = math.sqrt(sum(b ** 2 for b in vec_b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    @classmethod
    def retrieve_relevant_chunks(cls, query: str, lesson_ids: List, top_k: int = None, threshold: float = None) -> List[Tuple[str, float]]:
        from .models import DocumentChunk
        top_k = top_k or getattr(settings, "RAG_TOP_K", 5)
        threshold = threshold or getattr(settings, "RAG_SIMILARITY_THRESHOLD", 0.60)
        query_embedding = cls.generate_embedding(query)
        chunks = DocumentChunk.objects.filter(lesson_id__in=lesson_ids, embedding__isnull=False).values("text", "embedding")
        scored = []
        for c in chunks:
            if c["embedding"]:
                sim = cls.cosine_similarity(query_embedding, c["embedding"])
                if sim >= threshold:
                    scored.append((c["text"], sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
