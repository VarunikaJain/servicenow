# Quick Start: Claude AI + ServiceNow via n8n

## Total Time: ~15 minutes

---

## Step 1: Get n8n Running (2 min)

**Fastest way - Docker:**
```bash
docker run -it --rm -p 5678:5678 n8nio/n8n
```
Open http://localhost:5678

**Or use n8n Cloud:** https://n8n.io (free trial)

---

## Step 2: Add Credentials (3 min)

### Claude API:
1. Settings → Credentials → Add → "Anthropic"
2. API Key: `sk-ant-xxxxx` (from console.anthropic.com)

### ServiceNow:
1. Settings → Credentials → Add → "HTTP Basic Auth"
2. Username: `your_sn_user`
3. Password: `your_sn_password`

---

## Step 3: Import Workflow (2 min)

1. Click **"..."** menu → **Import from File**
2. Select `05_Importable_Workflow.json`
3. **IMPORTANT:** Edit these:
   - In "Create in ServiceNow" node: Replace `YOUR-INSTANCE` with your ServiceNow instance
   - Link your credentials to the nodes

---

## Step 4: Test (2 min)

```bash
curl -X POST "http://localhost:5678/webhook/ai-servicenow" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create incident for email down"}'
```

**Response:**
```json
{
  "success": true,
  "table": "incident",
  "record_number": "INC0010001"
}
```

---

## That's It! 🎉

No code in ServiceNow. Just n8n handling everything.

---

## How It Works

```
Your App                    n8n                         ServiceNow
   │                         │                              │
   │  POST /webhook          │                              │
   │  {"prompt":"..."}       │                              │
   │ ───────────────────────►│                              │
   │                         │                              │
   │                         │  Call Claude AI              │
   │                         │  "What table/fields?"        │
   │                         │                              │
   │                         │  Claude returns:             │
   │                         │  {table:"incident",          │
   │                         │   fields:{...}}              │
   │                         │                              │
   │                         │  POST /api/now/table/incident│
   │                         │ ────────────────────────────►│
   │                         │                              │
   │                         │◄─────────────────────────────│
   │                         │  {"number":"INC0010001"}     │
   │                         │                              │
   │◄────────────────────────│                              │
   │  {"success":true,       │                              │
   │   "record":"INC0010001"}│                              │
```

---

## Common Use Cases

| Trigger | Example |
|---------|---------|
| Slack bot | `/create-incident email is down` |
| Email | Forward emails to create tickets |
| Web form | Simple form on your website |
| Chatbot | Integrate with any chat platform |
| Voice | Connect to speech-to-text first |

---

## Files in This Folder

| File | Description |
|------|-------------|
| `01_Prerequisites.md` | What you need before starting |
| `02_Setup_Credentials.md` | How to add API keys |
| `03_Build_Workflow.md` | Step-by-step workflow creation |
| `04_Test_Workflow.md` | Testing and debugging |
| `05_Importable_Workflow.json` | **Ready to import!** |
| `QUICK_START.md` | This file |
