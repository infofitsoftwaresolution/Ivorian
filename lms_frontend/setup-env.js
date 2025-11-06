/**
 * Setup Environment File
 * Creates .env.local with proper configuration
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Frontend Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development Settings
NEXT_PUBLIC_APP_NAME=InfoFit Labs LMS
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file successfully');
  console.log('📍 Location:', envPath);
  console.log('🔧 Configuration:');
  console.log('   - API URL: http://localhost:8000');
  console.log('   - Debug Mode: Enabled');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
}
