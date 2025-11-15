#!/bin/bash

# System Optimization Script
# Optimizes EC2 instance for better performance and resource usage

set -e

echo "🔧 Starting system optimization..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Optimize Swap
echo "💾 Step 1: Optimizing swap..."
if [ ! -f /swapfile ] || [ $(swapon --show=SIZE --noheadings --bytes /swapfile 2>/dev/null | awk '{print int($1/1024/1024)}') -lt 1024 ]; then
    print_warning "Creating/updating swap file (1GB)..."
    sudo swapoff /swapfile 2>/dev/null || true
    sudo rm -f /swapfile
    
    # Create 1GB swap file
    sudo dd if=/dev/zero of=/swapfile bs=128M count=8 status=progress
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Make permanent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    fi
    
    print_success "Swap file created and activated"
else
    print_success "Swap file already exists and is adequate"
fi

# Show current swap
echo "Current swap status:"
swapon --show

# 2. Clean up system
echo ""
echo "🧹 Step 2: Cleaning up system resources..."

# Clean package cache
if command -v apt-get &> /dev/null; then
    sudo apt-get clean
    sudo apt-get autoremove -y
    print_success "Cleaned apt cache"
elif command -v yum &> /dev/null; then
    sudo yum clean all
    print_success "Cleaned yum cache"
fi

# Clean log files (keep last 7 days)
echo "Cleaning old log files..."
sudo find /var/log -type f -name "*.log" -mtime +7 -exec truncate -s 0 {} \; 2>/dev/null || true
sudo journalctl --vacuum-time=7d >/dev/null 2>&1 || true
print_success "Cleaned old log files"

# Clean temporary files
sudo rm -rf /tmp/* 2>/dev/null || true
sudo rm -rf /var/tmp/* 2>/dev/null || true
print_success "Cleaned temporary files"

# 3. Optimize system limits
echo ""
echo "⚙️  Step 3: Optimizing system limits..."

# Increase file descriptor limits
if ! grep -q "lms-app" /etc/security/limits.conf; then
    sudo tee -a /etc/security/limits.conf > /dev/null << EOF
# LMS Application limits
ec2-user soft nofile 65536
ec2-user hard nofile 65536
ec2-user soft nproc 4096
ec2-user hard nproc 4096
EOF
    print_success "Updated system limits"
else
    print_success "System limits already configured"
fi

# 4. Optimize kernel parameters
echo ""
echo "🔧 Step 4: Optimizing kernel parameters..."

# Create sysctl optimizations
sudo tee /etc/sysctl.d/99-lms-optimizations.conf > /dev/null << EOF
# Network optimizations
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_slow_start_after_idle = 0

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File system optimizations
fs.file-max = 2097152
EOF

sudo sysctl -p /etc/sysctl.d/99-lms-optimizations.conf >/dev/null 2>&1 || true
print_success "Kernel parameters optimized"

# 5. Check current resource usage
echo ""
echo "📊 Step 5: Current system status..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h / | tail -1
echo ""
echo "Top memory-consuming processes:"
ps aux --sort=-%mem | head -6

# 6. Update systemd service files if they exist
echo ""
echo "🔄 Step 6: Updating systemd services..."

DEPLOY_DIR="/home/ec2-user/lms-app"
if [ ! -d "$DEPLOY_DIR" ]; then
    DEPLOY_DIR="/home/ubuntu/lms-app"
fi

if [ -d "$DEPLOY_DIR/deploy/systemd" ]; then
    if [ -f "$DEPLOY_DIR/deploy/systemd/lms-backend.service" ]; then
        sudo cp "$DEPLOY_DIR/deploy/systemd/lms-backend.service" /etc/systemd/system/
        print_success "Updated backend service file"
    fi
    
    if [ -f "$DEPLOY_DIR/deploy/systemd/lms-frontend.service" ]; then
        sudo cp "$DEPLOY_DIR/deploy/systemd/lms-frontend.service" /etc/systemd/system/
        print_success "Updated frontend service file"
    fi
    
    sudo systemctl daemon-reload
    print_success "Reloaded systemd daemon"
fi

echo ""
print_success "System optimization completed! 🎉"
echo ""
echo "💡 Next steps:"
echo "   1. Restart services: sudo systemctl restart lms-backend lms-frontend"
echo "   2. Check status: sudo systemctl status lms-backend lms-frontend"
echo "   3. Monitor resources: ./deploy/monitor-resources.sh"

