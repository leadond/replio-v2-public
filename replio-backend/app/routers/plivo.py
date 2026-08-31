"""
Plivo telephony endpoints for Replio.
Handles inbound/outbound calls, IVR, call routing.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from typing import Optional
import logging
from urllib.parse import urlencode

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User
from app.models.conversation import Conversation
from app.auth import get_current_user
from app.services.plivo_service import PlivoService
from app.services.local_ai_service import LocalAIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plivo", tags=["plivo"])

# Initialize Plivo service
plivo: Optional[PlivoService] = None
local_ai: Optional[LocalAIService] = None

if settings.PLIVO_ENABLED:
    plivo = PlivoService(
        auth_id=settings.PLIVO_AUTH_ID,
        auth_token=settings.PLIVO_AUTH_TOKEN,
        default_phone=settings.PLIVO_DEFAULT_PHONE,
    )
    logger.info("✓ Plivo service initialized")

    # Also initialize local AI if enabled
    if settings.LOCAL_AI_ENABLED:
        local_ai = LocalAIService(
            openclaw_url=settings.OPENCLAW_URL,
            llama_cpp_url=settings.LLAMA_CPP_URL,
            api_key=settings.LOCAL_AI_API_KEY,
        )
        logger.info("✓ Local AI service initialized for Plivo IVR")
else:
    logger.info("⊘ Plivo service disabled. Set PLIVO_ENABLED=true to enable.")


@router.get("/health")
async def health_check():
    """Check Plivo service health."""
    if not plivo:
        return {"status": "disabled"}

    health = await plivo.health_check()
    return health


@router.post("/answer")
async def answer_inbound_call(
    request: Request,
    call_uuid: str = Query(...),
    from_number: str = Query(...),
    to_number: str = Query(...),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    Webhook endpoint for inbound call answer.
    Returns Plivo XML to route call through AI IVR.
    """
    if not plivo:
        raise HTTPException(status_code=503, detail="Plivo not configured")

    try:
        logger.info(f"Inbound call answered: {from_number} -> {to_number} ({call_uuid})")

        # Get company context
        # (Assuming conversation will be created by phone)

        # Generate IVR response
        ivr_xml = await plivo.handle_inbound_call(
            call_uuid=call_uuid,
            from_number=from_number,
            to_number=to_number,
            ivr_endpoint=f"{settings.APP_URL}/plivo/ivr",
        )

        return {"xml": ivr_xml["xml"]}
    except Exception as e:
        logger.error(f"Failed to answer call {call_uuid}: {e}")
        raise HTTPException(status_code=500, detail="Call routing failed")


@router.post("/ivr")
async def ivr_handler(
    request: Request,
    call_uuid: str = Query(...),
    from_number: str = Query(...),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    IVR endpoint for call routing via AI.
    Uses local AI to understand caller intent and route appropriately.
    """
    if not plivo or not local_ai:
        raise HTTPException(status_code=503, detail="Plivo or AI not configured")

    try:
        logger.info(f"IVR routing call {call_uuid} for company {company_id}")

        # Use AI to generate IVR prompt
        prompt = """Generate a friendly IVR greeting for a customer service call.
Include options: 1) Schedule appointment, 2) Technical support, 3) Billing, 0) Operator.
Make it concise and professional."""

        greeting = await local_ai.generate_response(prompt)

        # Generate Plivo XML with IVR options
        ivr_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>{greeting}</Speak>
  <GetDigits numDigits="1" timeout="10" actionURL="{settings.APP_URL}/plivo/ivr-action?call_uuid={call_uuid}&company_id={company_id}" />
  <Speak>Sorry, I didn't understand that. Transferring to an agent.</Speak>
  <Redirect>{settings.APP_URL}/plivo/transfer-to-agent?call_uuid={call_uuid}&company_id={company_id}</Redirect>
</Response>
"""

        return {"xml": ivr_xml}
    except Exception as e:
        logger.error(f"IVR handler failed for {call_uuid}: {e}")
        raise HTTPException(status_code=500, detail="IVR processing failed")


