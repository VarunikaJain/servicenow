/**
 * ============================================
 * SETUP (2 steps only)
 * ============================================
 * 
 * Step 1: Create System Property
 *   Name: x_your_scope.claude_api_key
 *   Value: your-api-key
 *   Private: checked
 * 
 * Step 2: Create Script Include
 *   Name: ClaudeAIDynamic
 *   Script: [paste ClaudeAIDynamic_ScriptInclude.js]
 * 
 * That's it! No table configuration needed.
 * ============================================
 */


/**
 * TEST SCRIPT - Run in Background Scripts
 */

var ai = new ClaudeAIDynamic();

// Test 1: Create Incident (AI figures out table=incident)
gs.info("=== Test 1: Create Incident ===");
var r1 = ai.processPrompt("Create an incident for VPN not connecting", gs.getUserID());
gs.info(JSON.stringify(r1, null, 2));

// Test 2: Create Change Request (AI figures out table=change_request)  
gs.info("=== Test 2: Create Change ===");
var r2 = ai.processPrompt("Create a change request to upgrade the firewall", gs.getUserID());
gs.info(JSON.stringify(r2, null, 2));

// Test 3: Create Problem (AI figures out table=problem)
gs.info("=== Test 3: Create Problem ===");
var r3 = ai.processPrompt("Create a problem for recurring server crashes", gs.getUserID());
gs.info(JSON.stringify(r3, null, 2));

// Test 4: Query Records
gs.info("=== Test 4: Query ===");
var r4 = ai.processPrompt("Show me all high priority incidents", gs.getUserID());
gs.info(JSON.stringify(r4, null, 2));

// Test 5: Create Task
gs.info("=== Test 5: Create Task ===");
var r5 = ai.processPrompt("Create a task to review the security patch", gs.getUserID());
gs.info(JSON.stringify(r5, null, 2));

// Test 6: Request something from catalog
gs.info("=== Test 6: Catalog Request ===");
var r6 = ai.processPrompt("I need a new monitor for my desk", gs.getUserID());
gs.info(JSON.stringify(r6, null, 2));


/**
 * ============================================
 * HOW IT WORKS
 * ============================================
 * 
 * 1. User says: "Create an incident for email down"
 * 
 * 2. Claude AI analyzes and returns:
 *    {
 *      "action": "CREATE",
 *      "table": "incident",        <-- AI determined this
 *      "fields": {                 <-- AI determined these
 *        "short_description": "Email down",
 *        "description": "...",
 *        "urgency": "2",
 *        "impact": "2"
 *      }
 *    }
 * 
 * 3. Generic code creates record:
 *    var gr = new GlideRecord(action.table);  // Works with ANY table
 *    gr.initialize();
 *    for (field in action.fields) {
 *      gr.setValue(field, action.fields[field]);
 *    }
 *    gr.insert();
 * 
 * NO hardcoded tables or fields in your code!
 * ============================================
 */


/**
 * ============================================
 * USE IN FLOW DESIGNER
 * ============================================
 */

// Create Action with inputs: prompt (String), user_id (String)
// Add this script step:

(function execute(inputs, outputs) {
    var ai = new ClaudeAIDynamic();
    var result = ai.processPrompt(inputs.prompt, inputs.user_id);
    
    outputs.success = result.success;
    outputs.table = result.table || '';
    outputs.record_number = result.number || '';
    outputs.record_sys_id = result.sys_id || '';
    outputs.message = result.message || result.error || '';
    outputs.record_count = result.count || 0;
})(inputs, outputs);
