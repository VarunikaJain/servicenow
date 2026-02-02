# Minimum Setup Guide - Claude AI ServiceNow Integration

## 3 Steps to Get Started

### Step 1: Store API Key
```
Navigate to: System Properties > All Properties > New
Name: x_your_scope.claude_api_key
Value: sk-ant-xxxxx (your Claude API key)
Type: string
Private: ✓ checked
```

### Step 2: Create Script Include
```
Navigate to: System Definition > Script Includes > New
Name: ClaudeAIHelper
Client callable: unchecked
Script: [paste contents of ClaudeAIHelper_ScriptInclude.js]
```

### Step 3: Test It
```
Navigate to: System Definition > Scripts - Background
Paste and run:

var helper = new ClaudeAIHelper();
var result = helper.processPrompt("Create an incident for email not working", gs.getUserID());
gs.info(JSON.stringify(result));
```

---

## Using with Flow Designer

1. Create new Action in Flow Designer
2. Add inputs: `prompt` (String), `user_id` (String)
3. Add outputs: `success`, `message`, `record_number`, `record_sys_id`
4. Add Script step with code from `FlowDesigner_Action.js`
5. Use this action in any flow triggered by catalog item, record creation, etc.

---

## Example Prompts That Work

| Say This | Creates |
|----------|---------|
| "Create an incident for email server down" | Incident |
| "I need a new laptop" | Catalog Request |
| "Create a change request to upgrade the server" | Change Request |
| "Show me my open incidents" | Query results |

---

## Files

| File | What It Is |
|------|------------|
| `ClaudeAIHelper_ScriptInclude.js` | **Required** - The main script include |
| `FlowDesigner_Action.js` | Flow Designer action code |
| `REST_API_Resource.js` | Optional REST API for external calls |
| `Test_BackgroundScript.js` | Test script to verify setup |
