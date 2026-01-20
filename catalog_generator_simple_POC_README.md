# Simple Now Assist POC - Catalog Item Generator

## Overview

This is a **simplified POC** that integrates with Now Assist to create catalog items from natural language. Minimal code, easy to understand and deploy.

---

## What It Does

User types:
```
Create a catalog item with 5 variables and 2 mandatory
```

Now Assist:
- Understands the request
- Returns structured configuration
- System creates the catalog item automatically

---

## Files (Only 4 files!)

| File | Lines | Purpose |
|------|-------|---------|
| `catalog_generator_simple_POC_server_script.txt` | ~80 | Calls Now Assist API |
| `catalog_generator_simple_POC_client_script.txt` | ~40 | UI controller |
| `catalog_generator_simple_POC_html_template.txt` | ~50 | Simple form |
| `catalog_generator_simple_POC_CSS.txt` | ~100 | Basic styling |

**Total: ~270 lines** (vs 1400+ in complex version)

---

## Setup Steps (10 minutes)

### Step 1: Create Widget

1. Go to: `Service Portal > Widgets`
2. Click **New**
3. Name: `Catalog Item Generator POC`
4. Copy each file to its respective section:
   - Server Script → `catalog_generator_simple_POC_server_script.txt`
   - Client Controller → `catalog_generator_simple_POC_client_script.txt`
   - HTML Template → `catalog_generator_simple_POC_html_template.txt`
   - CSS → `catalog_generator_simple_POC_CSS.txt`
5. **Save**

### Step 2: Add to Page

1. Go to: `Service Portal > Pages`
2. Create new page or edit existing
3. Add your widget
4. Save

### Step 3: Test

1. Open the portal page
2. Type: "Create a catalog item with 5 variables and 2 mandatory"
3. Click "Create with Now Assist"
4. Done!

---

## How the Code Works

### Server Script (Simple Flow)

```
User Request
    ↓
callNowAssist(request)  ← Sends to Now Assist API
    ↓
AI returns JSON config
    ↓
createCatalogItem(config)  ← Creates records
    ↓
Return success
```

### Key Function - Now Assist Call

```javascript
var genAI = new sn_gen_ai.GenerativeAIService();
var response = genAI.generateText({
    messages: [
        { role: 'system', content: 'Parse request and return JSON...' },
        { role: 'user', content: userRequest }
    ]
});
```

That's it! Now Assist does the heavy lifting.

---

## Prerequisites

1. **Now Assist enabled** on your instance
2. **Generative AI plugin** activated (`sn_gen_ai`)
3. User has `catalog_admin` role

### Check if Now Assist is available:

```javascript
// Run in Scripts - Background
gs.info('Now Assist available: ' + (typeof sn_gen_ai !== 'undefined'));
```

---

## Customization

### Change the AI prompt (Server Script, line ~45):

```javascript
var systemPrompt = 'Your custom instructions here...';
```

### Add more variable types (Server Script, line ~75):

```javascript
var typeMap = { 
    'string': 6, 
    'choice': 5, 
    'reference': 8, 
    'date': 9,
    'integer': 4,  // Add more
    'email': 6 
};
```

---

## Demo Script

**For presenting the POC:**

1. "Let me show you how we can create catalog items using natural language"
2. Open the widget
3. Type: "Create a laptop request form with employee name, laptop model dropdown, and business justification - make first two mandatory"
4. Click Create
5. "In seconds, Now Assist understood our request and created the catalog item"
6. Click "Open Catalog Item" to show the result

---

## Comparison

| Version | Lines of Code | Setup Time | Features |
|---------|---------------|------------|----------|
| Complex POC | 1,400+ | 1 hour | Chat, preview, edit |
| **Simple POC** | **~270** | **10 min** | **Core functionality** |

---

## Troubleshooting

### "sn_gen_ai is not defined"
- Now Assist plugin not activated
- Ask admin to enable: `All > Now Assist > Administration`

### "Could not process request"
- Check system logs for API errors
- Verify Generative AI is configured
- Try simpler request first

### "Catalog item created but no variables"
- AI response may not have correct format
- Check server logs for parsed response

---

## Next Steps

After POC is successful:
1. Add input validation
2. Add preview before creation
3. Add more variable types
4. Add workflow attachment
5. Productionize with error handling
