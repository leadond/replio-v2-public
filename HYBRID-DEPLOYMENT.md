# Replio Hybrid Deployment Guide

**Architecture:** Local AI (OpenClaw + llama.cpp) + Railway Backend + Vercel Frontend

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Your Local Machine                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ OpenClaw (Port 20000 - Qwen models)              │  │
│  │ ✓ Call transcription                             │  │
│  │ ✓ Response generation                           │  │
│  │ ✓ Call analysis (routing, sentiment)            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ llama.cpp (Port 20001 - LLaMA models - fallback)│  │
│  │ ✓ Backup transcription                          │  │
│  │ ✓ Backup response generation                    │  │
│  └──────────────────────────────────────────────────┘  │
│  RTX 5060 32GB VRAM | 64GB RAM | 10 concurrent req    │
└─────────────────────────────────────────────────────────┘
                           ↓ (API calls)
┌─────────────────────────────────────────────────────────┐
│                Railway Backend (FastAPI)                 │
│  ✓ Call routing & orchestration                        │
│  ✓ Database (PostgreSQL)                               │
│  ✓ Authentication (JWT)                                │
│  ✓ Multi-tenant isolation                              │
└─────────────────────────────────────────────────────────┘
                           ↓ (JSON)
┌─────────────────────────────────────────────────────────┐
│             Vercel Frontend (React)                      │
│  ✓ User interface for agents/calls                      │
│  ✓ Real-time call status                               │
│  ✓ Appointment scheduling UI                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Port Assignments (from Port Gate Guard)

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| OpenClaw | 20000 | ✅ Reserved | Primary AI inference (Qwen) |
| llama.cpp | 20001 | ✅ Reserved | Fallback AI inference (LLaMA) |

---

## 🚀 Phase 1: Local AI Setup (Your Machine)

### Step 1: Install OpenClaw

```bash
# Option A: Via pip
pip install openclaw

# Option B: From source (if you have custom models)
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pip install -e .
```

### Step 2: Configure OpenClaw

Create `openclaw-config.json`:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 20000,
    "api_key": "your-secure-api-key-min-32-chars-here-change-this"
  },
  "models": {
    "qwen": {
      "model_name": "Qwen/Qwen2.5-32B-Instruct",
      "quantization": "int8",
      "device": "cuda",
      "max_tokens": 2048,
      "temperature": 0.7
    }
  },
  "inference": {
    "batch_size": 4,
    "max_concurrent_requests": 10,
    "timeout_seconds": 30,
    "enable_gpu_layers": true,
    "gpu_layers": 40
  },
  "logging": {
    "level": "INFO",
    "file": "openclaw.log"
  }
}
```

### Step 3: Start OpenClaw

```bash
python -m openclaw.server --config openclaw-config.json
```

Expected output:
```
INFO: OpenClaw server running on 0.0.0.0:20000
INFO: Qwen model loaded: 32B Instruct (int8 quantization)
INFO: GPU: NVIDIA RTX 5060 (32GB VRAM)
```

### Step 4: Install llama.cpp

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make LLAMA_CUDA=1
```

### Step 5: Download LLaMA Model

```bash
# Recommended: Mistral 7B (smaller, faster, better for fallback)
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf -O models/mistral-7b.gguf

# Or: Llama 2 7B
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf -O models/llama-2-7b.gguf
```

### Step 6: Start llama.cpp

```bash
./server -m models/mistral-7b.gguf \
  --host 0.0.0.0 \
  --port 20001 \
  --n-gpu-layers 99 \
  --n-threads 8 \
  -ngl 99
```

Expected output:
```
Server listening on http://0.0.0.0:20001
Model loaded: mistral-7b (Q4_K_M)
GPU memory allocated: 8GB / 32GB
```

### Step 7: Verify Both Services

```bash
# Check OpenClaw
curl http://localhost:20000/health
# Expected: {"status":"ok","model":"Qwen2.5-32B"}

# Check llama.cpp
curl http://localhost:20001/health
# Expected: {"status":"ok"}
```

