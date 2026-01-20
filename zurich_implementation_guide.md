# Catalog Item Generator POC - Zurich Implementation Guide

## Your Environment
- **Instance**: ServiceNow Zurich
- **Now Assist**: Already installed
- **Generative AI**: Already installed

---

## Part 1: API Key Setup

### Step 1: Access Generative AI Controller

```
Navigation: All > Now Assist > Administration > Generative AI Controller
```

Or search for: `sys_genai_controller.LIST`

### Step 2: Create/Edit LLM Configuration

1. Click **"LLM Configurations"** (or navigate to `sys_genai_llm_config.LIST`)
2. Click **New** (or edit existing)

### Step 3: Configure Your AI Provider

#### Option A: Azure OpenAI (Recommended for Enterprise)

| Field | Value |
|-------|-------|
| Name | `Azure OpenAI Production` |
| Active | ✓ Checked |
| Provider | `Azure OpenAI` |
| Endpoint URL | `https://YOUR-RESOURCE.openai.azure.com/` |
| API Key | Your Azure OpenAI API key |
| API Version | `2024-02-15-preview` |
| Deployment Name | Your deployment (e.g., `gpt-4`, `gpt-35-turbo`) |

**To get Azure OpenAI credentials:**
1. Go to Azure Portal → Azure OpenAI resource
2. Click "Keys and Endpoint"
3. Copy Key 1 and Endpoint

#### Option B: OpenAI Direct

| Field | Value |
|-------|-------|
| Name | `OpenAI Direct` |
| Active | ✓ Checked |
| Provider | `OpenAI` |
| API Key | Your OpenAI API key (starts with `sk-`) |
| Model | `gpt-4` or `gpt-3.5-turbo` |

**To get OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

#### Option C: ServiceNow LLM (If Available)

| Field | Value |
|-------|-------|
| Name | `ServiceNow LLM` |
| Active | ✓ Checked |
| Provider | `ServiceNow` |

No API key needed - uses ServiceNow's built-in LLM.

### Step 4: Test Connection

1. After saving, click **"Test Connection"** button
2. Should show: "Connection successful"

### Step 5: Set as Default (Optional)

1. Go to: `All > Now Assist > Administration > Settings`
2. Under "Generative AI", select your configuration as default

---

## Part 2: Create the Widget

### Step 1: Navigate to Widget Editor

```
Navigation: All > Service Portal > Widgets
```

### Step 2: Create New Widget

Click **New** and fill in:

| Field | Value |
|-------|-------|
| Name | `Catalog Item Generator POC` |
| ID | `catalog-item-generator-poc` |
| Description | `POC for generating catalog items using Now Assist` |

### Step 3: Copy the Code

Copy each section below into the corresponding widget tab:

---

## Part 3: Widget Code for Zurich

### Server Script

