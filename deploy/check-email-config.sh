#!/bin/bash

# Script to check email configuration for LMS
# Run this on the EC2 instance to verify email setup

echo "=========================================="
echo "📧 Email Configuration Check"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
ENV_FILE="${HOME}/lms-app/.env"
if [ -f "$ENV_FILE" ]; then
    echo "✅ Found .env file: $ENV_FILE"
    echo ""
    
    # Check AWS configuration
    echo "🔍 Checking AWS Configuration:"
    echo "-----------------------------------"
    
    AWS_REGION=$(grep "^AWS_REGION=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    AWS_ACCESS_KEY=$(grep "^AWS_ACCESS_KEY_ID=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    AWS_SECRET_KEY=$(grep "^AWS_SECRET_ACCESS_KEY=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$AWS_REGION" ]; then
        echo -e "${GREEN}✅ AWS_REGION: $AWS_REGION${NC}"
    else
        echo -e "${RED}❌ AWS_REGION: Not set${NC}"
    fi
    
    if [ -n "$AWS_ACCESS_KEY" ]; then
        echo -e "${GREEN}✅ AWS_ACCESS_KEY_ID: Set (hidden)${NC}"
    else
        echo -e "${YELLOW}⚠️  AWS_ACCESS_KEY_ID: Not set (will use IAM role if on EC2)${NC}"
    fi
    
    if [ -n "$AWS_SECRET_KEY" ]; then
        echo -e "${GREEN}✅ AWS_SECRET_ACCESS_KEY: Set (hidden)${NC}"
    else
        echo -e "${YELLOW}⚠️  AWS_SECRET_ACCESS_KEY: Not set (will use IAM role if on EC2)${NC}"
    fi
    
    echo ""
    echo "🔍 Checking Email Configuration:"
    echo "-----------------------------------"
    
    EMAILS_FROM_EMAIL=$(grep "^EMAILS_FROM_EMAIL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    EMAILS_FROM_NAME=$(grep "^EMAILS_FROM_NAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$EMAILS_FROM_EMAIL" ]; then
        echo -e "${GREEN}✅ EMAILS_FROM_EMAIL: $EMAILS_FROM_EMAIL${NC}"
    else
        echo -e "${RED}❌ EMAILS_FROM_EMAIL: Not set${NC}"
    fi
    
    if [ -n "$EMAILS_FROM_NAME" ]; then
        echo -e "${GREEN}✅ EMAILS_FROM_NAME: $EMAILS_FROM_NAME${NC}"
    else
        echo -e "${YELLOW}⚠️  EMAILS_FROM_NAME: Not set (will use default: InfoFit LMS)${NC}"
    fi
    
    echo ""
    echo "🔍 Checking Backend .env file:"
    echo "-----------------------------------"
    BACKEND_ENV_FILE="${HOME}/lms-app/lms_backend/.env"
    if [ -f "$BACKEND_ENV_FILE" ]; then
        echo -e "${GREEN}✅ Found backend .env file${NC}"
        
        BACKEND_AWS_REGION=$(grep "^AWS_REGION=" "$BACKEND_ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        BACKEND_EMAILS_FROM_EMAIL=$(grep "^EMAILS_FROM_EMAIL=" "$BACKEND_ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        
        if [ -n "$BACKEND_AWS_REGION" ]; then
            echo -e "${GREEN}✅ Backend AWS_REGION: $BACKEND_AWS_REGION${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend AWS_REGION: Not set${NC}"
        fi
        
        if [ -n "$BACKEND_EMAILS_FROM_EMAIL" ]; then
            echo -e "${GREEN}✅ Backend EMAILS_FROM_EMAIL: $BACKEND_EMAILS_FROM_EMAIL${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend EMAILS_FROM_EMAIL: Not set${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Backend .env file not found: $BACKEND_ENV_FILE${NC}"
    fi
    
else
    echo -e "${RED}❌ .env file not found: $ENV_FILE${NC}"
fi

echo ""
echo "🔍 Checking AWS CLI and SES:"
echo "-----------------------------------"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI is installed${NC}"
    
    # Check AWS credentials
    if aws sts get-caller-identity &> /dev/null; then
        echo -e "${GREEN}✅ AWS credentials are valid${NC}"
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        echo "   Account ID: $AWS_ACCOUNT"
    else
        echo -e "${RED}❌ AWS credentials are not valid or not configured${NC}"
    fi
    
    # Check SES configuration if region is set
    if [ -n "$AWS_REGION" ]; then
        echo ""
        echo "🔍 Checking SES Configuration:"
        echo "-----------------------------------"
        
        # Check if SES is available in the region
        if aws ses get-account-sending-enabled --region "$AWS_REGION" &> /dev/null; then
            echo -e "${GREEN}✅ SES is accessible in region: $AWS_REGION${NC}"
            
            # Check sending status
            SENDING_ENABLED=$(aws ses get-account-sending-enabled --region "$AWS_REGION" --query Enabled --output text 2>/dev/null)
            if [ "$SENDING_ENABLED" = "True" ]; then
                echo -e "${GREEN}✅ Account sending is enabled${NC}"
            else
                echo -e "${YELLOW}⚠️  Account sending is disabled (sandbox mode)${NC}"
            fi
            
            # Check verified email addresses
            if [ -n "$EMAILS_FROM_EMAIL" ]; then
                echo ""
                echo "🔍 Checking verified email addresses:"
                VERIFIED_EMAILS=$(aws ses list-verified-email-addresses --region "$AWS_REGION" --query 'VerifiedEmailAddresses' --output text 2>/dev/null)
                if echo "$VERIFIED_EMAILS" | grep -q "$EMAILS_FROM_EMAIL"; then
                    echo -e "${GREEN}✅ $EMAILS_FROM_EMAIL is verified in SES${NC}"
                else
                    echo -e "${RED}❌ $EMAILS_FROM_EMAIL is NOT verified in SES${NC}"
                    echo "   You need to verify this email address in AWS SES console"
                fi
            fi
        else
            echo -e "${RED}❌ Cannot access SES in region: $AWS_REGION${NC}"
            echo "   Check your AWS credentials and permissions"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  AWS CLI is not installed${NC}"
    echo "   Install with: sudo yum install aws-cli (Amazon Linux) or sudo apt-get install awscli (Ubuntu)"
fi

echo ""
echo "🔍 Checking Backend Service Logs:"
echo "-----------------------------------"

# Check if backend service is running
if systemctl is-active --quiet lms-backend; then
    echo -e "${GREEN}✅ Backend service is running${NC}"
    echo ""
    echo "📋 Recent email-related logs:"
    echo "-----------------------------------"
    sudo journalctl -u lms-backend -n 50 --no-pager | grep -i "email\|ses\|SES" | tail -20 || echo "No email-related logs found"
else
    echo -e "${RED}❌ Backend service is not running${NC}"
fi

echo ""
echo "=========================================="
echo "📋 Summary:"
echo "=========================================="
echo ""
echo "Required for email to work:"
echo "  1. ✅ AWS_REGION must be set"
echo "  2. ✅ EMAILS_FROM_EMAIL must be set"
echo "  3. ✅ EMAILS_FROM_EMAIL must be verified in AWS SES"
echo "  4. ✅ AWS credentials (IAM role or access keys) must have SES permissions"
echo ""
echo "To verify email in SES:"
echo "  1. Go to AWS SES Console"
echo "  2. Navigate to 'Verified identities'"
echo "  3. Click 'Create identity'"
echo "  4. Enter your email address"
echo "  5. Verify the email by clicking the link sent to your inbox"
echo ""

