# n8n Integration: Claude AI + ServiceNow

## Why n8n?

✅ **No code needed in ServiceNow**  
✅ Visual workflow builder  
✅ Can be self-hosted (free) or cloud  
✅ Pre-built nodes for Claude AI and ServiceNow  

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Trigger   │ ───► │  Claude AI  │ ───► │   Parse     │ ───► │ ServiceNow  │
│  (Webhook/  │      │    Node     │      │  Response   │      │  REST API   │
│   Form/etc) │      │             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
     User                 AI                  n8n              Creates Record
    prompt            determines           extracts           (no SN code!)
                     table/fields          JSON
```

---

## Prerequisites

1. **n8n instance** - Self-hosted or n8n.cloud
2. **Claude API key** - From console.anthropic.com
3. **ServiceNow credentials** - Username/password with REST API access

---

## Step-by-Step Setup

### Step 1: Create ServiceNow Credentials in n8n

1. In n8n, go to **Credentials → Add Credential**
2. Search for **ServiceNow**
3. Enter:
   - Instance URL: `https://your-instance.service-now.com`
   - Username: your_username
   - Password: your_password

---

### Step 2: Create Anthropic (Claude) Credentials

1. **Credentials → Add Credential**
2. Search for **Anthropic**
3. Enter your API key

---

### Step 3: Build the Workflow

#### Node 1: Trigger (Webhook)

- **Type:** Webhook
- **Method:** POST
- **Path:** `/ai-command`

This creates a URL like: `https://your-n8n.com/webhook/ai-command`

---

#### Node 2: Anthropic (Claude AI)

- **Type:** Anthropic
- **Resource:** Message
- **Model:** claude-sonnet-4-20250514
- **System Prompt:**
```
Return ONLY JSON: {"table":"servicenow_table","fields":{"field":"value"}}
Tables: incident, change_request, problem, task
Example for "email is down": {"table":"incident","fields":{"short_description":"Email is down","urgency":"2","impact":"2"}}
```
- **User Message:** `{{ $json.body.prompt }}`

---

#### Node 3: Code Node (Parse JSON)

- **Type:** Code
- **JavaScript:**
```javascript
const aiResponse = $input.first().json.content[0].text;
const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]);

return {
  table: parsed.table,
  fields: parsed.fields
};
```

---

#### Node 4: ServiceNow (Create Record)

- **Type:** ServiceNow
- **Operation:** Create
- **Table:** `{{ $json.table }}`
- **Columns:**
  - Use "Add Field" for each field from `{{ $json.fields }}`

**OR use HTTP Request node for more control:**

- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://your-instance.service-now.com/api/now/table/{{ $json.table }}`
- **Authentication:** Basic Auth (ServiceNow credentials)
- **Body (JSON):**
```json
{{ $json.fields }}
```

---

#### Node 5: Respond to Webhook

- **Type:** Respond to Webhook
- **Response Body:**
```json
{
  "success": true,
  "record": "{{ $json.result.number }}"
}
```

---

## Complete Workflow JSON (Import Ready)

Copy and import this into n8n:

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-command"
      }
    },
    {
      "name": "Claude AI",
      "type": "@n8n/n8n-nodes-langchain.anthropic",
      "position": [450, 300],
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "systemMessage": "Return ONLY JSON: {\"table\":\"servicenow_table\",\"fields\":{\"field\":\"value\"}}. Tables: incident, change_request, problem, task.",
        "prompt": "={{ $json.body.prompt }}"
      }
    },
    {
      "name": "Parse Response",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const text = $input.first().json.content[0].text;\nconst parsed = JSON.parse(text.match(/{[\\s\\S]*}/)[0]);\nreturn { table: parsed.table, fields: parsed.fields };"
      }
    },
    {
      "name": "Create in ServiceNow",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "POST",
        "url": "=https://your-instance.service-now.com/api/now/table/{{ $json.table }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBasicAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": "={{ $json.fields }}"
        }
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1050, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"success\": true, \"number\": \"{{ $json.result.number }}\" }"
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Claude AI", "type": "main", "index": 0 }]] },
    "Claude AI": { "main": [[{ "node": "Parse Response", "type": "main", "index": 0 }]] },
    "Parse Response": { "main": [[{ "node": "Create in ServiceNow", "type": "main", "index": 0 }]] },
    "Create in ServiceNow": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  }
}
```

---

## Testing

Send a POST request to your webhook:

```bash
curl -X POST https://your-n8n.com/webhook/ai-command \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create an incident for email server being down"}'
```

**Response:**
```json
{
  "success": true,
  "number": "INC0010001"
}
```

---

## Trigger Options

Instead of Webhook, you can trigger from:

| Trigger | Use Case |
|---------|----------|
| Webhook | External apps, chatbots |
| Schedule | Periodic tasks |
| Email | Email to create records |
| Slack | Slack commands |
| Telegram | Chat bot |
| Form | Simple web form |

---

## Advantages of n8n Approach

| Feature | Flow Designer | n8n |
|---------|--------------|-----|
| Code in ServiceNow | Yes (Script Include or Script step) | **No** |
| Visual Builder | Yes | Yes |
| Cost | Included with ServiceNow | Free (self-hosted) |
| External Triggers | Limited | Many (Slack, Email, etc.) |
| Easy to modify | Moderate | Very Easy |

---

## Summary

With n8n, you need **ZERO custom code in ServiceNow**. n8n handles:
1. Calling Claude AI
2. Parsing the response
3. Calling ServiceNow REST API to create records

ServiceNow just receives standard REST API calls - no Script Includes or Flow Designer scripts needed!
