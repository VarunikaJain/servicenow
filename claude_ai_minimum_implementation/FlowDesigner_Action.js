/**
 * Flow Designer Custom Action: "Process AI Command"
 * 
 * Setup in Flow Designer:
 * 1. Go to Flow Designer > Actions > New Action
 * 2. Name: "Process AI Command"
 * 3. Add Inputs:
 *    - prompt (String, Required)
 *    - user_id (String, Required)
 * 4. Add Outputs:
 *    - success (True/False)
 *    - message (String)
 *    - record_number (String)
 *    - record_sys_id (String)
 * 5. Add Script step with code below
 */

(function execute(inputs, outputs) {
    var helper = new ClaudeAIHelper();
    var result = helper.processPrompt(inputs.prompt, inputs.user_id);
    
    outputs.success = result.success;
    outputs.message = result.message || result.error || '';
    outputs.record_number = result.number || '';
    outputs.record_sys_id = result.sys_id || '';
})(inputs, outputs);


/**
 * Simple Flow Structure:
 * 
 * TRIGGER: Service Catalog Request (create a catalog item with "prompt" variable)
 *          OR Record Created on custom table
 *          OR Scheduled/REST trigger
 * 
 * STEP 1: Action "Process AI Command"
 *         - prompt: [Trigger data - prompt variable]
 *         - user_id: [Trigger data - requested_for or current user]
 * 
 * STEP 2: (Optional) Send notification with result
 */
