from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LearningReport
from app.schemas import LearningReportResponse

router = APIRouter(tags=["Reports"])

@router.get("/session/{session_id}/report", response_model=LearningReportResponse)
def get_session_report(session_id: str, db: Session = Depends(get_db)):
    report = db.query(LearningReport).filter(LearningReport.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Learning report not found. Complete assessment first.")
    return report
