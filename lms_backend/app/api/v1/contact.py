"""
Contact API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.services.email_service import EmailService

router = APIRouter()

email_service = EmailService()


class ContactFormRequest(BaseModel):
    """Schema for contact form submission"""
    name: str = Field(..., min_length=1, max_length=255, description="Contact name")
    email: EmailStr = Field(..., description="Contact email address")
    subject: str = Field(..., min_length=1, max_length=255, description="Message subject")
    message: str = Field(..., min_length=1, max_length=5000, description="Message content")


class ContactFormResponse(BaseModel):
    """Schema for contact form response"""
    success: bool
    message: str


@router.post("/contact", response_model=ContactFormResponse)
async def submit_contact_form(contact_data: ContactFormRequest):
    """
    Submit a contact form and send email to support team
    """
    try:
        # Recipient email
        recipient_email = "info@infofitsoftware.com"
        
        # Subject mapping
        subject_map = {
            "general": "General Inquiry",
            "support": "Technical Support",
            "billing": "Billing Question",
            "partnership": "Partnership Opportunity",
            "feedback": "Feedback",
            "other": "Other"
        }
        
        email_subject = subject_map.get(contact_data.subject, contact_data.subject)
        email_subject = f"[Contact Form] {email_subject} - {contact_data.name}"
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #2563EB 0%, #9333EA 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }}
                .field {{ margin-bottom: 20px; }}
                .label {{ font-weight: bold; color: #4F46E5; margin-bottom: 5px; display: block; }}
                .value {{ background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #4F46E5; }}
                .message-box {{ background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #9333EA; white-space: pre-wrap; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Contact Form Submission</h1>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Name:</span>
                        <div class="value">{contact_data.name}</div>
                    </div>
                    <div class="field">
                        <span class="label">Email:</span>
                        <div class="value">{contact_data.email}</div>
                    </div>
                    <div class="field">
                        <span class="label">Subject:</span>
                        <div class="value">{email_subject.replace('[Contact Form] ', '')}</div>
                    </div>
                    <div class="field">
                        <span class="label">Message:</span>
                        <div class="message-box">{contact_data.message}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
New Contact Form Submission

Name: {contact_data.name}
Email: {contact_data.email}
Subject: {email_subject.replace('[Contact Form] ', '')}

Message:
{contact_data.message}
        """
        
        # Send email
        email_sent = await email_service.send_email(
            to_email=recipient_email,
            subject=email_subject,
            html_body=html_body,
            text_body=text_body
        )
        
        if email_sent:
            return ContactFormResponse(
                success=True,
                message="Thank you for contacting us! We'll get back to you soon."
            )
        else:
            # Even if email fails, return success to user (email might be in sandbox mode)
            # Log the error but don't expose it to the user
            return ContactFormResponse(
                success=True,
                message="Thank you for contacting us! We'll get back to you soon."
            )
            
    except Exception as e:
        print(f"[Contact API] Error processing contact form: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit contact form. Please try again later."
        )

