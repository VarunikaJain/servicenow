/**
 * Flow Designer Action Script
 * 
 * Paste this in the Script step of your Action
 */

(function execute(inputs, outputs) {
    
    // System prompt - tells Claude about ServiceNow tables
    var systemPrompt = 'Return ONLY valid JSON: {"action":"CREATE","table":"table_name","fields":{"field":"value"}}\n' +
        'Tables: incident(short_description,description,urgency,impact,caller_id), ' +
        'change_request(short_description,description,type,requested_by), ' +
        'problem(short_description,description,urgency,impact,opened_by), ' +
        'task(short_description,description,assigned_to), ' +
        'sc_req_item(short_description,cat_item,quantity,requested_for)\n' +
        'For QUERY: {"action":"QUERY","table":"incident","query":"active=true"}\n' +
        'Use CURRENT_USER for user reference fields.';

    try {
        // Call Claude API
        var request = new sn_ws.RESTMessageV2();
        request.setEndpoint('https://api.anthropic.com/v1/messages');
        request.setHttpMethod('POST');
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('x-api-key', gs.getProperty('claude_api_key'));
        request.setRequestHeader('anthropic-version', '2023-06-01');
        request.setRequestBody(JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: 'user', content: inputs.prompt }]
        }));

        var response = request.execute();
        var body = JSON.parse(response.getBody());
        var aiText = body.content[0].text;
        
        // Parse JSON from AI response
        var jsonMatch = aiText.match(/\{[\s\S]*\}/);
        var action = JSON.parse(jsonMatch[0]);

        // Execute based on action type
        var gr = new GlideRecord(action.table);

        if (action.action == 'CREATE') {
            gr.initialize();
            for (var field in action.fields) {
                var value = action.fields[field];
                if (value == 'CURRENT_USER') value = inputs.user_id;
                gr.setValue(field, value);
            }
            var sysId = gr.insert();
            
            outputs.success = true;
            outputs.record_number = gr.getValue('number') || sysId;
            outputs.record_sys_id = sysId;
            outputs.table_name = action.table;
            outputs.message = 'Created ' + action.table + ': ' + (gr.getValue('number') || sysId);
        }
        else if (action.action == 'QUERY') {
            var query = action.query.replace(/CURRENT_USER/g, inputs.user_id);
            gr.addEncodedQuery(query);
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
            
            outputs.success = true;
            outputs.records_json = JSON.stringify(results);
            outputs.message = 'Found ' + results.length + ' records';
            outputs.table_name = action.table;
        }
        else {
            outputs.success = false;
            outputs.message = 'Unknown action: ' + action.action;
        }

    } catch (e) {
        outputs.success = false;
        outputs.message = 'Error: ' + e.message;
    }

})(inputs, outputs);
