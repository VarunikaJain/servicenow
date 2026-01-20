# How to Enable Generative AI in Now Assist

## Step-by-Step Guide

---

## Step 1: Access Now Assist Administration

1. Log in to your ServiceNow instance as **admin**
2. In the Navigator (left sidebar), type: `Now Assist`
3. Click on: **Now Assist > Administration > Settings**

```
Navigation Path:
All > Now Assist > Administration > Settings
```

---

## Step 2: Enable Now Assist

On the Settings page:

1. Find **"Now Assist"** toggle
2. **Turn it ON**
3. Click **Save**

---

## Step 3: Configure Generative AI Provider

### Option A: ServiceNow LLM (Recommended for POC)

1. Go to: `Now Assist > Administration > Generative AI Controller`
2. Look for **"Large Language Model Configuration"**
3. Select: **ServiceNow LLM** (built-in, no external setup needed)
4. Click **Save**

### Option B: Azure OpenAI

1. Go to: `Now Assist > Administration > Generative AI Controller`
2. Click **New** to create a configuration
3. Fill in:
   - **Name**: Azure OpenAI Connection
   - **Provider**: Azure OpenAI
   - **Endpoint URL**: `https://your-resource.openai.azure.com/`
   - **API Key**: Your Azure OpenAI API key
   - **Deployment Name**: Your model deployment name (e.g., gpt-4)
   - **API Version**: `2023-05-15` (or latest)
4. Click **Save**
5. Click **Test Connection**

### Option C: OpenAI Direct

1. Go to: `Now Assist > Administration > Generative AI Controller`
2. Click **New**
3. Fill in:
   - **Name**: OpenAI Connection
   - **Provider**: OpenAI
   - **API Key**: Your OpenAI API key
   - **Model**: gpt-4 or gpt-3.5-turbo
4. Click **Save**
5. Click **Test Connection**

---

## Step 4: Activate Required Plugins

Navigate to: `All > System Definition > Plugins`

Search and activate these plugins:

| Plugin ID | Plugin Name | Purpose |
|-----------|-------------|---------|
| `com.snc.now_assist` | Now Assist | Core Now Assist functionality |
| `sn_gen_ai` | Generative AI | AI capabilities |
| `com.snc.now_assist_creator` | Now Assist for Creator | For App Engine Studio |

### To Activate a Plugin:

1. Search for the plugin
2. Click on it
3. Click **Activate**
4. Wait for activation to complete (may take a few minutes)

---

## Step 5: Verify Setup

### Test 1: Check Plugin Status

```
Navigation: All > System Definition > Plugins
Search: now_assist
Status should be: Active
```

### Test 2: Run Background Script

Go to: `All > System Definition > Scripts - Background`

Run this script:

```javascript
// Check if Now Assist is available
try {
    var genAI = new sn_gen_ai.GenerativeAIService();
    gs.info('SUCCESS: Generative AI service is available');
} catch (e) {
    gs.info('ERROR: ' + e.message);
}
```

Expected output: `SUCCESS: Generative AI service is available`

### Test 3: Try Now Assist in App Engine Studio

1. Open **App Engine Studio**
2. Look for the **sparkle icon** (Now Assist)
3. If visible, Now Assist is enabled!

---

## Step 6: Set User Permissions

Users need these roles to use Now Assist:

| Role | Purpose |
|------|---------|
| `now_assist_user` | Basic Now Assist access |
| `now_assist_admin` | Administer Now Assist |
| `sn_gen_ai_user` | Use Generative AI APIs |

### Assign Role to User:

1. Go to: `All > User Administration > Users`
2. Find the user
3. Scroll to **Roles** related list
4. Click **Edit**
5. Add required roles
6. Click **Save**

---

## Quick Reference: Navigation Paths

| What | Where |
|------|-------|
| Now Assist Settings | `All > Now Assist > Administration > Settings` |
| Generative AI Config | `All > Now Assist > Administration > Generative AI Controller` |
| Plugins | `All > System Definition > Plugins` |
| User Roles | `All > User Administration > Users` |
| Background Scripts | `All > System Definition > Scripts - Background` |

---

## Troubleshooting

### "Now Assist menu not visible"

- Plugin not activated
- User doesn't have admin role
- Try: `All > Plugins` and search for "now_assist"

### "Generative AI option not available"

- Instance version too old (need Vancouver or later)
- `sn_gen_ai` plugin not activated
- Contact ServiceNow support

### "API Connection Failed"

- Check API key is correct
- Verify endpoint URL
- Check network/firewall allows connection
- Test credentials outside ServiceNow first

### "Permission Denied"

- User missing `now_assist_admin` role
- User missing `sn_gen_ai_user` role
- Check ACLs on Now Assist tables

---

## Version Requirements

| Feature | Minimum Version |
|---------|-----------------|
| Now Assist | Vancouver (V) |
| Generative AI Controller | Vancouver (V) |
| Now Assist for Creator | Washington DC (W) |

---

## Summary Checklist

- [ ] Logged in as admin
- [ ] Now Assist plugin activated
- [ ] Generative AI plugin activated
- [ ] Now Assist enabled in Settings
- [ ] AI Provider configured (ServiceNow LLM / Azure / OpenAI)
- [ ] Connection tested successfully
- [ ] User roles assigned
- [ ] Verified with background script

---

## Screenshots Reference

### Settings Page Location:
```
┌─────────────────────────────────────────────┐
│  ServiceNow Navigator                       │
│  ├── Now Assist                             │
│  │   ├── Administration                     │
│  │   │   ├── Settings  ◄─── Click here     │
│  │   │   ├── Generative AI Controller       │
│  │   │   └── Skills                         │
└─────────────────────────────────────────────┘
```

### Settings Page Options:
```
┌─────────────────────────────────────────────┐
│  Now Assist Settings                        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Now Assist         [====ON====]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Generative AI      [====ON====]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save]                                     │
└─────────────────────────────────────────────┘
```

---

## Need Help?

- ServiceNow Docs: https://docs.servicenow.com/now-assist
- Community: https://community.servicenow.com
- Support: Contact your ServiceNow admin or raise a support ticket
