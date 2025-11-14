"""
Email Service using AWS SES
"""
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

from app.core.config import settings
from app.core.logging import app_logger


class EmailService:
    """Service for sending emails via AWS SES"""
    
    def __init__(self):
        """Initialize SES client"""
        if not settings.AWS_REGION:
            app_logger.warning("⚠️  AWS region not configured. Email sending will fail.")
            self.ses_client = None
        else:
            try:
                # Use IAM role if no access keys provided, otherwise use access keys
                if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                    self.ses_client = boto3.client(
                        'ses',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION
                    )
                else:
                    # Use IAM role (for EC2)
                    self.ses_client = boto3.client(
                        'ses',
                        region_name=settings.AWS_REGION
                    )
                app_logger.info(f"✅ SES client initialized for region: {settings.AWS_REGION}")
            except Exception as e:
                app_logger.error(f"❌ Failed to initialize SES client: {str(e)}")
                self.ses_client = None
    
    def is_configured(self) -> bool:
        """Check if SES is properly configured"""
        is_configured = self.ses_client is not None and settings.EMAILS_FROM_EMAIL is not None
        if not is_configured:
            app_logger.warning("⚠️  Email service not fully configured:")
            app_logger.warning(f"   - SES client: {'✅' if self.ses_client is not None else '❌ None'}")
            app_logger.warning(f"   - EMAILS_FROM_EMAIL: {'✅' if settings.EMAILS_FROM_EMAIL else '❌ Not set'}")
            app_logger.warning(f"   - AWS_REGION: {settings.AWS_REGION or '❌ Not set'}")
        return is_configured
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send an email via AWS SES
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
        
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self.is_configured():
            app_logger.error("❌ Email service not configured. Cannot send email.")
            app_logger.error("   Please check your AWS SES configuration and EMAILS_FROM_EMAIL setting.")
            return False
        
        try:
            # Prepare email
            from_email = settings.EMAILS_FROM_EMAIL
            from_name = settings.EMAILS_FROM_NAME or "InfoFit LMS"
            
            # Create message
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'}
                }
            }
            
            # Add text body if provided
            if text_body:
                message['Body']['Text'] = {'Data': text_body, 'Charset': 'UTF-8'}
            
            # Send email
            response = self.ses_client.send_email(
                Source=f"{from_name} <{from_email}>",
                Destination={'ToAddresses': [to_email]},
                Message=message
            )
            
            app_logger.info(f"✅ Email sent successfully to {to_email}. MessageId: {response['MessageId']}")
            return True
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            error_message = str(e)
            
            # Check for sandbox mode errors
            if 'MessageRejected' in error_code or 'Email address is not verified' in error_message:
                app_logger.error(f"❌ AWS SES Error: Email address is not verified")
                app_logger.error(f"   Recipient: {to_email}")
                app_logger.error(f"   Error: {error_message}")
                app_logger.error(f"   ⚠️  AWS SES is in SANDBOX MODE - recipient email must be verified")
                app_logger.error(f"   Solution: Verify '{to_email}' in AWS SES Console or request production access")
                app_logger.error(f"   SES Console: https://console.aws.amazon.com/ses/home?region={settings.AWS_REGION}#/verified-identities")
            else:
                app_logger.error(f"❌ AWS SES ClientError: {error_message}")
            return False
        except BotoCoreError as e:
            app_logger.error(f"❌ AWS BotoCoreError: {str(e)}")
            return False
        except Exception as e:
            app_logger.error(f"❌ Unexpected error sending email: {str(e)}")
            return False
    
    async def send_welcome_email_organization(
        self,
        email: str,
        first_name: str,
        organization_name: str,
        temp_password: str,
        login_url: str
    ) -> bool:
        """Send welcome email to organization admin with temporary credentials"""
        subject = f"Welcome to {organization_name} - Your LMS Account"
        
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
                .credentials {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
                .warning {{ background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to InfoFit LMS!</h1>
                </div>
                <div class="content">
                    <p>Hello {first_name},</p>
                    
                    <p>Your organization <strong>{organization_name}</strong> has been successfully created on our Learning Management System.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 16px;">{temp_password}</code></p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> You must change your password on your first login for security reasons.
                    </div>
                    
                    <p>Click the button below to log in to your account:</p>
                    <a href="{login_url}" class="button">Login to Your Account</a>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
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
        Welcome to InfoFit LMS!
        
        Hello {first_name},
        
        Your organization {organization_name} has been successfully created on our Learning Management System.
        
        Your Login Credentials:
        Email: {email}
        Temporary Password: {temp_password}
        
        ⚠️ Important: You must change your password on your first login for security reasons.
        
        Login URL: {login_url}
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        InfoFit LMS Team
        """
        
        return await self.send_email(email, subject, html_body, text_body)
    
    async def send_welcome_email_tutor(
        self,
        email: str,
        first_name: str,
        organization_name: str,
        temp_password: str,
        login_url: str
    ) -> bool:
        """Send welcome email to tutor with temporary credentials"""
        subject = f"Welcome to {organization_name} - Your Tutor Account"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }}
                .credentials {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
                .warning {{ background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome as a Tutor!</h1>
                </div>
                <div class="content">
                    <p>Hello {first_name},</p>
                    
                    <p>You have been added as a tutor to <strong>{organization_name}</strong> on our Learning Management System.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 16px;">{temp_password}</code></p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> You must change your password on your first login for security reasons.
                    </div>
                    
                    <p>Click the button below to log in to your account:</p>
                    <a href="{login_url}" class="button">Login to Your Account</a>
                    
                    <p>Once logged in, you can start creating courses and managing your students.</p>
                    
                    <p>If you have any questions, please contact your organization administrator.</p>
                    
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
        Welcome as a Tutor!
        
        Hello {first_name},
        
        You have been added as a tutor to {organization_name} on our Learning Management System.
        
        Your Login Credentials:
        Email: {email}
        Temporary Password: {temp_password}
        
        ⚠️ Important: You must change your password on your first login for security reasons.
        
        Login URL: {login_url}
        
        Once logged in, you can start creating courses and managing your students.
        
        If you have any questions, please contact your organization administrator.
        
        Best regards,
        InfoFit LMS Team
        """
        
        return await self.send_email(email, subject, html_body, text_body)
    
    async def send_welcome_email_student(
        self,
        email: str,
        first_name: str,
        organization_name: str,
        temp_password: str,
        login_url: str
    ) -> bool:
        """Send welcome email to student with temporary credentials"""
        subject = f"Welcome to {organization_name} - Your Student Account"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }}
                .credentials {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3B82F6; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
                .warning {{ background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome as a Student!</h1>
                </div>
                <div class="content">
                    <p>Hello {first_name},</p>
                    
                    <p>You have been enrolled as a student in <strong>{organization_name}</strong> on our Learning Management System.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 16px;">{temp_password}</code></p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> You must change your password on your first login for security reasons.
                    </div>
                    
                    <p>Click the button below to log in to your account:</p>
                    <a href="{login_url}" class="button">Login to Your Account</a>
                    
                    <p>Once logged in, you can browse courses, enroll in classes, and track your learning progress.</p>
                    
                    <p>If you have any questions, please contact your organization administrator.</p>
                    
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
        Welcome as a Student!
        
        Hello {first_name},
        
        You have been enrolled as a student in {organization_name} on our Learning Management System.
        
        Your Login Credentials:
        Email: {email}
        Temporary Password: {temp_password}
        
        ⚠️ Important: You must change your password on your first login for security reasons.
        
        Login URL: {login_url}
        
        Once logged in, you can browse courses, enroll in classes, and track your learning progress.
        
        If you have any questions, please contact your organization administrator.
        
        Best regards,
        InfoFit LMS Team
        """
        
        return await self.send_email(email, subject, html_body, text_body)


# Create singleton instance
email_service = EmailService()

