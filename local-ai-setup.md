# Local AI Hybrid Setup for Replio

**Ports assigned by Port Gate Guard:**
- OpenClaw (Qwen models): **20000**
- llama.cpp (LLaMA models): **20001**

---

## Prerequisites

```bash
# Python 3.12+
python --version

# CUDA support for RTX 5060
nvidia-smi

# Git
git --version
```

---

## Installation & Setup

### 1. OpenClaw (Primary - Port 20000)

```bash
# Install OpenClaw
pip install openclaw

# Or clone from source (if you have custom models)
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pip install -e .
```

**Configuration file: `openclaw-config.json`**

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 20000,
    "api_key": "your-secure-api-key-here"
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
    "timeout_seconds": 30
  }
}
```

**Start OpenClaw:**

```bash
python -m openclaw.server --config openclaw-config.json
```

Or as a service:

```bash
# Windows - Create openclaw-start.bat
@echo off
cd path\to\openclaw
python -m openclaw.server --config openclaw-config.json
pause

# Then run it
openclaw-start.bat
```

---

### 2. llama.cpp (Fallback - Port 20001)

```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Build with CUDA support (for RTX 5060)
make LLAMA_CUDA=1
```

**Download LLaMA model (quantized for efficiency):**

```bash
# Download Llama 2 7B Q4 (4-bit quantized, ~4GB)
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf

# Or Mistral 7B (better performance)
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf
```

**Start llama.cpp server:**

```bash
# Linux/Mac
./server -m models/mistral-7b-instruct-v0.2.Q4_K_M.gguf \
  --host 0.0.0.0 \
  --port 20001 \
  --n-gpu-layers 99 \
  --n-threads 8 \
  -ngl 99

# Windows
server.exe -m models\mistral-7b-instruct-v0.2.Q4_K_M.gguf ^
  --host 0.0.0.0 ^
  --port 20001 ^
  --n-gpu-layers 99 ^
  --n-threads 8 ^
  -ngl 99
```

Or as a service:

```bash
# Windows - Create llama-start.bat
@echo off
cd path\to\llama.cpp
server.exe -m models\mistral-7b-instruct-v0.2.Q4_K_M.gguf --host 0.0.0.0 --port 20001 --n-gpu-layers 99 -ngl 99
pause

# Then run it
llama-start.bat
```

---

## Testing Locally

```bash
# Test OpenClaw health
curl http://localhost:20000/health

# Test llama.cpp health
curl http://localhost:20001/health

# Test OpenClaw completion
curl -X POST http://localhost:20000/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "prompt": "Hello, how are you?",
    "max_tokens": 50
  }'

# Test llama.cpp completion
curl -X POST http://localhost:20001/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, how are you?",
    "max_tokens": 50
  }'
```

---

## Hardware Optimization (RTX 5060)

Your RTX 5060 has 32GB VRAM, which is excellent. Optimization tips:

```bash
# OpenClaw: Enable GPU offloading
# In openclaw-config.json:
"device": "cuda",
"gpu_layers": 40,  # Number of layers to offload to GPU

# llama.cpp: Use all GPU layers
# -ngl 99 (offload 99 layers to GPU)
# --n-gpu-layers 99

# Monitor GPU usage
nvidia-smi -l 1  # Refresh every 1 second
```

---

## Environment Variables for Railway

Set these in Railway backend service **Variables**:

```
LOCAL_AI_ENABLED=true
LOCAL_AI_API_KEY=your-secure-api-key-here
OPENCLAW_URL=http://your-machine-local-ip:20000
LLAMA_CPP_URL=http://your-machine-local-ip:20001
```

**To get your local IP:**
```bash
# Linux/Mac
ifconfig | grep "inet "

# Windows
ipconfig

# Use the IPv4 address (e.g., 192.168.x.x or 10.x.x.x)
```

---

## Networking & Security

### Keep services local-only (recommended):

**Windows Firewall - Block external access:**

```powershell
# Block port 20000 from internet
netsh advfirewall firewall add rule name="Block OpenClaw" dir=in action=block protocol=tcp localport=20000

# Block port 20001 from internet
netsh advfirewall firewall add rule name="Block llama.cpp" dir=in action=block protocol=tcp localport=20001

# Allow only Railway backend (if Railway has fixed IP)
netsh advfirewall firewall add rule name="Allow Railway to OpenClaw" dir=in action=allow protocol=tcp localport=20000 remoteip=RAILWAY-IP
```

### Alternative: Use a secure tunnel

If you want Railway to reach local services securely:

```bash
# Use ngrok for tunneling (temporary testing only)
ngrok http 20000  # Exposes OpenClaw publicly
ngrok http 20001  # Exposes llama.cpp publicly

# Then use ngrok URLs in Railway variables
OPENCLAW_URL=https://abcd-123.ngrok.io
LLAMA_CPP_URL=https://efgh-456.ngrok.io
```

---

## Production Considerations

1. **Run as system service** (not just terminal windows)
2. **Monitor GPU/Memory** (RTX 5060 can get saturated with 10 concurrent requests)
3. **API key rotation** (change `LOCAL_AI_API_KEY` monthly)
4. **Logging** (enable request/response logging)
5. **Failover** (if OpenClaw dies, llama.cpp handles it)
6. **Updates** (keep models and inference engines updated)

---

## Troubleshooting

**OpenClaw fails to start:**
```bash
# Check GPU memory
nvidia-smi

# Reduce batch size in config if VRAM is full
"batch_size": 2  # Lower from 4
```

**llama.cpp connection refused:**
```bash
# Check if port 20001 is in use
netstat -an | findstr 20001

# Check firewall rules
netsh advfirewall firewall show rule name=all | findstr 20001
```

**Railway can't reach local services:**
- Make sure both services are running: `curl http://localhost:20000/health`
- Verify firewall allows Railway IP
- Use ngrok for testing public access

---

## Next Steps

1. ✅ Install OpenClaw and llama.cpp locally
2. ✅ Start both services on assigned ports
3. ✅ Test health checks
4. ✅ Set Railway environment variables
5. ✅ Redeploy Railway backend
6. ✅ Test call transcription and AI responses
