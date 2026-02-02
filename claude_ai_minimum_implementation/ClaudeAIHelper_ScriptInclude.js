/**
 * ClaudeAIHelper - Minimum Implementation
 * 
 * Setup:
 * 1. Create System Property: x_your_scope.claude_api_key (with your API key)
 * 2. Create this Script Include named "ClaudeAIHelper"
 */

var ClaudeAIHelper = Class.create();
ClaudeAIHelper.prototype = {
    initialize: function() {
        this.apiKey = gs.getProperty('x_your_scope.claude_api_key');
    },

    // Main function - call this with user's prompt
    processPrompt: function(userPrompt, userId) {
        var systemPrompt = 'You are a ServiceNow assistant. Return ONLY valid JSON (no other text) in this format:\n' +
            '{"action":"CREATE_INCIDENT|CREATE_REQUEST|CREATE_CHANGE|QUERY","table":"table_name","data":{field:value},"message":"confirmation"}\n\n' +
            'For CREATE_INCIDENT: table=incident, data needs short_description, description, urgency(1-3), impact(1-3)\n' +
            'For CREATE_REQUEST: table=sc_req_item, data needs cat_item(catalog item name), quantity\n' +
            'For CREATE_CHANGE: table=change_request, data needs short_description, description, type(normal/emergency)\n' +
            'For QUERY: table=table_name, data needs conditions array [{field,operator,value}]\n\n' +
            'Example: User says "email is down" -> {"action":"CREATE_INCIDENT","table":"incident","data":{"short_description":"Email is down","description":"User reported email service not working","urgency":"2","impact":"2"},"message":"Creating incident for email issue"}';

        // Call Claude API
        var response = this._callAPI(systemPrompt, userPrompt);
        if (!response.success) return response;

        // Parse and execute
        try {
            var action = JSON.parse(response.content);
            return this._executeAction(action, userId);
        } catch (e) {
            return { success: false, error: 'Failed to parse AI response' };
        }
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

    _executeAction: function(action, userId) {
        switch (action.action) {
            case 'CREATE_INCIDENT':
                return this._createIncident(action.data, userId);
            case 'CREATE_REQUEST':
                return this._createRequest(action.data, userId);
            case 'CREATE_CHANGE':
                return this._createChange(action.data, userId);
            case 'QUERY':
                return this._queryRecords(action.data, userId);
            default:
                return { success: false, error: 'Unknown action: ' + action.action };
        }
    },

    _createIncident: function(data, userId) {
        var gr = new GlideRecord('incident');
        gr.initialize();
        gr.short_description = data.short_description;
        gr.description = data.description;
        gr.urgency = data.urgency || '3';
        gr.impact = data.impact || '3';
        gr.caller_id = userId;
        var sysId = gr.insert();
        return sysId ? 
            { success: true, number: gr.number.toString(), sys_id: sysId, message: 'Incident ' + gr.number + ' created' } :
            { success: false, error: 'Failed to create incident' };
    },

    _createRequest: function(data, userId) {
        // Find catalog item
        var catGr = new GlideRecord('sc_cat_item');
        if (!catGr.get('name', data.cat_item)) {
            return { success: false, error: 'Catalog item not found: ' + data.cat_item };
        }
        
        // Create request
        var reqGr = new GlideRecord('sc_request');
        reqGr.initialize();
        reqGr.requested_for = userId;
        var reqId = reqGr.insert();
        
        // Create requested item
        var itemGr = new GlideRecord('sc_req_item');
        itemGr.initialize();
        itemGr.request = reqId;
        itemGr.cat_item = catGr.sys_id;
        itemGr.quantity = data.quantity || 1;
        itemGr.insert();
        
        return { success: true, number: reqGr.number.toString(), sys_id: reqId, message: 'Request ' + reqGr.number + ' created' };
    },

    _createChange: function(data, userId) {
        var gr = new GlideRecord('change_request');
        gr.initialize();
        gr.short_description = data.short_description;
        gr.description = data.description;
        gr.type = data.type || 'normal';
        gr.requested_by = userId;
        var sysId = gr.insert();
        return sysId ?
            { success: true, number: gr.number.toString(), sys_id: sysId, message: 'Change ' + gr.number + ' created' } :
            { success: false, error: 'Failed to create change' };
    },

    _queryRecords: function(data, userId) {
        var gr = new GlideRecord(data.table || 'incident');
        if (data.conditions) {
            data.conditions.forEach(function(c) {
                if (c.value === 'CURRENT_USER') c.value = userId;
                gr.addQuery(c.field, c.operator || '=', c.value);
            });
        }
        gr.setLimit(10);
        gr.query();
        
        var results = [];
        while (gr.next()) {
            results.push({
                number: gr.getValue('number'),
                short_description: gr.getValue('short_description'),
                state: gr.getDisplayValue('state')
            });
        }
        return { success: true, count: results.length, records: results, message: 'Found ' + results.length + ' records' };
    },

    type: 'ClaudeAIHelper'
};
