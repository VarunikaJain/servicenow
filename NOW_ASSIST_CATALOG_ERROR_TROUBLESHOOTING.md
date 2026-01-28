# Now Assist Catalog Item Error - Troubleshooting Guide

## Error Description

When using Now Assist for a catalog item, you receive the following errors:

**Primary Error:**
```
Syntax error or access violation detected by database table 'stdev_1.sys_ai_record_activity0000' does not exist
```

**System Log Error:**
```
Error getting record for sys_ai_record_activity: java.lang.NullPointerException
Source: com.glide.ui.ServletErrorListener (system)
```

## Root Cause

**This is a Table Rotation/Partition Schema issue.** 

The base table `sys_ai_record_activity` exists in the dictionary (sys_db_object), but:
1. The partition table `sys_ai_record_activity0000` does not exist in the actual database
2. The `NullPointerException` occurs because the code expects the partition table to exist but finds null
3. The table rotation configuration is pointing to non-existent physical tables

This is a **schema mismatch** - the ServiceNow dictionary says the table/partitions should exist, but they don't exist in the underlying MySQL/MariaDB database.

## Common Causes

1. **Table Rotation Misconfiguration** - Table rotation is enabled but partitions weren't created
2. **Clone/Refresh Issues** - Table rotation config was cloned but physical partitions weren't
3. **Failed Table Extension** - The rotation job failed to create the partition tables
4. **Database Schema Mismatch** - The dictionary says partitions exist but they don't in the actual database
5. **Plugin Activation Issue** - Now Assist plugin activated but table creation failed silently

## Understanding the NullPointerException

The error `java.lang.NullPointerException` from `com.glide.ui.ServletErrorListener` means:
- ServiceNow's Java code is trying to get a GlideRecord for `sys_ai_record_activity`
- The table rotation logic redirects to partition `sys_ai_record_activity0000`
- That partition table doesn't exist, returning null
- The code doesn't handle null gracefully, causing the NullPointerException

**This confirms the partition table is missing from the physical database.**

## Resolution Steps

### Step 1: Check Table Rotation Configuration (MOST LIKELY FIX)

1. Navigate to **System Definition > Tables** (`sys_db_object.list`)
2. Search for `sys_ai_record_activity`
3. Open the table record
4. Check the **Extension model** field - if it shows "Table per partition" or similar rotation config
5. Look for the **Table Rotation** or **Rotation Schedule** related list

**To fix the rotation issue:**

1. Navigate to **System Definition > Table Rotation > Rotation Schedules** (`table_rotation_schedule.list`)
2. Search for schedules related to `sys_ai_record_activity`
3. If a schedule exists, try running it manually or check if it's active

### Step 2: Create Missing Partition Table (Recommended Fix)

Run this script in **Scripts - Background** to check and potentially fix the partition:

```javascript
// Check if the partition table exists
var tableExists = GlideTableDescriptor.isValid('sys_ai_record_activity0000');
gs.info('Partition table sys_ai_record_activity0000 exists: ' + tableExists);

// Check rotation configuration
var rotGr = new GlideRecord('sys_table_rotation');
rotGr.addQuery('name', 'sys_ai_record_activity');
rotGr.query();
if (rotGr.next()) {
    gs.info('Table rotation config found: ' + rotGr.getDisplayValue());
    gs.info('Extension model: ' + rotGr.extension_model);
} else {
    gs.info('No table rotation configuration found for sys_ai_record_activity');
}
```

### Step 3: Disable Table Rotation (Quick Fix)

If you don't need table rotation for this AI table:

1. Navigate to **System Definition > Tables** (`sys_db_object.list`)
2. Find `sys_ai_record_activity`
3. Open the record and look for **Extension model** or rotation settings
4. Change to "Table per hierarchy" or disable rotation
5. **Note:** This may require admin privileges and could affect AI logging

### Step 4: Manually Create the Partition Table

If the partition is missing, you can request ServiceNow to create it:

1. Open a **HI case** with ServiceNow Support
2. Explain that the `sys_ai_record_activity0000` partition table is missing
3. Request they run the table rotation extension to create the missing partition

Or, if you have appropriate access, run in **Scripts - Background**:

```javascript
// Attempt to trigger table rotation for AI activity table
// WARNING: Test in sub-prod first
var rotator = new TableRotationUtils();
if (rotator.rotateTable) {
    rotator.rotateTable('sys_ai_record_activity');
    gs.info('Table rotation triggered');
}
```

### Step 5: Disable Now Assist Temporarily (Workaround)

If you need the catalog item to work immediately while fixing the root cause:

1. Navigate to **System Properties** (`sys_properties.list`)
2. Search for and set these properties to `false`:
   - `glide.ai.enabled`
   - `sn_gen_ai.enable_catalog_assist`
   - `sn_gen_ai.enabled`

Or disable at the catalog item level:
1. Navigate to **Service Catalog > Catalog Definitions > Maintain Items**
2. Open your catalog item
3. Look for Now Assist / AI-related checkboxes and disable them

### Step 6: Check for Clone/Refresh Issues

If this is a refreshed or cloned instance:

1. Table rotation configurations get cloned but physical partition tables may not
2. Navigate to **System Clone > Clone History** to check recent clones
3. The partition tables may need to be recreated after clone

Run this diagnostic script:

```javascript
// Check all AI-related tables and their rotation status
var tables = ['sys_ai_record_activity', 'sys_ai_log', 'sys_ai_config'];
tables.forEach(function(tableName) {
    var exists = GlideTableDescriptor.isValid(tableName);
    var partition0 = GlideTableDescriptor.isValid(tableName + '0000');
    gs.info(tableName + ' - Base: ' + exists + ', Partition 0000: ' + partition0);
});
```

### Step 7: Repair Table Schema (Admin Only)

If you have admin access, try repairing the table schema:

1. Navigate to **System Definition > Tables** (`sys_db_object.list`)
2. Find `sys_ai_record_activity`
3. Open the record
4. Click on **"Repair Table"** from the context menu (right-click on header bar)
5. This will attempt to sync the dictionary with the actual database schema

Alternatively, try this in **Scripts - Background**:

```javascript
// Attempt to repair/sync the table
var tableName = 'sys_ai_record_activity';
var repair = new GlideTableCreator(tableName, tableName);
repair.setColumnType('sys_id', 'GUID');
try {
    gs.info('Attempting table repair for: ' + tableName);
    // This forces a schema check
    var gr = new GlideRecord(tableName);
    gr.setLimit(1);
    gr.query();
    gs.info('Table query completed');
} catch(e) {
    gs.error('Table repair failed: ' + e.message);
}
```

### Step 8: RECOMMENDED - Contact ServiceNow Support (HI Case)

**Given the NullPointerException error, this likely requires ServiceNow backend intervention.**

Open an HI case with the following details:

**Subject:** Missing partition table sys_ai_record_activity0000 causing NullPointerException

**Description:**
```
Instance: [Your instance name - stdev_1]
Issue: Now Assist for Catalog Items failing

Errors observed:
1. "Syntax error or access violation detected by database table 
   'stdev_1.sys_ai_record_activity0000' does not exist"

2. System Log shows:
   "Error getting record for sys_ai_record_activity: 
   java.lang.NullPointerException"
   Source: com.glide.ui.ServletErrorListener

The base table sys_ai_record_activity exists in the dictionary, 
but the partition table sys_ai_record_activity0000 does not exist 
in the physical database.

Request: Please create the missing partition table or repair the 
table rotation configuration.
```

**Priority:** Based on business impact

### Step 9: Immediate Workaround (While Waiting for Fix)

To get your catalog item working immediately, disable Now Assist:

**Option A - Disable via System Properties:**

Navigate to `sys_properties.list` and create/update these properties:

