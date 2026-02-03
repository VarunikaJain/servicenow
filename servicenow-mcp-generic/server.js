const http = require('http');
const https = require('https');

// ⚠️ CHANGE THESE 3 LINES WITH YOUR DETAILS ⚠️
const INSTANCE = 'dev313586.service-now.com';  // Your ServiceNow URL (without https://)
const USERNAME = 'admin';                        // Your username
const PASSWORD = 'your_password';                // Your password

// ServiceNow API - Works with ANY table
function callServiceNow(method, table, data = null, query = '') {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(USERNAME + ':' + PASSWORD).toString('base64');
    let path = '/api/now/table/' + table;
    if (query) path += '?' + query;
    
    const req = https.request({
      hostname: INSTANCE,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch(e) { resolve({raw: body}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// MCP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        let result = {};
        
        if (request.method === 'initialize') {
          result = {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'servicenow-generic', version: '1.0.0' },
            capabilities: { tools: {} }
          };
        }
        else if (request.method === 'tools/list') {
          result = {
            tools: [
              // GENERIC CREATE - Works with ANY table
              {
                name: 'create_record',
                description: `Create ANY record in ServiceNow. Common tables: 
                  - incident: For issues/problems (fields: short_description, description, urgency, impact, category)
                  - change_request: For changes (fields: short_description, description, type, risk)
                  - problem: For problems (fields: short_description, description, urgency, impact)
                  - sc_request: For service requests (fields: short_description, description)
                  - sc_req_item: For catalog items (fields: short_description, quantity, cat_item)
                  - task: For tasks (fields: short_description, description, assigned_to, priority)
                  - kb_knowledge: For knowledge articles (fields: short_description, text)
                  - cmdb_ci: For configuration items (fields: name, short_description)
                  - sys_user: For users (fields: user_name, first_name, last_name, email)
                  - sys_user_group: For groups (fields: name, description)
                  - sc_cat_item: For catalog items (fields: name, short_description, description)
                  - cmn_location: For locations (fields: name, street, city, state)
                  - cmn_department: For departments (fields: name, description)
                  - ast_contract: For contracts (fields: short_description, vendor)
                  - alm_asset: For assets (fields: display_name, model, serial_number)`,
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { 
                      type: 'string', 
                      description: 'ServiceNow table name (e.g., incident, change_request, problem, task, sc_request, kb_knowledge, cmdb_ci)' 
                    },
                    fields: { 
                      type: 'object', 
                      description: 'Fields and values to set on the record. Use actual ServiceNow field names.' 
                    }
                  },
                  required: ['table', 'fields']
                }
              },
              
              // GENERIC READ/QUERY
              {
                name: 'query_records',
                description: 'Search/query records from ANY ServiceNow table. Returns matching records.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { type: 'string', description: 'Table name to query' },
                    query: { type: 'string', description: 'ServiceNow encoded query (e.g., active=true, priority=1, short_descriptionLIKEemail)' },
                    limit: { type: 'number', description: 'Max records to return (default 10)' },
                    fields: { type: 'string', description: 'Comma-separated fields to return (optional)' }
                  },
                  required: ['table']
                }
              },
              
              // GENERIC UPDATE
              {
                name: 'update_record',
                description: 'Update ANY existing record in ServiceNow by sys_id',
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { type: 'string', description: 'Table name' },
                    sys_id: { type: 'string', description: 'The sys_id of the record to update' },
                    fields: { type: 'object', description: 'Fields to update with new values' }
                  },
                  required: ['table', 'sys_id', 'fields']
                }
              },
              
              // GENERIC DELETE
              {
                name: 'delete_record',
                description: 'Delete a record from ServiceNow by sys_id',
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { type: 'string', description: 'Table name' },
                    sys_id: { type: 'string', description: 'The sys_id of the record to delete' }
                  },
                  required: ['table', 'sys_id']
                }
              },
              
              // GET SINGLE RECORD
              {
                name: 'get_record',
                description: 'Get a single record by sys_id or number',
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { type: 'string', description: 'Table name' },
                    sys_id: { type: 'string', description: 'The sys_id of the record' }
                  },
                  required: ['table', 'sys_id']
                }
              },
              
              // LIST TABLES (helpful for discovery)
              {
                name: 'list_tables',
                description: 'List available ServiceNow tables (for reference)',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              }
            ]
          };
        }
        else if (request.method === 'tools/call') {
          const tool = request.params.name;
          const args = request.params.arguments || {};
          
          // GENERIC CREATE
          if (tool === 'create_record') {
            const r = await callServiceNow('POST', args.table, args.fields);
            if (r.result) {
              result = { 
                content: [{ 
                  type: 'text', 
                  text: `✅ Created ${args.table} record!\nNumber: ${r.result.number || 'N/A'}\nSys ID: ${r.result.sys_id}\n\nRecord details:\n${JSON.stringify(r.result, null, 2)}` 
                }] 
              };
            } else {
              result = { content: [{ type: 'text', text: `❌ Error: ${JSON.stringify(r)}` }] };
            }
          }
          
          // GENERIC QUERY
          else if (tool === 'query_records') {
            let queryStr = `sysparm_limit=${args.limit || 10}`;
            if (args.query) queryStr += `&sysparm_query=${encodeURIComponent(args.query)}`;
            if (args.fields) queryStr += `&sysparm_fields=${args.fields}`;
            
            const r = await callServiceNow('GET', args.table, null, queryStr);
            if (r.result) {
              const count = r.result.length;
              let text = `Found ${count} ${args.table} record(s):\n\n`;
              r.result.forEach((rec, i) => {
                text += `${i+1}. ${rec.number || rec.name || rec.sys_id}\n`;
                text += `   ${rec.short_description || rec.description || ''}\n`;
                text += `   sys_id: ${rec.sys_id}\n\n`;
              });
              result = { content: [{ type: 'text', text }] };
            } else {
              result = { content: [{ type: 'text', text: `❌ Error: ${JSON.stringify(r)}` }] };
            }
          }
          
          // GENERIC UPDATE
          else if (tool === 'update_record') {
            const r = await callServiceNow('PATCH', `${args.table}/${args.sys_id}`, args.fields);
            if (r.result) {
              result = { 
                content: [{ 
                  type: 'text', 
                  text: `✅ Updated ${args.table} record: ${r.result.number || r.result.sys_id}` 
                }] 
              };
            } else {
              result = { content: [{ type: 'text', text: `❌ Error: ${JSON.stringify(r)}` }] };
            }
          }
          
          // GENERIC DELETE
          else if (tool === 'delete_record') {
            const r = await callServiceNow('DELETE', `${args.table}/${args.sys_id}`);
            result = { content: [{ type: 'text', text: `✅ Deleted record from ${args.table}` }] };
          }
          
          // GET SINGLE RECORD
          else if (tool === 'get_record') {
            const r = await callServiceNow('GET', `${args.table}/${args.sys_id}`);
            if (r.result) {
              result = { content: [{ type: 'text', text: JSON.stringify(r.result, null, 2) }] };
            } else {
              result = { content: [{ type: 'text', text: `❌ Record not found` }] };
            }
          }
          
          // LIST COMMON TABLES
          else if (tool === 'list_tables') {
            result = { 
              content: [{ 
                type: 'text', 
                text: `Common ServiceNow Tables:

ITSM:
• incident - Incidents
• change_request - Change Requests  
• problem - Problems
• sc_request - Service Requests
• sc_req_item - Requested Items
• sc_task - Catalog Tasks
• task - Generic Tasks

CMDB:
• cmdb_ci - Configuration Items
• cmdb_ci_server - Servers
• cmdb_ci_computer - Computers
• cmdb_ci_service - Services

HR / Users:
• sys_user - Users
• sys_user_group - Groups
• cmn_department - Departments
• cmn_location - Locations

Catalog:
• sc_cat_item - Catalog Items
• sc_category - Categories

Knowledge:
• kb_knowledge - Knowledge Articles
• kb_knowledge_base - Knowledge Bases

Assets:
• alm_asset - Assets
• alm_hardware - Hardware Assets

Other:
• sysapproval_approver - Approvals
• ast_contract - Contracts
• core_company - Companies` 
              }] 
            };
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>ServiceNow MCP Server (Generic)</h1>
      <p>Server is running!</p>
      <p>Open Claude Desktop and try:</p>
      <ul>
        <li>"Create an incident for email not working"</li>
        <li>"Create a change request for server upgrade"</li>
        <li>"Show me all high priority incidents"</li>
        <li>"Create a task to review documentation"</li>
        <li>"Create a knowledge article about password reset"</li>
      </ul>
    `);
  }
});

server.listen(9123, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        ServiceNow MCP Server (GENERIC)                       ║
╠══════════════════════════════════════════════════════════════╣
║  Server: http://localhost:9123                               ║
║  Instance: ${INSTANCE.padEnd(45)}║
╠══════════════════════════════════════════════════════════════╣
║  This server works with ANY ServiceNow table!                ║
║                                                              ║
║  Tools available:                                            ║
║  • create_record  - Create ANY record                        ║
║  • query_records  - Search ANY table                         ║
║  • update_record  - Update ANY record                        ║
║  • delete_record  - Delete ANY record                        ║
║  • get_record     - Get single record                        ║
║  • list_tables    - Show common tables                       ║
╠══════════════════════════════════════════════════════════════╣
║  Example prompts in Claude:                                  ║
║  • "Create an incident for VPN not working"                  ║
║  • "Create a change request for database upgrade"            ║
║  • "Show all open incidents"                                 ║
║  • "Create a problem for recurring login failures"           ║
║  • "Create a task assigned to John"                          ║
║  • "Create a knowledge article about email setup"            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
