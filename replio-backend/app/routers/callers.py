from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from app.core.database import get_session
from app.models.caller import Caller
from app.schemas.caller import CallerCreate, CallerRead, CallerUpdate
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.caller_service import CallerService
from app.models.conversation import Conversation

router = APIRouter(prefix="/callers", tags=["callers"])

@router.get("", response_model=List[CallerRead])
async def list_callers(
    company_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Caller)
    if company_id:
        stmt = stmt.where(Caller.company_id == company_id)
    if search:
        stmt = stmt.where(
            (Caller.name.ilike(f"%{search}%")) | (Caller.phone_number.ilike(f"%{search}%"))
        )
    stmt = stmt.offset(offset).limit(limit)
    return session.exec(stmt).all()

@router.post("", response_model=CallerRead)
async def create_caller(data: CallerCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    caller = Caller(**data.dict())
    session.add(caller)
    session.commit()
    session.refresh(caller)
    return caller

@router.get("/{caller_id}", response_model=CallerRead)
async def get_caller(caller_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")
    return caller

@router.patch("/{caller_id}", response_model=CallerRead)
async def update_caller(caller_id: str, data: CallerUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(caller, k, v)
    session.add(caller)
    session.commit()
    session.refresh(caller)
    return caller

@router.delete("/{caller_id}")
async def delete_caller(caller_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")
    session.delete(caller)
    session.commit()
    return {"success": True, "message": "Caller deleted"}

@router.get("/{caller_id}/history", response_model=List[Dict[str, Any]])
async def get_caller_history(
    caller_id: str,
    limit: int = Query(20, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")

    history = CallerService.get_caller_history(session, caller_id, limit)
    return [
        {
            "id": conv.id,
            "timestamp": conv.created_at,
            "duration": conv.duration_seconds,
            "status": conv.status,
            "summary": conv.summary,
            "sentiment_score": conv.sentiment_score,
        }
        for conv in history
    ]

@router.get("/{caller_id}/statistics", response_model=Dict[str, Any])
async def get_caller_statistics(
    caller_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")

    stats = CallerService.get_caller_stats(session, caller_id)
    return stats

@router.post("/{caller_id}/block")
async def block_caller(
    caller_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    caller = session.get(Caller, caller_id)
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")

    CallerService.block_caller(session, caller_id)
    return {"success": True, "message": f"Caller {caller_id} has been blocked"}
