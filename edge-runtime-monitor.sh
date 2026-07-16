#!/bin/bash
# edge-runtime-monitor.sh - Memory monitoring script for Supabase edge-runtime
# Usage: bash edge-runtime-monitor.sh [duration_seconds] [alert_threshold_percent]
# Example: bash edge-runtime-monitor.sh 300 80

CONTAINER="supabase_edge_runtime_codex-hitl-starter"
DURATION=${1:-60}  # Default: monitor for 60 seconds
ALERT_THRESHOLD=${2:-80}  # Default: alert if >80% of limit is used

echo "=== Supabase Edge-Runtime Memory Monitor ==="
echo "Container: $CONTAINER"
echo "Duration: ${DURATION}s"
echo "Alert Threshold: ${ALERT_THRESHOLD}%"
echo ""

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container '$CONTAINER' not found"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "WARNING: Container is not running. Starting..."
    docker start "$CONTAINER"
    sleep 2
fi

echo "TIME,MEM_USAGE_MB,MEM_LIMIT_MB,MEM_PERCENT,STATUS" > /tmp/edge-runtime-monitor.csv

START_TIME=$(date +%s)
SAMPLE=0

while [ $(($(date +%s) - START_TIME)) -lt "$DURATION" ]; do
    STATS=$(docker stats --no-stream "$CONTAINER" 2>/dev/null | tail -1)
    
    if [ -z "$STATS" ]; then
        echo "ERROR: Failed to get stats"
        exit 1
    fi
    
    # Parse docker stats output
    TIME=$(date '+%H:%M:%S')
    MEM_LINE=$(echo "$STATS" | awk '{print $4}')
    
    # Extract memory usage and limit (e.g., "150MiB / 2GiB" -> 150, 2048)
    MEM_USAGE=$(echo "$MEM_LINE" | awk -F'/' '{print $1}' | xargs)
    MEM_LIMIT=$(echo "$MEM_LINE" | awk -F'/' '{print $2}' | xargs)
    
    # Convert to MB for comparison
    MEM_USAGE_MB=$(echo "$MEM_USAGE" | sed 's/MiB//' | sed 's/GiB/*1024/')
    MEM_USAGE_MB=$(echo "${MEM_USAGE_MB}" | bc)
    MEM_LIMIT_MB=$(echo "$MEM_LIMIT" | sed 's/MiB//' | sed 's/GiB/*1024/')
    MEM_LIMIT_MB=$(echo "${MEM_LIMIT_MB}" | bc)
    
    # Calculate percentage
    MEM_PERCENT=$(echo "scale=1; ($MEM_USAGE_MB / $MEM_LIMIT_MB) * 100" | bc)
    MEM_PERCENT_INT=$(echo "$MEM_PERCENT" | cut -d'.' -f1)
    
    # Determine status
    if [ "$MEM_PERCENT_INT" -gt "$ALERT_THRESHOLD" ]; then
        STATUS="⚠️ HIGH"
    else
        STATUS="✓ OK"
    fi
    
    # Print current sample
    printf "[%s] %6.1fMB / %6.0fMB (%5.1f%%) %s\n" "$TIME" "$MEM_USAGE_MB" "$MEM_LIMIT_MB" "$MEM_PERCENT" "$STATUS"
    
    # Log to CSV
    echo "$TIME,$MEM_USAGE_MB,$MEM_LIMIT_MB,$MEM_PERCENT,$STATUS" >> /tmp/edge-runtime-monitor.csv
    
    SAMPLE=$((SAMPLE + 1))
    sleep 2
done

echo ""
echo "=== Monitoring Complete ==="
echo "Total samples: $SAMPLE"
echo ""

# Calculate statistics
echo "=== Memory Statistics ==="
awk -F',' 'NR>1 {
    usage=$2
    limit=$3
    pct=$4
    
    if (min=="" || usage < min) min=usage
    if (max=="" || usage > max) max=usage
    if (min_pct=="" || pct < min_pct) min_pct=pct
    if (max_pct=="" || pct > max_pct) max_pct=pct
    
    sum+=usage
    count++
}
END {
    if (count > 0) {
        avg=sum/count
        printf "Minimum: %.1fMB (%.1f%%)\n", min, min_pct
        printf "Average: %.1fMB (%.1f%%)\n", avg, (avg/limit)*100
        printf "Maximum: %.1fMB (%.1f%%)\n", max, max_pct
    }
}' /tmp/edge-runtime-monitor.csv

# Check for anomalies
echo ""
echo "=== Anomaly Detection ==="
MAX_GROWTH=$(awk -F',' 'NR>1 {
    if (prev!="") {
        growth=$2-prev
        if (growth > max_growth) {
            max_growth=growth
            max_growth_idx=NR
        }
    }
    prev=$2
}
END {
    printf "%.1f", max_growth
}' /tmp/edge-runtime-monitor.csv)

echo "Maximum spike: ${MAX_GROWTH}MB between samples"

HIGH_COUNT=$(awk -F',' -v threshold="$ALERT_THRESHOLD" 'NR>1 && $4 > threshold' /tmp/edge-runtime-monitor.csv | wc -l)

if [ "$HIGH_COUNT" -gt 0 ]; then
    echo "⚠️ WARNING: Memory exceeded ${ALERT_THRESHOLD}% threshold $HIGH_COUNT times"
else
    echo "✓ Memory stayed below ${ALERT_THRESHOLD}% threshold"
fi

echo ""
echo "Full CSV data saved to: /tmp/edge-runtime-monitor.csv"
echo "To analyze in Excel: cat /tmp/edge-runtime-monitor.csv"
