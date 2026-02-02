/**
 * ClaudeAIDynamic - Fully Dynamic Implementation
 * 
 * Claude AI automatically determines:
 * - Which table to use
 * - Which fields to populate
 * - What values to set
 * 
 * NO table-specific code required!
 */

var ClaudeAIDynamic = Class.create();
ClaudeAIDynamic.prototype = {
    initialize: function() {
        this.apiKey = gs.getProperty('x_your_scope.claude_api_key');
    },

    processPrompt: function(userPrompt, userId) {
        // System prompt tells Claude about ServiceNow tables and fields
        var systemPrompt = this._buildSystemPrompt();
        
        // Call Claude API
        var response = this._callAPI(systemPrompt, userPrompt);
        if (!response.success) return response;

        // Parse and execute dynamically
        try {
            var jsonMatch = response.content.match(/\{[\s\S]*\}/);
            var action = JSON.parse(jsonMatch[0]);
            
            if (action.action === 'CREATE') {
                return this._createRecord(action.table, action.fields, userId);
            } else if (action.action === 'QUERY') {
                return this._queryRecords(action.table, action.query, userId);
            } else if (action.action === 'UPDATE') {
                return this._updateRecord(action.table, action.query, action.fields);
            }
            
            return { success: false, error: 'Unknown action', ai_response: action };
        } catch (e) {
            return { success: false, error: 'Parse error: ' + e.message, raw: response.content };
        }
    },

    _buildSystemPrompt: function() {
        return `You are a ServiceNow expert. Based on user requests, determine the correct table and fields.

RESPOND WITH ONLY VALID JSON (no other text):

For creating records:
{
  "action": "CREATE",
  "table": "table_name",
  "fields": {
    "field_name": "value",
    "field_name2": "value2"
  },
  "message": "human readable confirmation"
}

For querying records:
{
  "action": "QUERY",
  "table": "table_name",
  "query": "encoded_query_string",
  "message": "human readable confirmation"
}

For updating records:
{
  "action": "UPDATE",
  "table": "table_name",
  "query": "number=INC0010001",
  "fields": {
    "field_to_update": "new_value"
  },
  "message": "human readable confirmation"
}

COMMON SERVICENOW TABLES AND FIELDS:

incident - For issues/problems
  Fields: short_description, description, urgency(1=High,2=Med,3=Low), impact(1,2,3), category, subcategory, caller_id, assignment_group, assigned_to, state(1=New,2=InProgress,6=Resolved,7=Closed)

sc_request - Service catalog request
  Fields: requested_for, description, special_instructions

sc_req_item - Requested item (link to sc_request via 'request' field)
  Fields: request, cat_item, quantity, short_description

change_request - Changes
  Fields: short_description, description, type(normal,standard,emergency), risk(high,moderate,low), impact, requested_by, assignment_group

problem - Problems
  Fields: short_description, description, urgency, impact, category, opened_by, assignment_group

task - Generic tasks
  Fields: short_description, description, assigned_to, assignment_group, due_date, priority

kb_knowledge - Knowledge articles
  Fields: short_description, text, kb_knowledge_base, workflow_state(draft,published)

cmdb_ci - Configuration items
  Fields: name, short_description, asset_tag, assigned_to, location

sys_user - Users (for lookup, not creation)
  Fields: user_name, first_name, last_name, email

sys_user_group - Groups (for lookup)
  Fields: name, description

RULES:
1. Use exact ServiceNow field names (snake_case)
2. For reference fields like caller_id, assigned_to, assignment_group - use the display value (name), I will resolve it
3. For date fields, use format: YYYY-MM-DD HH:MM:SS
4. For choice fields, use the value not label (e.g., urgency="1" not "High")
5. Always include short_description for task-based tables
6. REPLACE "CURRENT_USER" for caller_id/opened_by/requested_by when user refers to themselves

EXAMPLES:

User: "Create an incident for email not working"
Response:
{"action":"CREATE","table":"incident","fields":{"short_description":"Email not working","description":"User reported email service is not functioning","urgency":"2","impact":"2","category":"software","subcategory":"email","caller_id":"CURRENT_USER"},"message":"Creating incident for email issue"}

User: "I need a new laptop"
Response:
{"action":"CREATE","table":"sc_req_item","fields":{"short_description":"New laptop request","cat_item":"Standard Laptop","quantity":"1","requested_for":"CURRENT_USER"},"message":"Creating laptop request"}

User: "Show my open incidents"
Response:
{"action":"QUERY","table":"incident","query":"caller_id=CURRENT_USER^stateNOT IN6,7","message":"Finding your open incidents"}

User: "Close incident INC0010001"
Response:
{"action":"UPDATE","table":"incident","query":"number=INC0010001","fields":{"state":"7","close_code":"Solved","close_notes":"Closed via AI assistant"},"message":"Closing INC0010001"}

User: "Create a problem for recurring database timeouts"
Response:
{"action":"CREATE","table":"problem","fields":{"short_description":"Recurring database timeouts","description":"Multiple incidents reported regarding database connection timeouts","urgency":"2","impact":"2","category":"database","opened_by":"CURRENT_USER"},"message":"Creating problem record"}`;
    },

    _callAPI: function(systemPrompt, userPrompt) {
        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint('https://api.anthropic.com/v1/messages');
            request.setHttpMethod('POST');
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestHeader('x-api-key', this.apiKey);
            request.setRequestHeader('anthropic-version', '2023-06-01');
            request.setRequestBody(JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            }));

            var response = request.execute();
            if (response.getStatusCode() == 200) {
                var body = JSON.parse(response.getBody());
                return { success: true, content: body.content[0].text };
            }
            return { success: false, error: 'API error: ' + response.getStatusCode() };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // GENERIC create - works with ANY table
    _createRecord: function(tableName, fields, userId) {
        var gr = new GlideRecord(tableName);
        if (!gr.isValid()) {
            return { success: false, error: 'Invalid table: ' + tableName };
        }
        
        gr.initialize();
        
        // Set each field dynamically
        for (var fieldName in fields) {
            var value = fields[fieldName];
            
            // Handle CURRENT_USER placeholder
            if (value === 'CURRENT_USER') {
                value = userId;
            }
            
            // Check if field exists on table
            if (gr.isValidField(fieldName)) {
                // Check if it's a reference field - try to resolve display value
                var element = gr.getElement(fieldName);
                if (element && element.getED().isReference()) {
                    var refValue = this._resolveReference(element.getED().getReference(), value);
                    if (refValue) {
                        gr.setValue(fieldName, refValue);
                    } else {
                        gr.setValue(fieldName, value); // Try direct value
                    }
                } else {
                    gr.setValue(fieldName, value);
                }
            }
        }
        
        var sysId = gr.insert();
        
        if (sysId) {
            return {
                success: true,
                table: tableName,
                sys_id: sysId,
                number: gr.getValue('number') || sysId,
                message: 'Created ' + tableName + ' record: ' + (gr.getValue('number') || sysId)
            };
        }
        
        return { success: false, error: 'Failed to create record in ' + tableName };
    },

    // GENERIC query - works with ANY table
    _queryRecords: function(tableName, encodedQuery, userId) {
        var gr = new GlideRecord(tableName);
        if (!gr.isValid()) {
            return { success: false, error: 'Invalid table: ' + tableName };
        }
        
        // Replace CURRENT_USER in query
        if (encodedQuery) {
            encodedQuery = encodedQuery.replace(/CURRENT_USER/g, userId);
            gr.addEncodedQuery(encodedQuery);
        }
        
        gr.setLimit(20);
        gr.query();
        
        var results = [];
        while (gr.next()) {
            var record = {
                sys_id: gr.getUniqueValue(),
                number: gr.getValue('number') || gr.getUniqueValue()
            };
            
            // Get common display fields if they exist
            ['short_description', 'name', 'state', 'assigned_to', 'priority', 'sys_created_on'].forEach(function(f) {
                if (gr.isValidField(f)) {
                    record[f] = gr.getDisplayValue(f);
                }
            });
            
            results.push(record);
        }
        
        return {
            success: true,
            table: tableName,
            count: results.length,
            records: results,
            message: 'Found ' + results.length + ' records in ' + tableName
        };
    },

    // GENERIC update - works with ANY table
    _updateRecord: function(tableName, query, fields) {
        var gr = new GlideRecord(tableName);
        if (!gr.isValid()) {
            return { success: false, error: 'Invalid table: ' + tableName };
        }
        
        gr.addEncodedQuery(query);
        gr.query();
        
        if (!gr.next()) {
            return { success: false, error: 'Record not found: ' + query };
        }
        
        // Update fields dynamically
        for (var fieldName in fields) {
            if (gr.isValidField(fieldName)) {
                var element = gr.getElement(fieldName);
                var value = fields[fieldName];
                
                if (element && element.getED().isReference()) {
                    var refValue = this._resolveReference(element.getED().getReference(), value);
                    gr.setValue(fieldName, refValue || value);
                } else {
                    gr.setValue(fieldName, value);
                }
            }
        }
        
        gr.update();
        
        return {
            success: true,
            table: tableName,
            sys_id: gr.getUniqueValue(),
            number: gr.getValue('number') || gr.getUniqueValue(),
            message: 'Updated ' + (gr.getValue('number') || gr.getUniqueValue())
        };
    },

    // Resolve reference field by display value
    _resolveReference: function(refTable, displayValue) {
        if (!displayValue || displayValue === 'CURRENT_USER') return displayValue;
        
        var gr = new GlideRecord(refTable);
        
        // Try common display fields
        var displayFields = ['name', 'user_name', 'number', 'short_description'];
        for (var i = 0; i < displayFields.length; i++) {
            if (gr.isValidField(displayFields[i])) {
                gr.addQuery(displayFields[i], displayValue);
                gr.query();
                if (gr.next()) {
                    return gr.getUniqueValue();
                }
                gr.initialize(); // Reset for next try
            }
        }
        
        return null;
    },

    type: 'ClaudeAIDynamic'
};
