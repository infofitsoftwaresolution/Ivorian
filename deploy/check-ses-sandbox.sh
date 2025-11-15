#!/bin/bash

# Script to check if AWS SES is in sandbox mode and provide instructions

echo "=========================================="
echo "🔍 AWS SES Sandbox Mode Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get AWS region
ENV_FILE="${HOME}/lms-app/.env"
AWS_REGION=$(grep "^AWS_REGION=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$AWS_REGION" ]; then
    echo -e "${RED}❌ AWS_REGION not found in .env${NC}"
    exit 1
fi

echo "📍 AWS Region: $AWS_REGION"
echo ""

# Check sending status
echo "🔍 Checking SES Account Status..."
SENDING_ENABLED=$(aws ses get-account-sending-enabled --region "$AWS_REGION" --query 'Enabled' --output text 2>/dev/null)

if [ "$SENDING_ENABLED" = "True" ]; then
    echo -e "${GREEN}✅ Account sending is ENABLED (Production Mode)${NC}"
    echo ""
    echo "   You can send emails to any email address!"
    echo ""
else
    echo -e "${YELLOW}⚠️  Account sending is DISABLED (Sandbox Mode)${NC}"
    echo ""
    echo -e "${RED}❌ SANDBOX MODE LIMITATIONS:${NC}"
    echo "   - You can only send emails to VERIFIED email addresses"
    echo "   - Both sender AND recipient must be verified"
    echo "   - Maximum 200 emails per day"
    echo "   - Maximum 1 email per second"
    echo ""
fi

# Get verified email addresses
echo "📧 Verified Email Addresses:"
echo "-----------------------------------"
VERIFIED_EMAILS=$(aws ses list-verified-email-addresses --region "$AWS_REGION" --query 'VerifiedEmailAddresses' --output text 2>/dev/null)

if [ -z "$VERIFIED_EMAILS" ] || [ "$VERIFIED_EMAILS" = "None" ]; then
    echo -e "${RED}❌ No verified email addresses found${NC}"
else
    echo "$VERIFIED_EMAILS" | tr '\t' '\n' | while read email; do
        echo -e "${GREEN}   ✅ $email${NC}"
    done
fi

echo ""
echo "=========================================="
echo "📋 Solutions:"
echo "=========================================="
echo ""

if [ "$SENDING_ENABLED" != "True" ]; then
    echo -e "${YELLOW}Option 1: Verify Recipient Emails (Quick Fix)${NC}"
    echo "   For each tutor/student email that needs to receive emails:"
    echo "   1. Go to: https://console.aws.amazon.com/ses/home?region=${AWS_REGION}#/verified-identities"
    echo "   2. Click 'Create identity'"
    echo "   3. Select 'Email address'"
    echo "   4. Enter the recipient email address"
    echo "   5. Click 'Create identity'"
    echo "   6. Check the email inbox and click the verification link"
    echo ""
    echo -e "${BLUE}Option 2: Request Production Access (Recommended)${NC}"
    echo "   This allows sending to any email address:"
    echo "   1. Go to: https://console.aws.amazon.com/ses/home?region=${AWS_REGION}#/account"
    echo "   2. Click 'Request production access'"
    echo "   3. Fill out the form:"
    echo "      - Mail Type: Transactional"
    echo "      - Website URL: Your application URL"
    echo "      - Use case: Learning Management System - sending welcome emails, notifications"
    echo "      - Expected volume: Your estimated daily email volume"
    echo "   4. Submit the request"
    echo "   5. AWS typically approves within 24 hours"
    echo ""
    echo -e "${GREEN}Option 3: Use SES Verified Domain (Best for Production)${NC}"
    echo "   Verify your entire domain instead of individual emails:"
    echo "   1. Go to: https://console.aws.amazon.com/ses/home?region=${AWS_REGION}#/verified-identities"
    echo "   2. Click 'Create identity'"
    echo "   3. Select 'Domain'"
    echo "   4. Enter your domain (e.g., infofitlabs.com)"
    echo "   5. Follow DNS verification instructions"
    echo "   6. Once verified, you can send from any email @yourdomain.com"
    echo ""
else
    echo -e "${GREEN}✅ You're in Production Mode!${NC}"
    echo "   You can send emails to any email address."
    echo "   No additional verification needed for recipients."
    echo ""
fi

echo "=========================================="
echo ""

