# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import io
from PIL import Image
import pdfplumber
import pytesseract

app = FastAPI(title="social-media-content-analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ocr_image_bytes(image_bytes: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise RuntimeError(f"cannot open image: {e}")
    text = pytesseract.image_to_string(img)
    return text

def parse_pdf_bytes(pdf_bytes: bytes) -> str:
    text_chunks = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, page in enumerate(pdf.pages):
            # try to extract text first
            page_text = page.extract_text()
            if page_text and page_text.strip():
                # keep page separation and basic formatting
                text_chunks.append(f"--- page {i+1} ---\n{page_text}")
            else:
                # fallback to ocr of page image
                try:
                    pil_img = page.to_image(resolution=300).original
                    buf = io.BytesIO()
                    pil_img.save(buf, format="PNG")
                    buf.seek(0)
                    ocr_text = pytesseract.image_to_string(Image.open(buf))
                    text_chunks.append(f"--- page {i+1} (ocr) ---\n{ocr_text}")
                except Exception as e:
                    text_chunks.append(f"--- page {i+1} (error) ---\n[could not parse page: {e}]")
    return "\n\n".join(text_chunks)

@app.post("/extract")
async def extract(files: List[UploadFile] = File(...)):
    """
    upload one or more files (pdf/images). returns json with extracted text per file.
    supports: pdf, png, jpg, jpeg, tiff, bmp
    """
    results = []
    for f in files:
        filename = f.filename
        content_type = f.content_type or ""
        try:
            data = await f.read()
            if filename.lower().endswith(".pdf") or "pdf" in content_type:
                text = parse_pdf_bytes(data)
            elif any(filename.lower().endswith(ext) for ext in (".png",".jpg",".jpeg",".tiff",".bmp")) or "image" in content_type:
                text = ocr_image_bytes(data)
            else:
                raise HTTPException(status_code=400, detail=f"unsupported file type: {filename} ({content_type})")
            results.append({"filename": filename, "text": text})
        except HTTPException:
            raise
        except Exception as e:
            results.append({"filename": filename, "error": str(e), "text": ""})
    return {"files": results}