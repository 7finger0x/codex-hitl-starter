# Supabase Edge-Runtime Memory Limit Deployment Guide

## Summary of Changes

This guide documents the memory optimization applied to your `codex-hitl-starter` Supabase local development environment on **July 16, 2026**.

### What Was Done

1. **Applied 2GB memory limit** to the edge-runtime container
2. **Created monitoring tools** (shell and PowerShell scripts)
3. **Added comprehensive guide** for future memory optimization
4. **Set up health checks** to detect OOM conditions early

### Current Configuration

```bash
Container: supabase_edge_runtime_codex-hitl-starter
Memory Limit: 2 GiB (2147483648 bytes)
Memory Swap Limit: 2 GiB (no swap allowed)
Current Usage: 22.68 MiB (1.11%)
Status: ✓ Healthy
```

---

## Files Created

### 1. `docker-compose.override.yml`
Service configuration overrides with memory limits and healthcheck.

**To apply to future Supabase projects:**
```bash
# After running `supabase init` or `supabase start`
cp docker-compose.override.yml ~/.supabase/projects/YOUR_PROJECT/docker-compose.override.yml

# Then restart
docker compose down && docker compose up -d
```

### 2. `EDGE_RUNTIME_MEMORY_GUIDE.md`
Complete reference guide covering:
- Memory limits and prevention strategies
- Real-time monitoring methods
- Debugging memory leaks
- Function optimization patterns
- Troubleshooting common issues
- Quick reference commands

### 3. `edge-runtime-monitor.sh` (Linux/macOS)
Bash script for continuous memory monitoring.

**Usage:**
```bash
# Monitor for 5 minutes with 80% alert threshold
bash edge-runtime-monitor.sh 300 80

# Monitor for 10 minutes with 70% alert threshold
bash edge-runtime-monitor.sh 600 70
```

**Output:**
- Real-time memory usage display
- CSV file saved to `/tmp/edge-runtime-monitor.csv`
- Statistical analysis (min/avg/max)
- Anomaly detection (memory spikes)

### 4. `edge-runtime-monitor.ps1` (Windows PowerShell)
PowerShell equivalent of the bash script.

**Usage:**
```powershell
# Monitor for 5 minutes with 80% alert threshold
.\edge-runtime-monitor.ps1 -Duration 300 -AlertThreshold 80

# Monitor for 10 minutes with 70% alert threshold
.\edge-runtime-monitor.ps1 -Duration 600 -AlertThreshold 70
```

---

## How to Apply Memory Limits to Your Running Container

### Method 1: Docker Update (Current Container)
```bash
docker update --memory 2g --memory-swap 2g supabase_edge_runtime_codex-hitl-starter
docker restart supabase_edge_runtime_codex-hitl-starter
```

**When to use**: Quick fix for existing container; changes lost after container removal.

### Method 2: Docker Compose Override (Permanent)
```bash
# 1. Place docker-compose.override.yml in the same directory as docker-compose.yml
# 2. Find where Supabase CLI created the docker-compose.yml:
find ~ -name "docker-compose.yml" -path "*supabase*" 2>/dev/null

# 3. Copy override file to that directory
cp docker-compose.override.yml /path/to/supabase/docker-compose.override.yml

# 4. Restart services
cd /path/to/supabase
docker compose down
docker compose up -d
```

**When to use**: Permanent solution; applies to all future `docker compose up` commands.

### Method 3: Supabase CLI Configuration (Best Practice)
Some Supabase CLI versions support environment variables for compose overrides:

```bash
# Set env var before starting services
export DOCKER_COMPOSE_OVERRIDE="/full/path/to/docker-compose.override.yml"
supabase start
```

Check your CLI version: `supabase --version`

---

## Monitoring Commands

### Quick Health Check
```bash
# Check current memory usage
docker stats supabase_edge_runtime_codex-hitl-starter --no-stream

# Expected output:
# MEM USAGE / LIMIT  → 22.68MiB / 2GiB (1.11%)
```

### Continuous Monitoring (60s)
```bash
# Linux/macOS
bash edge-runtime-monitor.sh 60 80

# Windows PowerShell
.\edge-runtime-monitor.ps1 -Duration 60 -AlertThreshold 80
```

### Check for OOM Kills
```bash
# If this returns "true", the container was OOMKilled
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{.State.OOMKilled}}'

# View detailed container state
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{json .State}}' | jq .
```

### Historical Data
```bash
# Find previous monitor CSV files
find /tmp -name "edge-runtime-monitor.csv" -mtime -7  # Last 7 days
```

---

## Alert Thresholds & Recommendations

| Threshold | Action |
|-----------|--------|
| **< 50%** | ✓ Optimal - Functions running efficiently |
| **50-80%** | ⚠️ Acceptable - Monitor closely if sustained |
| **80-95%** | ⚠️ High - Check for memory leaks |
| **> 95%** | 🔴 Critical - OOM kill likely within seconds |

---

## Common Scenarios

### Scenario 1: First-Time Setup
```bash
# 1. Start Supabase
supabase start

# 2. Find the project directory
cd ~/.supabase/projects/codex-hitl-starter/

# 3. Copy override file
cp /full/path/to/docker-compose.override.yml .

# 4. Restart with override
docker compose down && docker compose up -d

# 5. Verify memory limit applied
docker stats supabase_edge_runtime_codex-hitl-starter --no-stream
```

### Scenario 2: Existing Project (No Override Yet)
```bash
# Quick fix for current session only
docker update --memory 2g supabase_edge_runtime_codex-hitl-starter
docker restart supabase_edge_runtime_codex-hitl-starter

# Verify
docker stats supabase_edge_runtime_codex-hitl-starter --no-stream
```

### Scenario 3: Monitor for Memory Leak
```bash
# Run 10-minute baseline with no active functions
.\edge-runtime-monitor.ps1 -Duration 600 -AlertThreshold 85

# Then deploy a test function and re-run
# Compare the CSV files to identify memory growth patterns
Get-Content $env:TEMP\edge-runtime-monitor.csv | Select-Object -Last 10
```

---

## Troubleshooting

### Q: Override file not being applied
**Solution:**
```bash
# Ensure override file is in same directory as docker-compose.yml
ls -la docker-compose*.yml

# Verify compose loads the override
docker compose config | grep -A 10 "edge_runtime"

# If still not applied, manually update container
docker update --memory 2g supabase_edge_runtime_codex-hitl-starter
```

### Q: Monitor script shows "CONTAINER NOT FOUND"
**Solution:**
```bash
# Ensure Supabase is running
docker ps | grep supabase_edge_runtime

# If not running, start it
docker start supabase_edge_runtime_codex-hitl-starter

# Re-run monitor script
.\edge-runtime-monitor.ps1 -Duration 300 -AlertThreshold 80
```

### Q: Need to increase memory limit from 2GB to 4GB
**Solution:**
```bash
# Edit docker-compose.override.yml
# Change: mem_limit: 2g
# To: mem_limit: 4g

# Then:
docker compose down && docker compose up -d

# Or for immediate effect:
docker update --memory 4g supabase_edge_runtime_codex-hitl-starter
```

---

## Integration with CI/CD

To prevent OOM kills in automated testing:

### GitHub Actions Example
```yaml
- name: Start Supabase
  run: |
    supabase start
    docker update --memory 2g --memory-swap 2g \
      supabase_edge_runtime_codex-hitl-starter
    sleep 5

- name: Monitor Memory During Tests
  run: |
    bash edge-runtime-monitor.sh 300 80 &
    npm test
    wait
```

### Docker Compose CI Example
```bash
#!/bin/bash
docker compose up -d
sleep 3

# Apply memory limits immediately
docker update --memory 2g --memory-swap 2g \
  supabase_edge_runtime_codex-hitl-starter

# Run tests
npm test
EXIT_CODE=$?

# Generate memory report
docker stats --no-stream supabase_edge_runtime_codex-hitl-starter > memory-report.txt

exit $EXIT_CODE
```

---

## Next Steps

1. **Keep override file updated** - If you upgrade Supabase CLI, re-copy the override file
2. **Regular monitoring** - Schedule weekly `edge-runtime-monitor.ps1` runs to baseline memory usage
3. **Function audits** - Review all deployed functions for memory leaks (see EDGE_RUNTIME_MEMORY_GUIDE.md)
4. **Team communication** - Share this guide with team members developing Edge Functions

---

## References

- **This Project**: `codex-hitl-starter` (Supabase project ID: `codex-hitl-starter`)
- **Container Name**: `supabase_edge_runtime_codex-hitl-starter`
- **Memory Limit Applied**: 2 GiB (2147483648 bytes)
- **Applied Date**: July 16, 2026
- **Guide Location**: `EDGE_RUNTIME_MEMORY_GUIDE.md`
- **Monitor Scripts**: `edge-runtime-monitor.sh`, `edge-runtime-monitor.ps1`

---

## Support

For issues related to memory optimization:

1. **Check the monitoring guide**: `EDGE_RUNTIME_MEMORY_GUIDE.md` (Troubleshooting section)
2. **Review Supabase docs**: https://supabase.com/docs/guides/functions/limits
3. **Check Docker memory docs**: https://docs.docker.com/config/containers/resource_constraints/#memory
4. **Supabase Community**: https://github.com/supabase/supabase/discussions