```javascript
(function() {
    /*
     * Catalog Item Generator POC - Zurich Version
     * Uses Now Assist Generative AI
     */

    data.message = '';
    data.success = false;
    data.catalogItem = null;
    data.debug = [];

    // Handle create action
    if (input && input.action === 'create') {
        var result = createCatalogWithAI(input.userRequest);
        data.success = result.success;
        data.message = result.message;
        data.catalogItem = result.catalogItem;
        data.debug = result.debug;
        data.aiResponse = result.aiResponse;
    }

    /**
     * Main function to create catalog item using AI
     */
    function createCatalogWithAI(userRequest) {
        var result = {
            success: false,
            message: '',
            catalogItem: null,
            debug: [],
            aiResponse: null
        };

        try {
            // Call Generative AI
            result.debug.push('Calling Now Assist AI...');
            var aiResponse = callGenerativeAI(userRequest);
            
            if (!aiResponse) {
                result.message = 'Could not get AI response. Check Generative AI configuration.';
                return result;
            }

            result.debug.push('AI Response received');
            result.aiResponse = aiResponse;

            // Parse AI response
            var config = parseAIResponse(aiResponse);
            
            if (!config || !config.name) {
                result.message = 'Could not parse AI response';
                result.debug.push('Parse failed: ' + JSON.stringify(aiResponse));
                return result;
            }

            result.debug.push('Creating catalog item: ' + config.name);

            // Create catalog item
            var itemSysId = createCatalogItemRecord(config);
            
            if (!itemSysId) {
                result.message = 'Failed to create catalog item record';
                return result;
            }

            // Create variables
            var varCount = createVariables(itemSysId, config.variables || []);
            result.debug.push('Created ' + varCount + ' variables');

            // Success
            result.success = true;
            result.message = 'Created "' + config.name + '" with ' + varCount + ' variables';
            result.catalogItem = {
                sys_id: itemSysId,
                name: config.name,
                variables: varCount
            };

        } catch (e) {
            result.message = 'Error: ' + e.message;
            result.debug.push('Exception: ' + e.message);
            gs.error('Catalog Generator POC Error: ' + e.message);
        }

        return result;
    }

    /**
     * Call Generative AI Service (Zurich API)
     */
    function callGenerativeAI(userRequest) {
        var systemPrompt = getSystemPrompt();
        
        try {
            // Method 1: Zurich Generative AI Service
            var genAIService = new sn_gen_ai.GenerativeAIService();
            
            var payload = {
                "messages": [
                    {"role": "system", "content": systemPrompt},
                    {"role": "user", "content": userRequest}
                ],
                "temperature": 0.3,
                "max_tokens": 2000
            };

            var response = genAIService.generateText(JSON.stringify(payload));
            
            if (response) {
                // Handle different response formats
                if (typeof response === 'string') {
                    return response;
                } else if (response.choices && response.choices.length > 0) {
                    return response.choices[0].message.content;
                } else if (response.result) {
                    return response.result;
                }
                return response;
            }
        } catch (e1) {
            gs.info('Method 1 failed: ' + e1.message);
        }

        try {
            // Method 2: Use GlideAIService (alternative Zurich API)
            var aiService = new sn_gen_ai.GlideAIService();
            var result = aiService.chat(systemPrompt, userRequest);
            if (result) {
                return result;
            }
        } catch (e2) {
            gs.info('Method 2 failed: ' + e2.message);
        }

        try {
            // Method 3: REST API call to internal endpoint
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint(gs.getProperty('glide.servlet.uri') + 'api/sn_gen_ai/generate');
            request.setHttpMethod('POST');
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestBody(JSON.stringify({
                system_prompt: systemPrompt,
                user_prompt: userRequest
            }));
            
            var response = request.execute();
            if (response.getStatusCode() == 200) {
                var body = JSON.parse(response.getBody());
                return body.result || body.response || body;
            }
        } catch (e3) {
            gs.info('Method 3 failed: ' + e3.message);
        }

        return null;
    }

    /**
     * System prompt for AI
     */
    function getSystemPrompt() {
        return `You are a ServiceNow catalog item configuration assistant.
        
Parse the user's request and return a JSON object with this exact structure:
{
    "name": "Catalog Item Name",
    "description": "Brief description",
    "variables": [
        {
            "name": "variable_name",
            "label": "Display Label",
            "type": "string",
            "mandatory": true
        }
    ]
}

Variable types can be: string, text, choice, reference, date, checkbox, integer

