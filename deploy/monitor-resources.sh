#!/bin/bash

# Resource Monitoring Script
# Monitors CPU, memory, and system health

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "📊 System Resource Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Memory usage
echo "💾 Memory Usage:"
MEMORY_USED=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
MEMORY_FREE=$(free -h | awk 'NR==2{print $7}')
MEMORY_TOTAL=$(free -h | awk 'NR==2{print $2}')

if [ $MEMORY_USED -gt 90 ]; then
    echo -e "${RED}⚠️  CRITICAL: Memory usage is ${MEMORY_USED}%${NC}"
    echo "   Free: $MEMORY_FREE / Total: $MEMORY_TOTAL"
elif [ $MEMORY_USED -gt 75 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Memory usage is ${MEMORY_USED}%${NC}"
    echo "   Free: $MEMORY_FREE / Total: $MEMORY_TOTAL"
else
    echo -e "${GREEN}✅ Memory usage is ${MEMORY_USED}%${NC}"
    echo "   Free: $MEMORY_FREE / Total: $MEMORY_TOTAL"
fi

# Swap usage
echo ""
echo "💿 Swap Usage:"
SWAP_USED=$(free | awk 'NR==3{printf "%.0f", $3*100/$2}' 2>/dev/null || echo "0")
if [ "$SWAP_USED" != "0" ] && [ ! -z "$SWAP_USED" ]; then
    if [ $SWAP_USED -gt 50 ]; then
        echo -e "${YELLOW}⚠️  Swap usage is ${SWAP_USED}% (consider increasing RAM)${NC}"
    else
        echo -e "${GREEN}✅ Swap usage is ${SWAP_USED}%${NC}"
    fi
    swapon --show
else
    echo "   No swap configured"
fi

# CPU usage
echo ""
echo "⚡ CPU Usage:"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    echo -e "${RED}⚠️  CRITICAL: CPU usage is ${CPU_USAGE}%${NC}"
elif (( $(echo "$CPU_USAGE > 75" | bc -l) )); then
    echo -e "${YELLOW}⚠️  WARNING: CPU usage is ${CPU_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ CPU usage is ${CPU_USAGE}%${NC}"
fi

# Disk usage
echo ""
echo "💽 Disk Usage:"
DISK_USED=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USED -gt 90 ]; then
    echo -e "${RED}⚠️  CRITICAL: Disk usage is ${DISK_USED}%${NC}"
elif [ $DISK_USED -gt 75 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Disk usage is ${DISK_USED}%${NC}"
else
    echo -e "${GREEN}✅ Disk usage is ${DISK_USED}%${NC}"
fi
df -h / | tail -1

# Top processes by memory
echo ""
echo "🔝 Top 5 Processes by Memory:"
ps aux --sort=-%mem | head -6 | awk '{printf "%-8s %6s %5s%% %s\n", $1, $2, $4, $11}'

# Service status
echo ""
echo "🔄 Service Status:"
if systemctl is-active --quiet lms-backend; then
    echo -e "${GREEN}✅ Backend: Running${NC}"
else
    echo -e "${RED}❌ Backend: Not Running${NC}"
fi

if systemctl is-active --quiet lms-frontend; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "${RED}❌ Frontend: Not Running${NC}"
fi

# Auto-restart if memory is critical
if [ $MEMORY_USED -gt 90 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  High memory usage detected!${NC}"
    read -p "Restart services? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Restarting services..."
        sudo systemctl restart lms-backend lms-frontend
        sleep 5
        echo "Services restarted"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Last updated: $(date)"

