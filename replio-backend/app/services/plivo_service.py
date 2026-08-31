"""
Plivo integration service for Replio.
Handles inbound/outbound calls, IVR routing, transcription.
"""
import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from plivo import RestClient

logger = logging.getLogger(__name__)


class PlivoService:
    """Plivo telephony service for voice calls and IVR."""

    def __init__(self, auth_id: str, auth_token: str, default_phone: str):
        self.auth_id = auth_id
        self.auth_token = auth_token
        self.default_phone = default_phone
        self.client = RestClient(auth_id, auth_token)
        self.timeout = 30.0

    async def make_outbound_call(
        self,
        to_number: str,
        from_number: str = None,
        answer_url: str = None,
        answer_method: str = "POST",
        hangup_url: str = None,
        hangup_method: str = "POST",
    ) -> Dict[str, Any]:
        """
        Initiate outbound call via Plivo.

        Args:
            to_number: Destination phone number
            from_number: Caller ID (defaults to company number)
            answer_url: Webhook URL when call is answered
            answer_method: HTTP method for answer_url
            hangup_url: Webhook URL when call ends
            hangup_method: HTTP method for hangup_url

        Returns:
            Call details with request_uuid
        """
        try:
            from_number = from_number or self.default_phone

            response = self.client.calls.create(
                to_number=to_number,
                from_number=from_number,
                answer_url=answer_url,
                answer_method=answer_method,
                hangup_url=hangup_url,
                hangup_method=hangup_method,
                record=True,  # Always record for compliance/training
            )

            logger.info(
                f"Outbound call initiated: {to_number} from {from_number} "
                f"(request_uuid: {response.request_uuid})"
            )

            return {
                "success": True,
                "request_uuid": response.request_uuid,
                "message": response.message,
                "api_id": response.api_id,
            }
        except Exception as e:
            logger.error(f"Failed to initiate outbound call: {e}")
            raise

    async def handle_inbound_call(
        self,
        call_uuid: str,
        from_number: str,
        to_number: str,
        ivr_endpoint: str,
    ) -> Dict[str, str]:
        """
        Generate XML response for inbound call routing.
        Routes to IVR/AI agent based on company.

        Returns:
            Plivo XML response for call handling
        """
        try:
            logger.info(
                f"Inbound call received: {from_number} -> {to_number} "
                f"(uuid: {call_uuid})"
            )

            # Plivo XML for answering call and routing to IVR
            response_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Welcome to our AI assistant. Routing your call now.</Speak>
  <Redirect>{ivr_endpoint}?call_uuid={call_uuid}&from={from_number}&to={to_number}</Redirect>
</Response>
"""
            return {
                "success": True,
                "xml": response_xml,
                "call_uuid": call_uuid,
            }
        except Exception as e:
            logger.error(f"Failed to handle inbound call: {e}")
            raise

    async def get_call_details(self, call_uuid: str) -> Dict[str, Any]:
        """Get live call details from Plivo."""
        try:
            response = self.client.calls.get(call_uuid)
            return {
                "success": True,
                "call_uuid": response.call_uuid,
                "from_number": response.from_number,
                "to_number": response.to_number,
                "status": response.call_status,
                "duration": response.duration,
                "start_time": response.start_time,
            }
        except Exception as e:
            logger.error(f"Failed to get call details for {call_uuid}: {e}")
            raise

    async def hangup_call(self, call_uuid: str) -> Dict[str, bool]:
        """Terminate an active call."""
        try:
            self.client.calls.hangup(call_uuid)
            logger.info(f"Call hung up: {call_uuid}")
            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to hangup call {call_uuid}: {e}")
            raise

    async def transfer_call(
        self,
        call_uuid: str,
        transfer_url: str,
        transfer_method: str = "POST",
    ) -> Dict[str, bool]:
        """Transfer call to another endpoint."""
        try:
            self.client.calls.transfer(
                call_uuid,
                aleg_url=transfer_url,
                aleg_method=transfer_method,
            )
            logger.info(f"Call transferred: {call_uuid}")
            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to transfer call {call_uuid}: {e}")
            raise

    async def record_call(
        self,
        call_uuid: str,
        record_audio: str = "true",
    ) -> Dict[str, Any]:
        """Start recording a call."""
        try:
            response = self.client.calls.record(
                call_uuid,
                record_audio=record_audio,
            )
            logger.info(f"Recording started: {call_uuid}")
            return {
                "success": True,
                "recording_id": response.recording_id if hasattr(response, 'recording_id') else None,
            }
        except Exception as e:
            logger.error(f"Failed to record call {call_uuid}: {e}")
            raise

    async def stop_recording(self, call_uuid: str) -> Dict[str, bool]:
        """Stop recording a call."""
        try:
            self.client.calls.stop_recording(call_uuid)
            logger.info(f"Recording stopped: {call_uuid}")
            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to stop recording for {call_uuid}: {e}")
            raise

    async def get_recordings(
        self,
        call_uuid: str,
    ) -> Dict[str, Any]:
        """Get recording details for a call."""
        try:
            recordings = self.client.recordings.list(call_uuid=call_uuid)
            return {
                "success": True,
                "recordings": [
                    {
                        "recording_id": r.recording_id,
                        "call_uuid": r.call_uuid,
                        "duration": r.duration,
                        "url": r.recording_url,
                    }
                    for r in recordings
                ],
            }
        except Exception as e:
            logger.error(f"Failed to get recordings for {call_uuid}: {e}")
            raise

    async def send_sms(
        self,
        to_number: str,
        message: str,
        from_number: str = None,
    ) -> Dict[str, Any]:
        """Send SMS message via Plivo."""
        try:
            from_number = from_number or self.default_phone
            response = self.client.messages.create(
                src=from_number,
                dst=to_number,
                text=message,
            )
            logger.info(f"SMS sent to {to_number}")
            return {
                "success": True,
                "message_uuid": response.message_uuid,
                "api_id": response.api_id,
            }
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_number}: {e}")
            raise

    async def ivr_speak(
        self,
        text: str,
        language: str = "en-US",
        voice: str = "WOMAN",
    ) -> str:
        """Generate Plivo XML for text-to-speech in IVR."""
        return f"""<Speak voice="{voice}" language="{language}">{text}</Speak>"""

    async def ivr_get_digits(
        self,
        num_digits: int,
        timeout: int = 10,
        action_url: str = None,
    ) -> str:
        """Generate Plivo XML to collect DTMF digits."""
        return f"""<GetDigits numDigits="{num_digits}" timeout="{timeout}" actionURL="{action_url}" />"""

    async def health_check(self) -> Dict[str, bool]:
        """Verify Plivo credentials are valid."""
        try:
            # Simple API call to verify auth
            self.client.accounts.get()
            logger.info("✓ Plivo service health check passed")
            return {"healthy": True, "service": "plivo"}
        except Exception as e:
            logger.error(f"Plivo health check failed: {e}")
            return {"healthy": False, "service": "plivo", "error": str(e)}
