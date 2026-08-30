"""OLLAMA LLM integration endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Dict, Any, Optional
from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.ollama_service import OllamaService
from app.services.conversation_service import ConversationService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ollama", tags=["ollama"])


@router.get("/status")
async def ollama_status(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Check OLLAMA service status and available models."""
    return await OllamaService.check_health()


@router.post("/chat")
async def chat(
    prompt: str = Query(...),
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Send a prompt to OLLAMA and get a response."""
    try:
        result = await OllamaService.generate(
            prompt=prompt,
            model=model,
            system=system_prompt,
        )
        return result
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(
    text: str = Query(...),
    max_length: int = Query(150, ge=50, le=500),
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Summarize text using OLLAMA."""
    try:
        result = await OllamaService.summarize(
            text=text,
            max_length=max_length,
            model=model,
        )
        return result
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment")
async def analyze_sentiment(
    text: str = Query(...),
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Analyze sentiment of text."""
    try:
        result = await OllamaService.analyze_sentiment(
            text=text,
            model=model,
        )
        return result
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intent")
async def detect_intent(
    text: str = Query(...),
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Detect customer intent from text."""
    try:
        result = await OllamaService.detect_intent(
            text=text,
            model=model,
        )
        return result
    except Exception as e:
        logger.error(f"Intent detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer")
async def answer_question(
    question: str = Query(...),
    context: Optional[str] = None,
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Answer a question with optional context."""
    try:
        result = await OllamaService.answer_question(
            question=question,
            context=context,
            model=model,
        )
        return result
    except Exception as e:
        logger.error(f"Answer question error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/entities")
async def extract_entities(
    text: str = Query(...),
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Extract named entities from text."""
    try:
        result = await OllamaService.extract_entities(
            text=text,
            model=model,
        )
        return result
    except Exception as e:
        logger.error(f"Entity extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversation/{conversation_id}/summarize")
async def summarize_conversation(
    conversation_id: str,
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Summarize a conversation using OLLAMA and store the result."""
    try:
        conv = ConversationService.get_conversation(session, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages from conversation
        messages = ConversationService.get_messages(session, conversation_id, limit=100)
        if not messages:
            return {
                "success": False,
                "error": "No messages in conversation",
            }

        # Build conversation text
        conversation_text = "\n".join(
            [f"{msg.role}: {msg.content}" for msg in messages]
        )

        # Summarize
        result = await OllamaService.summarize(
            text=conversation_text,
            max_length=300,
            model=model,
        )

        if result.get("success"):
            # Store summary in conversation
            ConversationService.update_conversation(
                session,
                conversation_id,
                summary=result.get("summary"),
            )

            return {
                "success": True,
                "conversation_id": conversation_id,
                "summary": result.get("summary"),
                "model": result.get("model"),
            }
        else:
            return result

    except Exception as e:
        logger.error(f"Conversation summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversation/{conversation_id}/analyze")
async def analyze_conversation(
    conversation_id: str,
    model: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Analyze conversation sentiment and intent."""
    try:
        conv = ConversationService.get_conversation(session, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages
        messages = ConversationService.get_messages(session, conversation_id, limit=100)
        if not messages:
            return {
                "success": False,
                "error": "No messages in conversation",
            }

        # Build conversation text (focus on user messages)
        user_messages = [msg.content for msg in messages if msg.role == "user"]
        conversation_text = " ".join(user_messages)

        # Analyze sentiment
        sentiment = await OllamaService.analyze_sentiment(
            text=conversation_text,
            model=model,
        )

        # Detect intent
        intent = await OllamaService.detect_intent(
            text=conversation_text,
            model=model,
        )

        # Update conversation with sentiment score
        if sentiment.get("success"):
            ConversationService.update_conversation(
                session,
                conversation_id,
                sentiment_score=sentiment.get("score"),
            )

        return {
            "success": True,
            "conversation_id": conversation_id,
            "sentiment": sentiment,
            "intent": intent,
            "model": model or OllamaService.DEFAULT_MODEL,
        }

    except Exception as e:
        logger.error(f"Conversation analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
