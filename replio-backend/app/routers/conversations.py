from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import get_session
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationCreate, ConversationRead
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.conversation_service import ConversationService

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

@router.put("/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: str,
    summary: Optional[str] = None,
    sentiment_score: Optional[float] = None,
    outcome: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conv = ConversationService.update_conversation(
        session, conversation_id,
        summary=summary,
        sentiment_score=sentiment_score,
        outcome=outcome
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    session.delete(conv)
    session.commit()
    return {"success": True}

@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = Query(100, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    messages = ConversationService.get_messages(session, conversation_id, limit)
    return [{"id": m.id, "role": m.role, "content": m.content, "timestamp": m.created_at} for m in messages]

@router.post("/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    role: str,
    content: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    msg = ConversationService.add_message(session, conversation_id, role, content)
    return {"id": msg.id, "role": msg.role, "content": msg.content}