| Property Name | Type | Value |
|--------------|------|-------|
| `glide.ai.enabled` | true/false | `false` |
| `sn_gen_ai.enabled` | true/false | `false` |
| `now_assist.enabled` | true/false | `false` |

**Option B - Disable via Script (Scripts - Background):**

```javascript
// Disable Now Assist features temporarily
var props = [
    'glide.ai.enabled',
    'sn_gen_ai.enabled', 
    'now_assist.enabled',
    'sn_gen_ai.enable_catalog_assist'
];

props.forEach(function(propName) {
    var gr = new GlideRecord('sys_properties');
    gr.addQuery('name', propName);
    gr.query();
    if (gr.next()) {
        gr.value = 'false';
        gr.update();
        gs.info('Disabled: ' + propName);
    } else {
        gs.info('Property not found: ' + propName);
    }
});
gs.info('Now Assist disabled. Catalog items should work without AI features.');
```

**Option C - Check if there's a Now Assist toggle on the Catalog Item:**

1. Open your catalog item in **Maintain Items**
2. Look for fields like:
   - "Enable Now Assist"
   - "AI Enabled"
   - "Use Generative AI"
3. Uncheck/disable these options

## Prevention

To prevent this issue in the future:

1. After cloning instances, verify table rotation partitions exist
2. Monitor table rotation scheduled jobs for failures
3. Before enabling Now Assist, ensure all required tables and partitions are created
4. Include table rotation validation in your clone cleanup scripts

## Understanding Table Rotation in ServiceNow

ServiceNow uses **table rotation** for high-volume tables to improve performance:

- Base table: `sys_ai_record_activity` (contains metadata/configuration)
- Partition tables: `sys_ai_record_activity0000`, `sys_ai_record_activity0001`, etc. (contain actual data)
- When rotation is enabled, data writes go to partition tables, not the base table
- If the partition doesn't exist, you get the "table does not exist" error

## Related Tables

The following tables are part of Now Assist infrastructure and may have rotation:

| Base Table | Purpose | May Have Partitions |
|------------|---------|---------------------|
| `sys_ai_record_activity` | AI Record Activity tracking | Yes (0000, 0001, etc.) |
| `sys_ai_log` | AI Logging | Yes |
| `sys_ai_config` | AI Configuration | No |
| `sys_ai_model` | AI Models | No |
| `sn_gen_ai_*` | Generative AI tables | Varies |

## Notes About Your STICE Booking Widget

Your current widget code (STICE Booking System) does not directly reference Now Assist. The error is occurring at the platform level when Now Assist tries to log AI activity for the catalog item. Once the table rotation/partition issue is resolved, your booking widget should function normally.

## Quick Reference - Scripts to Run

**1. Diagnostic Script (run first):**
```javascript
// Run in Scripts - Background
var baseTable = 'sys_ai_record_activity';
gs.info('=== AI Table Rotation Diagnostic ===');
gs.info('Base table exists: ' + GlideTableDescriptor.isValid(baseTable));
for (var i = 0; i < 5; i++) {
    var partition = baseTable + '000' + i;
    gs.info('Partition ' + partition + ': ' + GlideTableDescriptor.isValid(partition));
}
```

**2. Check Table Rotation Config:**
```javascript
// Run in Scripts - Background
var gr = new GlideRecord('sys_db_object');
gr.addQuery('name', 'sys_ai_record_activity');
gr.query();
if (gr.next()) {
    gs.info('Table sys_id: ' + gr.sys_id);
    gs.info('Super class: ' + gr.super_class.getDisplayValue());
    gs.info('Is extendable: ' + gr.is_extendable);
}
```

---

**Document Created:** January 28, 2026  
**Document Updated:** January 28, 2026  
**ServiceNow Instance Type:** Sub-Production (stdev_1)  
**Error Context:** Now Assist for Catalog Items - Table Rotation Partition Missing