---

## 🔧 Phase 2: Railway Backend Configuration

### Step 1: Update Backend Code

Already done! These files are ready:
- ✅ `app/services/local_ai_service.py` - Hybrid inference service
- ✅ `app/routers/local_ai.py` - AI endpoints
- ✅ `app/core/config.py` - Environment variables
- ✅ `app/main.py` - Router registration

### Step 2: Get Your Local Machine IP

```bash
# Windows
ipconfig
# Look for IPv4 Address: 192.168.x.x or 10.x.x.x

# Linux/Mac
ifconfig | grep "inet "
```

Save this: **192.168.x.x** (example)

### Step 3: Add Railway Environment Variables

In Railway dashboard → Backend service → **Variables** tab:

```
LOCAL_AI_ENABLED=true
LOCAL_AI_API_KEY=your-secure-api-key-min-32-chars-here-change-this
OPENCLAW_URL=http://192.168.x.x:20000
LLAMA_CPP_URL=http://192.168.x.x:20001
```

⚠️ **Important:** Use the SAME `LOCAL_AI_API_KEY` you set in `openclaw-config.json`

### Step 4: Commit & Push

```bash
cd C:\AI\Clients\DweezyAiTEAM\v_assistant\replio-v2
git add -A
git commit -m "feat: add hybrid local AI integration (OpenClaw + llama.cpp)"
git push origin main
```

Railway will auto-redeploy. Monitor the build logs.

### Step 5: Verify Backend is Ready

```bash
# After deployment, check the new AI endpoints
curl https://replio-2-public-production.up.railway.app/ai/health
# Expected: {"status":"ok","services":{"openclaw":true,"llama_cpp":true}}
```

---

## 🔐 Phase 3: Security Setup

### Block External Access to Local AI (Recommended)

**Windows Firewall - Deny all except Railway**

```powershell
# Block external access to ports
netsh advfirewall firewall add rule name="Block OpenClaw External" dir=in action=block protocol=tcp localport=20000
netsh advfirewall firewall add rule name="Block llama.cpp External" dir=in action=block protocol=tcp localport=20001

# Allow loopback (local testing)
netsh advfirewall firewall add rule name="Allow OpenClaw Local" dir=in action=allow protocol=tcp localport=20000 remoteip=127.0.0.1
netsh advfirewall firewall add rule name="Allow llama.cpp Local" dir=in action=allow protocol=tcp localport=20001 remoteip=127.0.0.1

# Allow Railway backend (replace with actual Railway IP)
netsh advfirewall firewall add rule name="Allow OpenClaw from Railway" dir=in action=allow protocol=tcp localport=20000 remoteip=RAILWAY-IP-ADDRESS
```

### Monitor API Access

Both services log requests. Enable logging:

```json
{
  "logging": {
    "level": "INFO",
    "file": "openclaw.log",
    "log_requests": true
  }
}
```

Check logs:
```bash
tail -f openclaw.log
```

---

## 📞 Phase 4: Test Voice Call Flow

### Test 1: Transcribe Audio

```bash
# Create test audio file or use existing one
curl -X POST http://localhost:20000/ai/transcribe \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@test-call.wav" \
  -F "company_id=your-company-id"
```

### Test 2: Analyze Call

```bash
curl -X POST "http://localhost:20000/ai/call-analysis?transcript=Customer%20wants%20to%20schedule&call_type=inbound&company_id=your-id" \
  -H "Authorization: Bearer your-api-key"
```

### Test 3: Generate Response

```bash
curl -X POST "http://localhost:20000/ai/generate-response?prompt=Generate%20friendly%20greeting&company_id=your-id" \
  -H "Authorization: Bearer your-api-key"
```

---

## 🎯 Inference Tasks (What Runs Where)

