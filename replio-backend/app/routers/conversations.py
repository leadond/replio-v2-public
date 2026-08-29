from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.core.database import get_session
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationRead
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("", response_model=List[ConversationRead])
async def list_conversations(
    company_id: Optional[str] = None,
    caller_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Conversation)
    if company_id:
        stmt = stmt.where(Conversation.company_id == company_id)
    if caller_id:
        stmt = stmt.where(Conversation.caller_id == caller_id)
    if status:
        stmt = stmt.where(Conversation.status == status)
    stmt = stmt.order_by(Conversation.created_at.desc()).offset(offset).limit(limit)
    return session.exec(stmt).all()

@router.post("", response_model=ConversationRead)
async def create_conversation(data: ConversationCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    conv = Conversation(**data.dict())
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv

@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(conversation_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv
