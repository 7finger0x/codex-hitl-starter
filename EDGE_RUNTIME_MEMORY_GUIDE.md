# Supabase Edge Runtime Memory Monitoring & Optimization Guide

## Overview
This guide helps you monitor, debug, and optimize memory usage for Supabase Edge Functions in your local development environment.

## Table of Contents
1. [Memory Limits & Prevention](#memory-limits--prevention)
2. [Monitoring Edge Function Memory](#monitoring-edge-function-memory)
3. [Debugging Memory Issues](#debugging-memory-issues)
4. [Optimization Strategies](#optimization-strategies)
5. [Troubleshooting](#troubleshooting)

---

## Memory Limits & Prevention

### Current Configuration
The `docker-compose.override.yml` file applies these memory constraints:

```yaml
supabase_edge_runtime_codex-hitl-starter:
  mem_limit: 2g          # Hard limit - container cannot exceed 2GB
  memswap_limit: 2g      # Swap limit (same as mem_limit = no swap allowed)
  healthcheck:
    interval: 10s        # Check health every 10 seconds
    timeout: 5s          # Health check must respond within 5 seconds
    retries: 3           # Fail container after 3 failed health checks
```

### What Happens When Memory Limit is Exceeded
- **Graceful**: If a function is still processing, it will be killed mid-execution
- **Container State**: Container enters `OOMKilled` state
- **Automatic Restart**: With `restart_policy: unless-stopped`, the container restarts (Docker Compose default)
- **Impact**: All running functions are interrupted; clients receive 503 errors

### Adjusting the Memory Limit
Edit `docker-compose.override.yml`:
```yaml
supabase_edge_runtime_codex-hitl-starter:
  mem_limit: 1g   # Smaller for tighter control (minimum 512m recommended)
  mem_limit: 4g   # Larger for heavy workloads (max available to Docker Desktop)
```

Then redeploy:
```bash
docker compose down
docker compose up -d
```

---

## Monitoring Edge Function Memory

### Method 1: Real-Time Docker Stats

```bash
# Watch edge-runtime memory usage live
docker stats supabase_edge_runtime_codex-hitl-starter --no-stream

# Expected output:
# CONTAINER ID   NAME                                       MEM USAGE / LIMIT   MEM %
# d7ce04afe195   supabase_edge_runtime_codex-hitl-starter   150MiB / 2GiB       7.3%
```

**Interpret the output:**
- `MEM USAGE`: Current memory consumed
- `MEM %`: Percentage of the limit being used
- **Alert threshold**: >80% of limit = risk of OOM

### Method 2: Continuous Monitoring (Background)

```bash
# Monitor for 5 minutes with 2-second intervals
docker stats supabase_edge_runtime_codex-hitl-starter --interval 2 --no-stream &
# Runs in background; press Ctrl+C to stop
```

### Method 3: Historical Memory Metrics

```bash
# View container creation timestamp and startup memory
docker inspect supabase_edge_runtime_codex-hitl-starter | grep -E '"Memory|StartedAt|FinishedAt'

# Check if container was OOMKilled
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{json .State}}'
# Look for: "OOMKilled": true (if this occurred)
```

### Method 4: Supabase Studio Edge Function Logs

1. Open **Supabase Studio**: http://127.0.0.1:54323
2. Navigate: **Functions** (left sidebar) → Select your function
3. View: **Logs** tab
4. Look for patterns:
   - `memory exceeded` errors
   - `failed to allocate` messages
   - Long-running functions without progress

---

## Debugging Memory Issues

### Symptom 1: Edge-Runtime Keeps Restarting
**Cause**: Likely memory leak in a deployed function

**Diagnosis**:
```bash
# Check restart count and exit code
docker ps -a --filter name=edge_runtime --format="table {{.Names}}\t{{.Status}}\t{{.Restarts}}"

# View last 100 lines of logs
docker logs supabase_edge_runtime_codex-hitl-starter --tail 100

# Check for OOMKilled state
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{.State.OOMKilled}}'
# If true: memory limit was exceeded
```

**Fix**:
1. Identify the problematic function (via timestamps in logs)
2. Review function code for:
   - Infinite loops
   - Unbounded array/object growth
   - Missing cleanup in event listeners
3. Deploy fixed version and restart: `docker compose restart supabase_edge_runtime_codex-hitl-starter`

### Symptom 2: Slow Memory Leak (Gradual Growth)
**Cause**: Function holds references that aren't garbage collected

**Diagnosis**:
```bash
# Record memory snapshots every 10 seconds for 5 minutes
for i in {1..30}; do 
  echo "$(date) $(docker stats --no-stream supabase_edge_runtime_codex-hitl-starter | tail -1)"
  sleep 10
done > /tmp/memory-trend.txt

# Analyze the trend
cat /tmp/memory-trend.txt | awk '{print $NF}' | sort -u
# If values keep increasing: likely a leak
```

**Fix**:
1. Review function for global state mutations
2. Ensure database connections are closed after use: `await client.end()`
3. Unsubscribe from event listeners: `emitter.off(event, callback)`
4. Clear timers: `clearInterval(intervalId); clearTimeout(timeoutId)`

### Symptom 3: Memory Spike During Function Execution
**Cause**: Function processes large data (arrays, files, API responses)

**Diagnosis**:
```bash
# Trigger function call and monitor simultaneously
docker stats supabase_edge_runtime_codex-hitl-starter --interval 1 &
curl http://127.0.0.1:54321/functions/v1/YOUR_FUNCTION_NAME
kill %1  # Stop background stats job
```

**Pattern**:
- Memory spikes during execution → Normal (depends on data size)
- Memory stays high after execution ends → Memory leak
- Memory returns to baseline after execution → Normal

**Fix**:
1. Process data in chunks instead of loading everything at once
2. Use streaming for large files/responses
3. Implement pagination for database queries

---

## Optimization Strategies

### Strategy 1: Function Code Optimization

**❌ Bad - Loads entire file into memory:**
```typescript
const buffer = await Deno.readFile('/large/file.json');
const data = JSON.parse(new TextDecoder().decode(buffer));
```

**✅ Good - Streams large data:**
```typescript
const file = await Deno.open('/large/file.json');
// Process file line-by-line or in chunks
for await (const chunk of Deno.iter(file, { bufSize: 16384 })) {
  // Process chunk without loading entire file
}
file.close();
```

### Strategy 2: Connection Pooling

**❌ Bad - New connection per request:**
```typescript
async function handler(req: Request) {
  const client = new Client({ connectionString: Deno.env.get('DB_URL') });
  await client.connect();
  const result = await client.queryArray('SELECT ...');
  await client.end();
  return result;
}
```

**✅ Good - Reuse connection pool:**
```typescript
const client = new Client({ connectionString: Deno.env.get('DB_URL'), pool: true });

async function handler(req: Request) {
  const result = await client.queryArray('SELECT ...');
  return result;
}
```

### Strategy 3: External Data Fetching

**❌ Bad - No timeout or memory bounds:**
```typescript
const response = await fetch('https://api.example.com/large-endpoint');
const json = await response.json();
```

**✅ Good - Bounded response + timeout:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

const response = await fetch('https://api.example.com/large-endpoint', {
  signal: controller.signal,
});

clearTimeout(timeoutId);

// Limit response size
if (response.headers.get('content-length') > 10_000_000) {
  throw new Error('Response too large (>10MB)');
}

const json = await response.json();
```

### Strategy 4: Per-Worker Policies

The `supabase/config.toml` is already set to `policy = "per_worker"` (best for development):
```toml
[edge_runtime]
policy = "per_worker"  # Each function in its own worker
# Alternative: policy = "oneshot" (restart worker after each request; slower but more isolated)
```

---

## Troubleshooting

### Q1: Container shows `Exit (137)` - What happened?
**A**: Exit code 137 = SIGKILL from OOM killer. The kernel forcefully terminated the process because it exceeded the memory limit.

**Solution**:
```bash
# Increase memory limit in docker-compose.override.yml
mem_limit: 3g  # Increase from 2g

# Restart
docker compose down && docker compose up -d
```

### Q2: How do I know if my function has a memory leak?
**A**: Deploy a test function that does nothing:
```typescript
export async function handler(req: Request) {
  return new Response('OK');
}
```

Monitor memory for 5 minutes. If baseline stays ~20-30MB and doesn't grow, edge-runtime is healthy. If your real function causes growth, the leak is in your code.

### Q3: Can I set per-function memory limits?
**A**: Not in local development. Supabase Cloud offers per-function limits via the dashboard. For local testing:
- Manually kill functions taking too long: `docker exec supabase_edge_runtime_codex-hitl-starter pkill -f <function_name>`
- Implement function timeouts in your code

### Q4: What's the minimum safe memory limit?
**A**: **512MB minimum**. Below that, Deno runtime itself runs out of memory. Recommended: **1-2GB** for development.

### Q5: How do I export memory metrics to a monitoring system?
**A**: Use Prometheus + Grafana (already in compose.yaml with `profiles: [observability]`):

```bash
# Start observability stack
docker compose --profile observability up -d

# Access Grafana: http://127.0.0.1:53000
# (credentials in .env.local: admin / test_grafana_password_12345)
```

---

## Quick Reference: Health Check Commands

```bash
# Check if edge-runtime is healthy
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{.State.Health}}'
# Output: "healthy", "unhealthy", or "starting"

# View health check failures
docker inspect supabase_edge_runtime_codex-hitl-starter --format='{{json .State.HealthStatus}}'

# Restart unhealthy container
docker restart supabase_edge_runtime_codex-hitl-starter

# View detailed state
docker ps -a --filter name=edge_runtime --format="table {{.Names}}\t{{.State}}\t{{.Status}}"
```

---

## Related Resources
- [Deno Memory Management](https://docs.deno.com/api/deno/globals/Function/clearInterval)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Docker Memory Limits](https://docs.docker.com/config/containers/resource_constraints/#memory)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