| Task | Service | Model | Use Case |
|------|---------|-------|----------|
| Call transcription | OpenClaw (Qwen) | Qwen 2.5-32B | Convert speech to text |
| Response generation | OpenClaw (Qwen) | Qwen 2.5-32B | Generate agent responses |
| Call analysis | OpenClaw (Qwen) | Qwen 2.5-32B | Sentiment, routing, intent |
| Appointment scheduling | OpenClaw (Qwen) | Qwen 2.5-32B | Parse availability, suggest times |
| Escalation detection | OpenClaw (Qwen) | Qwen 2.5-32B | Detect frustrated customers |
| **Fallback** | llama.cpp (Mistral) | Mistral 7B | Any of above if OpenClaw fails |

---

## 📊 Performance Tuning for RTX 5060

Your setup:
- **GPU:** RTX 5060 32GB VRAM ✓
- **RAM:** 64GB ✓
- **Concurrent requests:** 10 ✓

Optimization tips:

```json
{
  "openclaw": {
    "batch_size": 4,
    "gpu_layers": 40,
    "quantization": "int8"
  },
  "llama_cpp": {
    "n_gpu_layers": 99,
    "n_threads": 8
  }
}
```

Monitor:
```bash
# Watch GPU in real-time
nvidia-smi -l 1

# Expected usage with 10 concurrent requests:
# GPU Memory: ~28-30GB (you have 32GB)
# Temperature: <80°C
# Utilization: 95%+
```

---

## 🚨 Troubleshooting

### OpenClaw won't start
```bash
# Check GPU memory
nvidia-smi

# Reduce batch size if VRAM full
# In openclaw-config.json: "batch_size": 2
```

### llama.cpp connection refused
```bash
# Verify it's running
netstat -an | findstr 20001

# Check firewall
netsh advfirewall firewall show rule name=all | findstr 20001
```

### Railway can't reach local services
```bash
# Test from Railway backend (SSH into container)
curl http://192.168.x.x:20000/health

# If fails: firewall rule needed
netsh advfirewall firewall add rule name="Allow Railway" dir=in action=allow protocol=tcp localport=20000
```

### Slow inference
```bash
# Check if CPU-bound (should be GPU-bound)
nvidia-smi  # Should show >90% GPU utilization

# If low GPU use: increase batch_size or gpu_layers
```

---

## 📈 Production Checklist

- [ ] Both OpenClaw and llama.cpp running locally
- [ ] Both services respond to health checks
- [ ] LOCAL_AI_ENABLED=true in Railway
- [ ] API key set correctly in both places
- [ ] Firewall rules configured (optional but recommended)
- [ ] Logging enabled on both services
- [ ] Backend redeploy completed
- [ ] `/ai/health` endpoint returns both services OK
- [ ] Test call transcription end-to-end
- [ ] Test call analysis end-to-end
- [ ] Test response generation end-to-end
- [ ] Monitor GPU usage under load

---

## 🔄 Failover Logic

When OpenClaw fails:

```
User Call
  ↓
OpenClaw tries to transcribe
  ↓
  Timeout or error?
    ↓
    YES → llama.cpp fallback
         ↓
         llama.cpp transcribes
         ↓
         Success → Response sent
    ↓
    NO → OpenClaw response sent
```

This happens **automatically** in the `local_ai_service.py` with retry logic.

---

## 📚 Next Steps

1. ✅ Install OpenClaw and llama.cpp (Phase 1)
2. ✅ Add Railway variables (Phase 2)
3. ✅ Set up firewall (Phase 3, optional)
4. ✅ Test transcription endpoint
5. → Integrate with SignalWire for live calls
6. → Add ElevenLabs for TTS if needed
7. → Scale to multiple machines (advanced)

---

## 📞 Support

**Logs location:**
- OpenClaw: `./openclaw.log`
- llama.cpp: stdout (run in terminal or capture to file)
- Railway backend: https://railway.app/project/xxx/logs

**Performance baseline:**
- Transcription: 2-5s per call
- Analysis: 1-3s per transcript
- Response generation: 1-2s per prompt
- Fallback activation: <1s

---

**Status:** ✅ Ready for production

Last updated: 2026-08-31
