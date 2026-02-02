# Step 3: Build the Workflow

## Overview

We'll create 5 nodes:

```
[1. Webhook] → [2. Claude AI] → [3. Parse JSON] → [4. ServiceNow] → [5. Response]
```

---

## Node 1: Webhook (Trigger)

1. Click **+ Add first step**
2. Search for **"Webhook"**
3. Configure:
   - **HTTP Method:** POST
   - **Path:** `ai-servicenow`

4. Click **Listen for Test Event** (we'll test later)

**Your webhook URL will be:**
```
https://your-n8n-instance/webhook/ai-servicenow
```

---

## Node 2: Anthropic (Claude AI)

1. Click **+** after Webhook
2. Search for **"Anthropic"**
3. Select **"Message a Model"**
4. Configure:

**Credential:** Select "Claude API" (created earlier)

**Model:** `claude-sonnet-4-20250514`

**System Prompt (copy exactly):**
```
You are a ServiceNow assistant. Based on user requests, return ONLY valid JSON (no other text).

FORMAT:
{"action":"CREATE","table":"table_name","fields":{"field1":"value1","field2":"value2"}}

TABLES AND FIELDS:
- incident: short_description, description, urgency (1=High,2=Medium,3=Low), impact (1,2,3), category
- change_request: short_description, description, type (normal/standard/emergency), risk (high/moderate/low)
- problem: short_description, description, urgency, impact, category
- task: short_description, description, priority (1-5)
- sc_req_item: short_description, quantity

EXAMPLES:
User: "email is down" → {"action":"CREATE","table":"incident","fields":{"short_description":"Email is down","description":"User reported email not working","urgency":"2","impact":"2","category":"software"}}
User: "need new laptop" → {"action":"CREATE","table":"sc_req_item","fields":{"short_description":"New laptop request","quantity":"1"}}
User: "server upgrade change" → {"action":"CREATE","table":"change_request","fields":{"short_description":"Server upgrade","description":"Upgrade production server","type":"normal"}}
```

**User Message:**
```
{{ $json.body.prompt }}
```

---

## Node 3: Code (Parse AI Response)

1. Click **+** after Anthropic
2. Search for **"Code"**
3. Select **JavaScript**
4. Paste this code:

```javascript
// Get the AI response text
const aiResponse = $input.first().json.message.content[0].text;

// Extract JSON from response
const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

if (!jsonMatch) {
  throw new Error('No JSON found in AI response');
}

const parsed = JSON.parse(jsonMatch[0]);

// Return table and fields for ServiceNow
return {
  json: {
    table: parsed.table,
    fields: parsed.fields,
    action: parsed.action
  }
};
```

---

## Node 4: HTTP Request (Create in ServiceNow)

1. Click **+** after Code
2. Search for **"HTTP Request"**
3. Configure:

**Method:** POST

**URL:**
```
https://YOUR-INSTANCE.service-now.com/api/now/table/{{ $json.table }}
```
⚠️ Replace `YOUR-INSTANCE` with your actual instance name!

**Authentication:** 
- Select **Predefined Credential Type**
- Type: **HTTP Basic Auth**
- Credential: Select your ServiceNow credential

**Headers:**
| Name | Value |
|------|-------|
| Content-Type | application/json |
| Accept | application/json |

**Body:**
- Select **JSON**
- Paste:
```
{{ $json.fields }}
```

---

## Node 5: Respond to Webhook

1. Click **+** after HTTP Request
2. Search for **"Respond to Webhook"**
3. Configure:

**Respond With:** JSON

**Response Body:**
```json
{
  "success": true,
  "table": "{{ $('Code').item.json.table }}",
  "record_number": "{{ $json.body.result.number }}",
  "sys_id": "{{ $json.body.result.sys_id }}",
  "message": "Record created successfully"
}
```

---

## Final Workflow Layout

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Webhook   │───►│  Anthropic  │───►│    Code     │───►│HTTP Request │───►│  Respond    │
│             │    │  (Claude)   │    │(Parse JSON) │    │(ServiceNow) │    │             │
│ POST        │    │             │    │             │    │             │    │ Return      │
│ /ai-service │    │ Returns     │    │ Extracts    │    │ POST to     │    │ result      │
│ now         │    │ JSON        │    │ table +     │    │ /api/now/   │    │             │
│             │    │             │    │ fields      │    │ table/xxx   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Save and Activate

1. Click **Save** (top right)
2. Toggle **Active** to ON
3. Your workflow is now live!
