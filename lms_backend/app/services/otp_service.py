"""
OTP Service for email verification
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.otp import OTP
from app.services.email_service import email_service
from app.core.logging import app_logger
from app.core.config import settings


class OTPService:
    """Service for managing OTP codes"""
    
    @staticmethod
    def generate_otp() -> str:
        """Generate a 6-digit OTP code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    @staticmethod
    async def create_otp(
        db: AsyncSession,
        email: str,
        purpose: str = "registration",
        expires_in_minutes: int = 10
    ) -> OTP:
        """Create a new OTP for email verification"""
        # Invalidate any existing OTPs for this email and purpose
        existing_otps = await db.execute(
            select(OTP).where(
                and_(
                    OTP.email == email,
                    OTP.purpose == purpose,
                    OTP.is_verified == False
                )
            )
        )
        existing_otps_list = existing_otps.scalars().all()
        for otp in existing_otps_list:
            otp.is_verified = True  # Mark as used
        
        # Generate new OTP
        code = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        otp = OTP(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=expires_at,
            is_verified=False
        )
        
        db.add(otp)
        await db.commit()
        await db.refresh(otp)
        
        return otp
    
    @staticmethod
    async def verify_otp(
        db: AsyncSession,
        email: str,
        code: str,
        purpose: str = "registration"
    ) -> bool:
        """Verify an OTP code"""
        result = await db.execute(
            select(OTP).where(
                and_(
                    OTP.email == email,
                    OTP.code == code,
                    OTP.purpose == purpose,
                    OTP.is_verified == False,
                    OTP.expires_at > datetime.utcnow()
                )
            ).order_by(OTP.created_at.desc())
        )
        otp = result.scalar_one_or_none()
        
        if not otp:
            return False
        
        # Mark OTP as verified
        otp.is_verified = True
        otp.verified_at = datetime.utcnow()
        await db.commit()
        
        return True
    
    @staticmethod
    async def send_otp_email(
        email: str,
        code: str,
        purpose: str = "registration"
    ) -> bool:
        """Send OTP code via email"""
        if purpose == "registration":
            subject = "Verify Your Email - Registration OTP"
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }}
                    .otp-box {{ background-color: white; padding: 30px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px dashed #4F46E5; }}
                    .otp-code {{ font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: monospace; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
                    .warning {{ background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for registering with InfoFit LMS. Please use the following OTP code to complete your registration:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your verification code:</p>
                            <div class="otp-code">{code}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This code will expire in 10 minutes. Do not share this code with anyone.
                        </div>
                        
                        <p>If you didn't request this code, please ignore this email.</p>
                        
                        <p>Best regards,<br>InfoFit LMS Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_body = f"""
            Verify Your Email - Registration OTP
            
            Hello,
            
            Thank you for registering with InfoFit LMS. Please use the following OTP code to complete your registration:
            
            Your verification code: {code}
            
            ⚠️ Important: This code will expire in 10 minutes. Do not share this code with anyone.
            
            If you didn't request this code, please ignore this email.
            
            Best regards,
            InfoFit LMS Team
            """
        else:
            subject = f"Your Verification Code - {purpose}"
            html_body = f"<p>Your verification code is: <strong>{code}</strong></p><p>This code will expire in 10 minutes.</p>"
            text_body = f"Your verification code is: {code}. This code will expire in 10 minutes."
        
        return await email_service.send_email(email, subject, html_body, text_body)

