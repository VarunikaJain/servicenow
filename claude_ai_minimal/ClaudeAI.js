/**
 * Minimum Dynamic Claude AI - Script Include
 * Name: ClaudeAI
 * 
 * Setup: Create System Property "claude_api_key" with your API key
 */
var ClaudeAI = Class.create();
ClaudeAI.prototype = {
    
    process: function(prompt, userId) {
        var systemPrompt = 'Return ONLY JSON: {"action":"CREATE|QUERY|UPDATE","table":"servicenow_table_name","fields":{"field":"value"},"query":"encoded_query"}\n' +
            'Common tables: incident, change_request, problem, task, sc_req_item, kb_knowledge\n' +
            'Use CURRENT_USER for caller_id/opened_by. Use correct field names.';

        // Call Claude API
        var req = new sn_ws.RESTMessageV2();
        req.setEndpoint('https://api.anthropic.com/v1/messages');
        req.setHttpMethod('POST');
        req.setRequestHeader('x-api-key', gs.getProperty('claude_api_key'));
        req.setRequestHeader('anthropic-version', '2023-06-01');
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestBody(JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: systemPrompt,
            messages: [{role: 'user', content: prompt}]
        }));
        
        var resp = JSON.parse(req.execute().getBody());
        var action = JSON.parse(resp.content[0].text.match(/\{[\s\S]*\}/)[0]);

        // Execute dynamically
        var gr = new GlideRecord(action.table);
        
        if (action.action == 'CREATE') {
            gr.initialize();
            for (var f in action.fields) {
                gr.setValue(f, action.fields[f] == 'CURRENT_USER' ? userId : action.fields[f]);
            }
            gr.insert();
            return {success: true, table: action.table, number: gr.getValue('number') || gr.getUniqueValue()};
        }
        
        if (action.action == 'QUERY') {
            gr.addEncodedQuery(action.query.replace(/CURRENT_USER/g, userId));
            gr.setLimit(10);
            gr.query();
            var results = [];
            while (gr.next()) results.push({number: gr.getValue('number'), short_description: gr.getValue('short_description')});
            return {success: true, records: results};
        }
        
        if (action.action == 'UPDATE') {
            gr.addEncodedQuery(action.query);
            gr.query();
            if (gr.next()) {
                for (var f in action.fields) gr.setValue(f, action.fields[f]);
                gr.update();
                return {success: true, number: gr.getValue('number')};
            }
        }
        
        return {success: false};
    },
    
    type: 'ClaudeAI'
};
