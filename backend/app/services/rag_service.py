import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
from app.config import settings

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.persist_dir = settings.CHROMA_PERSIST_DIRECTORY
        os.makedirs(self.persist_dir, exist_ok=True)
        
        # Initialize persistent Chroma client
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        
        # Fast, robust default embedding function (ONNX-based all-MiniLM-L6-v2)
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()

    def get_or_create_collection(self, material_id: str):
        collection_name = f"mat_{material_id.replace('-', '_')}"
        return self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )

    def extract_text_from_file(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Extracts structured text with page/slide/section metadata"""
        chunks_raw = []
        file_ext = file_type.lower().replace(".", "")

        if file_ext == "pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                for idx, page in enumerate(reader.pages, 1):
                    text = page.extract_text() or ""
                    if text.strip():
                        chunks_raw.append({
                            "text": text.strip(),
                            "page_number": idx,
                            "section_ref": f"Page {idx}"
                        })
            except Exception as e:
                logger.error(f"Error reading PDF {file_path}: {e}")
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    chunks_raw.append({"text": f.read(), "page_number": 1, "section_ref": "Document"})

        elif file_ext in ["doc", "docx"]:
            try:
                import docx
                doc = docx.Document(file_path)
                current_heading = "Overview"
                current_text = []
                
                for para in doc.paragraphs:
                    if para.style.name.startswith("Heading"):
                        if current_text:
                            chunks_raw.append({
                                "text": "\n".join(current_text),
                                "page_number": 1,
                                "section_ref": current_heading
                            })
                            current_text = []
                        current_heading = para.text or "Section"
                    else:
                        if para.text.strip():
                            current_text.append(para.text.strip())
                            
                if current_text:
                    chunks_raw.append({
                        "text": "\n".join(current_text),
                        "page_number": 1,
                        "section_ref": current_heading
                    })
            except Exception as e:
                logger.error(f"Error reading DOCX {file_path}: {e}")
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    chunks_raw.append({"text": f.read(), "page_number": 1, "section_ref": "Document"})

        elif file_ext in ["ppt", "pptx"]:
            try:
                from pptx import Presentation
                prs = Presentation(file_path)
                for idx, slide in enumerate(prs.slides, 1):
                    slide_text = []
                    slide_title = f"Slide {idx}"
                    for shape in slide.shapes:
                        if hasattr(shape, "text") and shape.text.strip():
                            if shape == slide.shapes[0] and len(shape.text) < 100:
                                slide_title = shape.text.strip()
                            else:
                                slide_text.append(shape.text.strip())
                    if slide_text:
                        chunks_raw.append({
                            "text": "\n".join(slide_text),
                            "page_number": idx,
                            "section_ref": slide_title
                        })
            except Exception as e:
                logger.error(f"Error reading PPTX {file_path}: {e}")
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    chunks_raw.append({"text": f.read(), "page_number": 1, "section_ref": "Presentation"})

        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                sections = re.split(r'\n(?=#{1,3}\s)', content)
                for idx, sec in enumerate(sections, 1):
                    if sec.strip():
                        first_line = sec.strip().split("\n")[0]
                        section_name = first_line.replace("#", "").strip() if first_line.startswith("#") else f"Section {idx}"
                        chunks_raw.append({
                            "text": sec.strip(),
                            "page_number": 1,
                            "section_ref": section_name
                        })

        return chunks_raw

    def chunk_semantic(
        self,
        raw_sections: List[Dict[str, Any]],
        chunk_size: int = 1500,
        chunk_overlap: int = 200
    ) -> List[Dict[str, Any]]:
        """Splits raw sections into overlapping semantic chunks for vector search"""
        processed_chunks = []
        chunk_idx = 0

        for sec in raw_sections:
            text = sec["text"]
            page = sec.get("page_number", 1)
            section = sec.get("section_ref", "Document")

            if len(text) <= chunk_size:
                processed_chunks.append({
                    "chunk_index": chunk_idx,
                    "text": text,
                    "page_number": page,
                    "section_ref": section
                })
                chunk_idx += 1
            else:
                start = 0
                while start < len(text):
                    end = min(start + chunk_size, len(text))
                    chunk_str = text[start:end]
                    processed_chunks.append({
                        "chunk_index": chunk_idx,
                        "text": chunk_str,
                        "page_number": page,
                        "section_ref": section
                    })
                    chunk_idx += 1
                    if end >= len(text):
                        break
                    start += (chunk_size - chunk_overlap)

        return processed_chunks

    def index_material(self, material_id: str, file_path: str, file_type: str) -> Dict[str, Any]:
        """Full pipeline: Extract -> Chunk -> Embed -> Persistent Chroma Index"""
        raw_sections = self.extract_text_from_file(file_path, file_type)
        if not raw_sections:
            raise ValueError(f"Could not extract any readable text from {file_path}")

        chunks = self.chunk_semantic(raw_sections)
        collection = self.get_or_create_collection(material_id)

        ids = [f"{material_id}_chunk_{c['chunk_index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "chunk_index": c["chunk_index"],
                "page_number": c["page_number"],
                "section_ref": c["section_ref"]
            }
            for c in chunks
        ]

        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

        full_text = "\n\n".join([c["text"] for c in chunks])
        return {
            "total_chunks": len(chunks),
            "chunks": chunks,
            "full_text": full_text
        }

    def retrieve_relevant_chunks(
        self,
        material_id: str,
        query: str,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Retrieves top-k relevant chunks from Chroma with distance scoring"""
        try:
            collection = self.get_or_create_collection(material_id)
            results = collection.query(
                query_texts=[query],
                n_results=top_k
            )

            retrieved = []
            if results and results.get("documents") and results["documents"][0]:
                for doc, meta, distance in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results.get("distances", [[0]*len(results["documents"][0])])[0]
                ):
                    retrieved.append({
                        "text": doc,
                        "section_ref": meta.get("section_ref", "Section"),
                        "page_number": meta.get("page_number", 1),
                        "chunk_index": meta.get("chunk_index", 0),
                        "relevance_score": round(1.0 - float(distance), 3) if distance is not None else 1.0
                    })
            return retrieved
        except Exception as e:
            logger.error(f"Error retrieving from Chroma collection for {material_id}: {e}")
            return []

rag_service = RAGService()
