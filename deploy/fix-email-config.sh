#!/bin/bash

# Script to fix email configuration
# This will check verified emails in SES and update .env files accordingly

echo "=========================================="
echo "🔧 Fixing Email Configuration"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Get verified email addresses from SES
echo "🔍 Checking verified email addresses in SES..."
VERIFIED_EMAILS=$(aws ses list-verified-email-addresses --region "$AWS_REGION" --query 'VerifiedEmailAddresses' --output text 2>/dev/null)

if [ -z "$VERIFIED_EMAILS" ] || [ "$VERIFIED_EMAILS" = "None" ]; then
    echo -e "${RED}❌ No verified email addresses found in SES${NC}"
    echo ""
    echo "You need to verify an email address in AWS SES:"
    echo "1. Go to: https://console.aws.amazon.com/ses/home?region=${AWS_REGION}#/verified-identities"
    echo "2. Click 'Create identity'"
    echo "3. Select 'Email address'"
    echo "4. Enter your email (e.g., infofitsoftware@gmail.com)"
    echo "5. Click 'Create identity'"
    echo "6. Check your email and click the verification link"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Found verified email addresses:${NC}"
echo "$VERIFIED_EMAILS" | tr '\t' '\n' | while read email; do
    echo "   - $email"
done

# Get the first verified email
VERIFIED_EMAIL=$(echo "$VERIFIED_EMAILS" | tr '\t' '\n' | head -1)

echo ""
echo "📧 Using verified email: $VERIFIED_EMAIL"
echo ""

# Update root .env file
ROOT_ENV="${HOME}/lms-app/.env"
if [ -f "$ROOT_ENV" ]; then
    echo "📝 Updating root .env file..."
    if grep -q "^EMAILS_FROM_EMAIL=" "$ROOT_ENV"; then
        sed -i "s|^EMAILS_FROM_EMAIL=.*|EMAILS_FROM_EMAIL=\"$VERIFIED_EMAIL\"|" "$ROOT_ENV"
        echo -e "${GREEN}✅ Updated EMAILS_FROM_EMAIL in root .env${NC}"
    else
        echo "EMAILS_FROM_EMAIL=\"$VERIFIED_EMAIL\"" >> "$ROOT_ENV"
        echo -e "${GREEN}✅ Added EMAILS_FROM_EMAIL to root .env${NC}"
    fi
fi

# Update backend .env file
BACKEND_ENV="${HOME}/lms-app/lms_backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    echo "📝 Updating backend .env file..."
    if grep -q "^EMAILS_FROM_EMAIL=" "$BACKEND_ENV"; then
        sed -i "s|^EMAILS_FROM_EMAIL=.*|EMAILS_FROM_EMAIL=\"$VERIFIED_EMAIL\"|" "$BACKEND_ENV"
        echo -e "${GREEN}✅ Updated EMAILS_FROM_EMAIL in backend .env${NC}"
    else
        echo "EMAILS_FROM_EMAIL=\"$VERIFIED_EMAIL\"" >> "$BACKEND_ENV"
        echo -e "${GREEN}✅ Added EMAILS_FROM_EMAIL to backend .env${NC}"
    fi
fi

echo ""
echo "🔄 Restarting backend service to apply changes..."
sudo systemctl restart lms-backend
sleep 3

if systemctl is-active --quiet lms-backend; then
    echo -e "${GREEN}✅ Backend service restarted successfully${NC}"
else
    echo -e "${RED}❌ Backend service failed to start. Check logs:${NC}"
    echo "   sudo journalctl -u lms-backend -n 50 --no-pager"
fi

echo ""
echo "=========================================="
echo "✅ Email configuration updated!"
echo "=========================================="
echo ""
echo "Current configuration:"
echo "   EMAILS_FROM_EMAIL: $VERIFIED_EMAIL"
echo "   AWS_REGION: $AWS_REGION"
echo ""
echo "Test by creating a new organization and check logs:"
echo "   sudo journalctl -u lms-backend -f | grep -i email"
echo ""

