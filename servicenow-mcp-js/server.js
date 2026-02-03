/**
 * ServiceNow MCP Server - JavaScript Version
 * 
 * This connects Claude to ServiceNow for creating records
 */

const http = require('http');
const https = require('https');

// ============================================
// CONFIGURATION - Update these values
// ============================================
const CONFIG = {
  servicenow: {
    instance: 'YOUR-INSTANCE.service-now.com',  // e.g., dev313586.service-now.com
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  },
  server: {
    port: 9123
  }
};

// ============================================
// ServiceNow API Helper
// ============================================
function callServiceNow(method, table, data = null, sysId = null) {
  return new Promise((resolve, reject) => {
    let path = `/api/now/table/${table}`;
    if (sysId) path += `/${sysId}`;

    const auth = Buffer.from(`${CONFIG.servicenow.username}:${CONFIG.servicenow.password}`).toString('base64');

    const options = {
      hostname: CONFIG.servicenow.instance,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// ============================================
// MCP Tools Definition
// ============================================
const MCP_TOOLS = {
  // Create Incident
  create_incident: {
    name: 'create_incident',
    description: 'Create a new incident in ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        short_description: { type: 'string', description: 'Brief description of the incident' },
        description: { type: 'string', description: 'Detailed description' },
        urgency: { type: 'string', description: '1=High, 2=Medium, 3=Low' },
        impact: { type: 'string', description: '1=High, 2=Medium, 3=Low' },
        category: { type: 'string', description: 'Category of the incident' }
      },
      required: ['short_description']
    },
    handler: async (params) => {
      const result = await callServiceNow('POST', 'incident', params);
      return `Created incident: ${result.result?.number || 'Unknown'} (sys_id: ${result.result?.sys_id})`;
    }
  },

  // Create Change Request
  create_change: {
    name: 'create_change',
    description: 'Create a new change request in ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        short_description: { type: 'string', description: 'Brief description of the change' },
        description: { type: 'string', description: 'Detailed description' },
        type: { type: 'string', description: 'normal, standard, or emergency' },
        risk: { type: 'string', description: 'high, moderate, or low' }
      },
      required: ['short_description']
    },
    handler: async (params) => {
      const result = await callServiceNow('POST', 'change_request', params);
      return `Created change request: ${result.result?.number || 'Unknown'}`;
    }
  },

  // Create Problem
  create_problem: {
    name: 'create_problem',
    description: 'Create a new problem record in ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        short_description: { type: 'string', description: 'Brief description' },
        description: { type: 'string', description: 'Detailed description' },
        urgency: { type: 'string', description: '1=High, 2=Medium, 3=Low' },
        impact: { type: 'string', description: '1=High, 2=Medium, 3=Low' }
      },
      required: ['short_description']
    },
    handler: async (params) => {
      const result = await callServiceNow('POST', 'problem', params);
      return `Created problem: ${result.result?.number || 'Unknown'}`;
    }
  },

  // Create Task
  create_task: {
    name: 'create_task',
    description: 'Create a new task in ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        short_description: { type: 'string', description: 'Brief description' },
        description: { type: 'string', description: 'Detailed description' },
        priority: { type: 'string', description: '1-5, where 1 is highest' }
      },
      required: ['short_description']
    },
    handler: async (params) => {
      const result = await callServiceNow('POST', 'task', params);
      return `Created task: ${result.result?.number || 'Unknown'}`;
    }
  },

  // List Incidents
  list_incidents: {
    name: 'list_incidents',
    description: 'List recent incidents from ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max records to return (default 10)' },
        query: { type: 'string', description: 'ServiceNow encoded query' }
      }
    },
    handler: async (params) => {
      const limit = params.limit || 10;
      let path = `incident?sysparm_limit=${limit}`;
      if (params.query) path += `&sysparm_query=${params.query}`;
      
      const result = await callServiceNow('GET', path);
      const incidents = result.result || [];
      
      return incidents.map(inc => 
        `${inc.number}: ${inc.short_description} (State: ${inc.state})`
      ).join('\n') || 'No incidents found';
    }
  },

  // Get Record by Sys ID
  get_record: {
    name: 'get_record',
    description: 'Get a specific record from ServiceNow by sys_id',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name (e.g., incident, change_request)' },
        sys_id: { type: 'string', description: 'The sys_id of the record' }
      },
      required: ['table', 'sys_id']
    },
    handler: async (params) => {
      const result = await callServiceNow('GET', params.table, null, params.sys_id);
      return JSON.stringify(result.result, null, 2);
    }
  },

  // Update Record
  update_record: {
    name: 'update_record',
    description: 'Update a record in ServiceNow',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        sys_id: { type: 'string', description: 'The sys_id of the record' },
        fields: { type: 'object', description: 'Fields to update' }
      },
      required: ['table', 'sys_id', 'fields']
    },
    handler: async (params) => {
      const result = await callServiceNow('PATCH', params.table, params.fields, params.sys_id);
      return `Updated record: ${result.result?.number || params.sys_id}`;
    }
  }
};

// ============================================
// MCP Protocol Handler
// ============================================
function handleMCPRequest(request) {
  const { method, params } = request;

  switch (method) {
    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'servicenow-mcp', version: '1.0.0' },
        capabilities: { tools: {} }
      };

    case 'tools/list':
      return {
        tools: Object.values(MCP_TOOLS).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };

    case 'tools/call':
      const toolName = params.name;
      const tool = MCP_TOOLS[toolName];
      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }
      return tool.handler(params.arguments || {});

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// ============================================
// HTTP Server
// ============================================
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const result = await handleMCPRequest(request);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          jsonrpc: '2.0', 
          error: { code: -1, message: error.message } 
        }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ServiceNow MCP Server is running!\n\nTools available:\n' + 
      Object.keys(MCP_TOOLS).join('\n'));
  }
});

server.listen(CONFIG.server.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     ServiceNow MCP Server (JavaScript)                     ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${CONFIG.server.port}                ║
║  ServiceNow: ${CONFIG.servicenow.instance.padEnd(40)}║
╠════════════════════════════════════════════════════════════╣
║  Tools available:                                          ║
║  • create_incident    • create_change                      ║
║  • create_problem     • create_task                        ║
║  • list_incidents     • get_record                         ║
║  • update_record                                           ║
╠════════════════════════════════════════════════════════════╣
║  Configure Claude Desktop with:                            ║
║  {                                                         ║
║    "mcpServers": {                                         ║
║      "servicenow": {                                       ║
║        "command": "npx",                                   ║
║        "args": ["mcp-remote", "http://localhost:9123"]     ║
║      }                                                     ║
║    }                                                       ║
║  }                                                         ║
╚════════════════════════════════════════════════════════════╝
  `);
});
