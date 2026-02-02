# Step 1: Prerequisites

## What You Need

### 1. n8n Instance

**Option A: n8n Cloud (Easiest)**
- Go to https://n8n.io
- Sign up for free trial
- Your n8n will be at: `https://your-name.app.n8n.cloud`

**Option B: Self-Hosted (Free Forever)**
```bash
# Using Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Access at http://localhost:5678
```

**Option C: npm**
```bash
npm install n8n -g
n8n start
# Access at http://localhost:5678
```

---

### 2. Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Go to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

---

### 3. ServiceNow REST API Access

You need a ServiceNow user with these roles:
- `rest_api_explorer`
- `web_service_admin`
- Or admin role

**Test your access:**
```bash
curl -X GET "https://YOUR-INSTANCE.service-now.com/api/now/table/incident?sysparm_limit=1" \
  -u "username:password" \
  -H "Accept: application/json"
```

If you get JSON response, you're good!

---

## Checklist

- [ ] n8n running (cloud or self-hosted)
- [ ] Claude API key ready
- [ ] ServiceNow username/password with API access
- [ ] ServiceNow instance URL (e.g., `https://dev12345.service-now.com`)
