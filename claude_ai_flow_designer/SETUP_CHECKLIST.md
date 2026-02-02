# Complete Setup Checklist

## Prerequisites
- [ ] Get Claude API key from https://console.anthropic.com/

---

## Step 1: Store API Key (1 minute)
- [ ] Go to **System Properties → New**
- [ ] Name: `claude_api_key`
- [ ] Value: `sk-ant-xxxxx` (your key)
- [ ] Private: ✓ checked
- [ ] Save

---

## Step 2: Create Action (5 minutes)
- [ ] Go to **Flow Designer → Actions → New**
- [ ] Name: `Process AI Command`
- [ ] Add Input: `prompt` (String, Required)
- [ ] Add Input: `user_id` (String, Required)
- [ ] Add Output: `success` (True/False)
- [ ] Add Output: `record_number` (String)
- [ ] Add Output: `message` (String)
- [ ] Add Script step → Paste code from `Step2_Action_Script.js`
- [ ] Publish

---

## Step 3: Create Flow (5 minutes)
- [ ] Go to **Flow Designer → Flows → New**
- [ ] Name: `AI Command Processor`
- [ ] Add Trigger (choose one):
  - [ ] Service Catalog (need to create catalog item with `prompt` variable)
  - [ ] Record Created on custom table
  - [ ] REST API trigger
- [ ] Add Action: `Process AI Command`
- [ ] Map inputs from trigger
- [ ] Activate

---

## Step 4: Test
- [ ] Submit catalog request with prompt "Create an incident for VPN not working"
- [ ] Check if incident was created

---

# Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOW DESIGNER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │   TRIGGER   │  ← Service Catalog / Record Created / REST    │
│   │             │                                               │
│   │ prompt      │                                               │
│   │ user_id     │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────────┐               │
│   │   ACTION: Process AI Command                │               │
│   │                                             │               │
│   │   1. Call Claude API (api.anthropic.com)   │               │
│   │   2. Claude returns: {table, fields}       │               │
│   │   3. GlideRecord creates the record        │               │
│   │                                             │               │
│   │   Outputs:                                  │               │
│   │   - success                                │               │
│   │   - record_number (INC0010001)             │               │
│   │   - message                                │               │
│   └──────┬──────────────────────────────────────┘               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │   RESPONSE  │  ← Update record / Send email / Return REST   │
│   └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Example Prompts to Test

| User Says | AI Creates |
|-----------|------------|
| "Create incident for email down" | Incident |
| "I need a new laptop" | Catalog Request |
| "Create change to upgrade server" | Change Request |
| "Log a problem for database issues" | Problem |
| "Show my open incidents" | Query results |