@router.post("/ivr-action")
async def ivr_action(
    request: Request,
    call_uuid: str = Query(...),
    company_id: str = Query(...),
    digits: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    Process IVR digit input and route accordingly.
    """
    if not plivo or not local_ai:
        raise HTTPException(status_code=503, detail="Plivo or AI not configured")

    try:
        logger.info(f"IVR action for call {call_uuid}: digit {digits}")

        # Route based on digit selection
        routing_map = {
            "1": "appointment_scheduling",
            "2": "technical_support",
            "3": "billing",
            "0": "transfer_to_agent",
        }

        route = routing_map.get(digits, "transfer_to_agent")

        if route == "appointment_scheduling":
            prompt = "Collect appointment details from caller"
        elif route == "technical_support":
            prompt = "Gather technical issue description"
        elif route == "billing":
            prompt = "Handle billing inquiry"
        else:
            return await transfer_to_agent(call_uuid, company_id)

        # Generate AI response based on route
        response = await local_ai.generate_response(prompt)

        response_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>{response}</Speak>
</Response>
"""

        return {"xml": response_xml}
    except Exception as e:
        logger.error(f"IVR action failed for {call_uuid}: {e}")
        raise HTTPException(status_code=500, detail="IVR action failed")


async def transfer_to_agent(call_uuid: str, company_id: str):
    """Transfer call to available agent."""
    if not plivo:
        raise HTTPException(status_code=503, detail="Plivo not configured")

    try:
        # In production, query available agents from database
        agent_number = "+1234567890"  # Placeholder

        await plivo.transfer_call(
            call_uuid=call_uuid,
            transfer_url=f"{settings.APP_URL}/plivo/answer?to={agent_number}",
        )

        transfer_xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Transferring you to an available agent. Thank you for your patience.</Speak>
</Response>
"""

        return {"xml": transfer_xml}
    except Exception as e:
        logger.error(f"Transfer failed for {call_uuid}: {e}")
        raise HTTPException(status_code=500, detail="Transfer failed")


@router.post("/transfer-to-agent")
async def transfer_to_agent_endpoint(
    call_uuid: str = Query(...),
    company_id: str = Query(...),
):
    """Endpoint for transferring to agent."""
    return await transfer_to_agent(call_uuid, company_id)


@router.post("/hangup")
async def hangup_webhook(
    request: Request,
    call_uuid: str = Query(...),
    from_number: str = Query(...),
    to_number: str = Query(...),
    duration: int = Query(0),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
):
    """
    Webhook for call hangup.
    Saves call record and metadata.
    """
    try:
        logger.info(
            f"Call ended: {from_number} -> {to_number} ({call_uuid}) "
            f"Duration: {duration}s Company: {company_id}"
        )

        # Get recordings if available
        recordings_data = await plivo.get_recordings(call_uuid)

        # TODO: Save call record to database
        # - conversation summary
        # - call duration
        # - recording URL
        # - AI analysis results

        return {
            "success": True,
            "call_uuid": call_uuid,
            "duration": duration,
            "recordings": recordings_data.get("recordings", []),
        }
    except Exception as e:
        logger.error(f"Hangup webhook failed for {call_uuid}: {e}")
        # Don't fail - Plivo just needs 200 response
        return {"success": False, "error": str(e)}


@router.post("/initiate-call")
async def initiate_outbound_call(
    to_number: str = Query(...),
    from_number: Optional[str] = Query(None),
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate outbound call from Replio.
    """
    if not plivo:
        raise HTTPException(status_code=503, detail="Plivo not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        result = await plivo.make_outbound_call(
            to_number=to_number,
            from_number=from_number or settings.PLIVO_DEFAULT_PHONE,
            answer_url=f"{settings.APP_URL}/plivo/answer",
            hangup_url=f"{settings.APP_URL}/plivo/hangup",
        )

        logger.info(f"Outbound call initiated: {to_number} (request_uuid: {result['request_uuid']})")

        return result
    except Exception as e:
        logger.error(f"Failed to initiate call to {to_number}: {e}")
        raise HTTPException(status_code=500, detail="Call initiation failed")


@router.get("/call-details/{call_uuid}")
async def get_call_details(
    call_uuid: str,
    company_id: str = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get details about an active or recent call."""
    if not plivo:
        raise HTTPException(status_code=503, detail="Plivo not configured")

    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    try:
        details = await plivo.get_call_details(call_uuid)
        return details
    except Exception as e:
        logger.error(f"Failed to get call details for {call_uuid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve call details")
