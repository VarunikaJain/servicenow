# ServiceNow Catalog Item Generator POC

## Overview

This Proof of Concept (POC) demonstrates how to create ServiceNow catalog items dynamically from natural language statements. Users can input commands like:

- "Create a catalog item with 5 variables and 2 mandatory"
- "Generate catalog item named Employee Onboarding with 3 text fields, 2 dropdowns, 1 mandatory"
- "Create a service request form with 4 variables where first 2 are required"

The system parses these statements and automatically generates the catalog item with the specified configuration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  (Service Portal Widget - HTML Template + Client Script)         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Natural Language Input:                                 │    │
│  │  "Create catalog item with 5 variables, 2 mandatory"    │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server Script                                │
│  (NLP Parser + Catalog Item Generator)                          │
│                                                                   │
│  1. Parse natural language input                                 │
│  2. Extract: item name, variable count, mandatory count,         │
│     variable types, category, etc.                               │
│  3. Generate catalog item via GlideRecord                        │
│  4. Create variables with proper ordering                        │
│  5. Set mandatory flags on specified variables                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ServiceNow Tables                               │
│                                                                   │
│  • sc_cat_item (Catalog Items)                                   │
│  • item_option_new (Variables)                                   │
│  • sc_category (Categories)                                      │
│  • sc_catalog (Catalogs)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works

### Step 1: Natural Language Parsing

The system uses regex patterns to extract key information from user input:

| Pattern | Extracts |
|---------|----------|
| `(\d+)\s*variables?` | Total number of variables |
| `(\d+)\s*mandatory` | Number of mandatory fields |
| `named?\s+['"]?([^'"]+)['"]?` | Catalog item name |
| `(text\|dropdown\|checkbox\|date\|reference)` | Variable types |
| `category\s+['"]?([^'"]+)['"]?` | Category name |

### Step 2: Catalog Item Creation

Using GlideRecord API, the system:

1. Creates a new record in `sc_cat_item`
2. Sets properties like name, description, category
3. Activates the catalog item

### Step 3: Variable Generation

For each variable:

1. Creates record in `item_option_new`
2. Links to the catalog item via `cat_item` field
3. Sets variable type (String, Integer, Dropdown, etc.)
4. Sets `mandatory` flag based on user specification
5. Assigns order for proper display sequence

---

## Supported Variable Types

| Type Code | ServiceNow Type | Description |
|-----------|-----------------|-------------|
| 6 | Single Line Text | Basic text input |
| 2 | Multi Line Text | Text area |
| 5 | Select Box | Dropdown selection |
| 7 | Checkbox | Boolean yes/no |
| 9 | Date | Date picker |
| 10 | Date/Time | Date and time picker |
| 8 | Reference | Reference to another table |
| 1 | Yes/No | Radio button yes/no |

---

## Sample Inputs & Outputs

### Example 1: Basic Creation
**Input:** `Create a catalog item with 5 variables and 2 mandatory`

**Output:**
- Catalog Item: "Generated Catalog Item" (auto-named)
- Variables: 5 single-line text fields
- Mandatory: First 2 variables marked as required

### Example 2: Named Item with Types
**Input:** `Create catalog item named "Employee Request" with 3 text fields, 2 dropdowns, first 3 mandatory`

**Output:**
- Catalog Item: "Employee Request"
- Variables: 3 text fields + 2 dropdowns = 5 total
- Mandatory: First 3 variables marked as required

### Example 3: Complex Request
**Input:** `Generate a service request named "IT Equipment" in category Hardware with 4 variables where 2 are mandatory and include 1 reference field and 1 date field`

**Output:**
- Catalog Item: "IT Equipment"
- Category: Hardware
- Variables: 2 text + 1 reference + 1 date = 4 total
- Mandatory: First 2 variables marked as required

---

## Implementation Steps

### Step 1: Create Service Portal Widget

1. Navigate to **Service Portal > Widgets**
2. Create new widget: "Catalog Item Generator"
3. Copy the provided scripts:
   - `catalog_item_generator_server_script.txt` → Server Script
   - `catalog_item_generator_client_script.txt` → Client Controller
   - `catalog_item_generator_html_template.txt` → HTML Template
   - `catalog_item_generator_CSS.txt` → CSS

### Step 2: Add Widget to Portal Page

1. Navigate to **Service Portal > Pages**
2. Create or edit a page
3. Add the "Catalog Item Generator" widget

### Step 3: Configure Permissions

Ensure the user has appropriate roles:
- `catalog_admin` - For creating catalog items
- `admin` - Full access

### Step 4: Test the POC

1. Open the portal page
2. Enter a natural language statement
3. Click "Generate Catalog Item"
4. Verify the item was created in Service Catalog

---

## Files Included

| File | Purpose |
|------|---------|
| `catalog_item_generator_server_script.txt` | Server-side logic for parsing and generation |
| `catalog_item_generator_client_script.txt` | Client-side controller for UI interactions |
| `catalog_item_generator_html_template.txt` | HTML template for the widget UI |
| `catalog_item_generator_CSS.txt` | Styling for the widget |
| `catalog_item_generator_POC_README.md` | This documentation |

---

## API Reference

### Server-Side Functions

#### `parseNaturalLanguage(input)`
Parses user input and extracts configuration.

**Returns:**
```javascript
{
    itemName: "string",
    totalVariables: number,
    mandatoryCount: number,
    variableTypes: ["text", "dropdown", ...],
    category: "string"
}
```

#### `createCatalogItem(config)`
Creates the catalog item record.

**Returns:** `sys_id` of created item

#### `createVariables(itemSysId, config)`
Creates variable records linked to the catalog item.

**Returns:** Array of variable `sys_id`s

---

## Limitations & Considerations

1. **Permissions**: User must have catalog_admin role
2. **Validation**: Basic validation only; production should include more checks
3. **Rollback**: No automatic rollback on partial failure
4. **Naming**: Auto-generates unique names to avoid conflicts

---

## Future Enhancements

1. **AI Integration**: Use OpenAI/Azure AI for better NLP parsing
2. **Templates**: Support for template-based generation
3. **Workflow**: Auto-attach workflows to generated items
4. **Preview**: Show preview before final creation
5. **Batch Creation**: Create multiple items from a list

---

## Support

For questions or issues with this POC, please contact the ServiceNow development team.