Rules:
- Generate meaningful variable names in snake_case
- Create user-friendly labels
- Mark fields as mandatory if user says "required" or "mandatory"
- Default to "string" type if not specified
- Return ONLY valid JSON, no other text`;
    }

    /**
     * Parse AI response to extract config
     */
    function parseAIResponse(aiResponse) {
        try {
            var jsonStr = aiResponse;
            
            // Handle if response is already an object
            if (typeof aiResponse === 'object') {
                return aiResponse;
            }
            
            // Remove markdown code blocks
            jsonStr = jsonStr.replace(/```json\s*/gi, '');
            jsonStr = jsonStr.replace(/```\s*/gi, '');
            jsonStr = jsonStr.trim();
            
            // Find JSON in response
            var jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            
            return JSON.parse(jsonStr);
        } catch (e) {
            gs.error('Parse error: ' + e.message + ' | Response: ' + aiResponse);
            return null;
        }
    }

    /**
     * Create catalog item record
     */
    function createCatalogItemRecord(config) {
        var gr = new GlideRecord('sc_cat_item');
        gr.initialize();
        gr.name = config.name || 'Generated Catalog Item';
        gr.short_description = config.description || config.name;
        gr.description = 'Generated by Now Assist POC\n' + (config.description || '');
        gr.active = true;
        
        return gr.insert();
    }

    /**
     * Create variables for catalog item
     */
    function createVariables(itemSysId, variables) {
        var typeMap = {
            'string': 6,    // Single Line Text
            'text': 2,      // Multi Line Text  
            'choice': 5,    // Select Box
            'dropdown': 5,  // Select Box
            'reference': 8, // Reference
            'date': 9,      // Date
            'checkbox': 7,  // Checkbox
            'boolean': 7,   // Checkbox
            'integer': 4,   // Integer
            'number': 4     // Integer
        };

        var count = 0;
        for (var i = 0; i < variables.length; i++) {
            var v = variables[i];
            
            var gr = new GlideRecord('item_option_new');
            gr.initialize();
            gr.name = v.name || 'variable_' + (i + 1);
            gr.question_text = v.label || v.name || 'Variable ' + (i + 1);
            gr.cat_item = itemSysId;
            gr.type = typeMap[v.type] || typeMap['string'];
            gr.mandatory = v.mandatory === true;
            gr.order = (i + 1) * 100;
            gr.active = true;
            
            if (gr.insert()) {
                count++;
            }
        }
        
        return count;
    }

})();
```

### Client Controller

```javascript
api.controller = function($scope, spUtil) {
    var c = this;

    // State
    c.userRequest = '';
    c.isLoading = false;
    c.result = null;
    c.showDebug = false;

    // Sample prompts
    c.samples = [
        'Create a catalog item with 5 variables and 2 mandatory',
        'Create laptop request with employee name, laptop model, and justification - first two required',
        'Build a software access form with user, application dropdown, access level, and notes'
    ];

    // Create catalog item
    c.create = function() {
        if (!c.userRequest.trim()) {
            spUtil.addErrorMessage('Please enter a description');
            return;
        }

        c.isLoading = true;
        c.result = null;

        c.server.get({
            action: 'create',
            userRequest: c.userRequest
        }).then(function(response) {
            c.isLoading = false;
            c.result = response.data;

            if (response.data.success) {
                spUtil.addInfoMessage(response.data.message);
            } else {
                spUtil.addErrorMessage(response.data.message || 'Failed to create');
            }
        }, function(error) {
            c.isLoading = false;
            spUtil.addErrorMessage('Server error');
        });
    };

    // Use sample
    c.useSample = function(sample) {
        c.userRequest = sample;
        c.result = null;
    };

    // Open catalog item
    c.openItem = function() {
        if (c.result && c.result.catalogItem) {
            window.open('/sc_cat_item.do?sys_id=' + c.result.catalogItem.sys_id, '_blank');
        }
    };

    // Clear
    c.clear = function() {
        c.userRequest = '';
        c.result = null;
    };

    // Toggle debug
    c.toggleDebug = function() {
        c.showDebug = !c.showDebug;
    };
};
```

### HTML Template

```html
<div class="catalog-gen-poc">
    <div class="header">
        <h2><i class="fa fa-magic"></i> Catalog Item Generator</h2>
        <span class="badge">Now Assist POC - Zurich</span>
    </div>

    <div class="main-section">
        <div class="input-area">
            <label>Describe the catalog item you want:</label>
            <textarea 
                class="form-control" 
                ng-model="c.userRequest"
                placeholder="Example: Create a catalog item with 5 variables and 2 mandatory"
                rows="3"
                ng-disabled="c.isLoading">
            </textarea>

            <div class="btn-row">
                <button class="btn btn-primary" ng-click="c.create()" ng-disabled="c.isLoading || !c.userRequest">
                    <i class="fa" ng-class="c.isLoading ? 'fa-spinner fa-spin' : 'fa-rocket'"></i>
                    {{c.isLoading ? 'Creating...' : 'Create with Now Assist'}}
                </button>
                <button class="btn btn-default" ng-click="c.clear()">Clear</button>
            </div>
        </div>

        <!-- Samples -->
        <div class="samples">
            <strong>Try these:</strong>
            <div class="sample" ng-repeat="s in c.samples" ng-click="c.useSample(s)">
                {{s}}
            </div>
        </div>

        <!-- Result -->
        <div class="result-area" ng-if="c.result">
            <div class="success" ng-if="c.result.success">
                <i class="fa fa-check-circle"></i>
                <h4>Success!</h4>
                <p>{{c.result.message}}</p>
                <button class="btn btn-info" ng-click="c.openItem()">
                    <i class="fa fa-external-link"></i> Open Catalog Item
                </button>
            </div>

            <div class="error" ng-if="!c.result.success">
                <i class="fa fa-exclamation-circle"></i>
                <p>{{c.result.message}}</p>
            </div>

            <!-- Debug Info -->
            <div class="debug-section">
                <a ng-click="c.toggleDebug()">{{c.showDebug ? 'Hide' : 'Show'}} Debug Info</a>
                <pre ng-if="c.showDebug">{{c.result.debug | json}}</pre>
            </div>
        </div>
    </div>
</div>
```

### CSS

```css
.catalog-gen-poc {
    max-width: 650px;
    margin: 20px auto;
    font-family: 'Segoe UI', sans-serif;
}

.header {
    background: linear-gradient(135deg, #1a73e8, #8e24aa);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 20px;
}

.header h2 { margin: 0 0 8px 0; }
.header .badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
}

.main-section {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.input-area label {
    font-weight: 600;
    margin-bottom: 8px;
    display: block;
}

.input-area textarea {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    font-size: 15px;
    margin-bottom: 16px;
}

.input-area textarea:focus {
    border-color: #1a73e8;
    outline: none;
}

.btn-row {
    display: flex;
    gap: 10px;
}

.btn-row .btn-primary {
    background: linear-gradient(135deg, #1a73e8, #8e24aa);
    border: none;
    padding: 10px 24px;
}

.samples {
    margin-top: 20px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
}

.sample {
    padding: 10px;
    background: white;
    margin-top: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.sample:hover {
    background: #e3f2fd;
    transform: translateX(4px);
}

.result-area {
    margin-top: 20px;
    padding: 20px;
    border-radius: 8px;
}

.success {
    text-align: center;
    color: #2e7d32;
}

.success i { font-size: 48px; }
.success h4 { margin: 12px 0; }

.error {
    text-align: center;
    color: #c62828;
}

.debug-section {
    margin-top: 16px;
    font-size: 12px;
}

.debug-section pre {
    background: #263238;
    color: #aed581;
    padding: 12px;
    border-radius: 6px;
    max-height: 200px;
    overflow: auto;
    margin-top: 8px;
}
```

---

## Part 4: Testing

### Step 1: Save Widget
Click **Save** after adding all code

### Step 2: Create Test Page

1. Go to: `All > Service Portal > Pages`
2. Click **New**
3. Fill in:
   - Title: `Catalog Generator POC`
   - ID: `catalog-generator-poc`
4. Save

### Step 3: Add Widget to Page

1. Open the page in Portal Designer
2. Add your widget
3. Save

### Step 4: Test

1. Open: `https://YOUR-INSTANCE.service-now.com/sp?id=catalog-generator-poc`
2. Type: "Create a catalog item with 5 variables and 2 mandatory"
3. Click "Create with Now Assist"
4. Verify catalog item was created

---

## Troubleshooting

### "Could not get AI response"
- Check: `All > Now Assist > Administration > Generative AI Controller`
- Verify LLM configuration is active
- Test connection

### "sn_gen_ai is not defined"
- Run: `All > System Definition > Scripts - Background`
```javascript
gs.info('sn_gen_ai available: ' + (typeof sn_gen_ai !== 'undefined'));
```

### "Permission denied"
- Add roles: `now_assist_user`, `sn_gen_ai_user`

---

## Quick Verification Script

Run in Background Scripts to verify setup:

```javascript
// Test Generative AI availability in Zurich
try {
    var genAI = new sn_gen_ai.GenerativeAIService();
    var testResponse = genAI.generateText(JSON.stringify({
        messages: [
            {role: "user", content: "Say hello"}
        ]
    }));
    gs.info('AI Response: ' + JSON.stringify(testResponse));
    gs.info('SUCCESS: Generative AI is working!');
} catch(e) {
    gs.error('FAILED: ' + e.message);
}
```
