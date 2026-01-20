# ServiceNow Catalog Item Generator POC - Now Assist Version

## Overview

This enhanced POC uses **Now Assist** (ServiceNow's Generative AI) to intelligently parse natural language and generate catalog items. Unlike regex-based parsing, Now Assist understands context, handles variations, and provides more accurate results.

---

## Now Assist vs Custom NLP Comparison

| Feature | Custom Regex POC | Now Assist POC |
|---------|------------------|----------------|
| Language Understanding | Pattern matching only | Full NLU with context |
| Input Flexibility | Limited patterns | Understands variations |
| Error Handling | Basic validation | AI-guided corrections |
| Suggestions | None | Smart recommendations |
| Learning | Static | Improves over time |
| Setup Complexity | Simple | Requires Now Assist license |

---

## Prerequisites

1. **Now Assist License**: Your instance must have Now Assist enabled
2. **Generative AI Controller**: Must be configured in your instance
3. **Skills Configuration**: Catalog generation skill must be activated
4. **Roles Required**:
   - `admin` or `now_assist_admin`
   - `catalog_admin`

---

## Architecture with Now Assist

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  (Service Portal Widget)                                         │
│                                                                   │
│  User: "Create a catalog item for laptop requests with           │
│         employee name, laptop model dropdown, justification,     │
│         manager approval, and delivery date - make the first     │
│         three mandatory"                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Now Assist Layer                             │
│  (Generative AI Controller)                                      │
│                                                                   │
│  1. Send prompt to Now Assist API                                │
│  2. AI understands intent and extracts structured data           │
│  3. Returns JSON configuration with:                             │
│     - Item name, description                                     │
│     - Variable names, types, labels                              │
│     - Mandatory flags                                            │
│     - Suggested category                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Catalog Item Generator                          │
│  (Server Script using GlideRecord)                               │
│                                                                   │
│  Creates records in:                                             │
│  • sc_cat_item (Catalog Items)                                   │
│  • item_option_new (Variables)                                   │
│  • question_choice (Dropdown options)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Now Assist Improves the POC

### 1. Intelligent Variable Detection

**User Input:**
> "I need a form for requesting office supplies with fields for employee, department, items needed, quantity, and urgency level"

**Now Assist Understands:**
- "employee" → Reference field to sys_user
- "department" → Reference field to cmn_department
- "items needed" → Multi-line text
- "quantity" → Integer field
- "urgency level" → Dropdown with Low/Medium/High

### 2. Context-Aware Suggestions

Now Assist can suggest:
- Appropriate variable types based on field names
- Related catalog categories
- Similar existing catalog items
- Best practices for form design

### 3. Natural Conversation

Users can have a conversation:
- "Create a laptop request form"
- "Add a field for preferred brand"
- "Make the justification mandatory"
- "Add approval workflow"

---

## Implementation Steps

### Step 1: Enable Now Assist

1. Navigate to **Now Assist > Administration > Settings**
2. Ensure Generative AI is enabled
3. Configure the AI provider (OpenAI, Azure OpenAI, or ServiceNow LLM)

### Step 2: Create Custom Skill (Optional)

1. Navigate to **Now Assist > Skills**
2. Create new skill: "Catalog Item Generator"
3. Configure the skill prompt template
4. Set up input/output mappings

### Step 3: Deploy the Widget

1. Create the Service Portal widget
2. Copy the Now Assist integrated scripts
3. Configure API permissions

---

## API Integration Points

### Now Assist API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/now/assist/generate` | Generate AI response |
| `/api/now/assist/chat` | Conversational interface |
| `/api/now/table/sys_cs_skill` | Manage skills |

### Sample API Call

```javascript
var request = new sn_ws.RESTMessageV2();
request.setEndpoint(gs.getProperty('glide.servlet.uri') + 'api/now/assist/generate');
request.setHttpMethod('POST');
request.setRequestBody(JSON.stringify({
    prompt: userInput,
    skill_id: 'catalog_generator_skill',
    context: {
        intent: 'create_catalog_item'
    }
}));
```

---

## Files Included

| File | Purpose |
|------|---------|
| `catalog_item_generator_now_assist_server_script.txt` | Server script with Now Assist integration |
| `catalog_item_generator_now_assist_client_script.txt` | Enhanced client controller |
| `catalog_item_generator_now_assist_html_template.txt` | Updated HTML with chat interface |
| `catalog_item_generator_now_assist_skill_config.txt` | Now Assist skill configuration |

---

## Benefits of Using Now Assist

1. **Better Accuracy**: AI understands intent, not just patterns
2. **Flexibility**: Handles varied phrasings and languages
3. **Intelligence**: Suggests appropriate field types automatically
4. **Conversation**: Supports iterative refinement
5. **Enterprise Ready**: Built-in security and governance
6. **Scalable**: Handles complex requests easily

---

## Limitations

1. Requires Now Assist license (additional cost)
2. Depends on AI service availability
3. Response time may vary based on complexity
4. Requires proper prompt engineering for best results

---

## Next Steps

1. Review the provided scripts
2. Configure Now Assist in your instance
3. Test with sample prompts
4. Customize the skill for your organization's needs
