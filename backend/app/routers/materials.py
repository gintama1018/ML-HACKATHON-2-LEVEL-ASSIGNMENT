import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import StudentProfile, Material
from app.schemas import MaterialResponse

router = APIRouter(tags=["Materials"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"}

@router.post("/materials/upload", response_model=MaterialResponse)
async def upload_material(
    file: UploadFile = File(...),
    student_id: str = Form(None),
    db: Session = Depends(get_db)
):
    if not student_id:
        student = db.query(StudentProfile).first()
        if not student:
            student = StudentProfile(name="Student")
            db.add(student)
            db.commit()
            db.refresh(student)
        student_id = student.id
    
    # Check extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    material_id = str(Path(file.filename).stem)
    stored_filename = f"{student_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIRECTORY, stored_filename)
    
    # Write file to disk
    file_size = 0
    with open(file_path, "wb") as buffer:
        while content := await file.read(1024 * 1024):
            file_size += len(content)
            buffer.write(content)
            
    material = Material(
        student_id=student_id,
        filename=file.filename,
        type=file_ext.replace(".", ""),
        file_size=file_size,
        status="uploaded",
        storage_ref=file_path
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

@router.get("/materials/{material_id}", response_model=MaterialResponse)
def get_material(material_id: str, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material
