# Now Assist Catalog Item Error - Troubleshooting Guide

## Error Description

When using Now Assist for a catalog item, you receive the following error:

```
Syntax error or access violation detected by database table 'stdev_1.sys_ai_record_activity0000' does not exist
```

## Root Cause

This error occurs because the `sys_ai_record_activity` table (part of Now Assist/Generative AI infrastructure) does not exist or is not accessible in your ServiceNow instance. This is typically a **platform configuration issue**, not a code issue with your catalog item or widgets.

## Common Causes

1. **Now Assist Plugin Not Installed** - The Generative AI Controller or Now Assist plugins are not installed
2. **Missing AI Tables** - The AI-related system tables haven't been created
3. **Instance Configuration** - Now Assist features are enabled but the underlying infrastructure isn't set up
4. **Sub-Production Instance Issues** - Cloned instances may have AI features enabled without the required tables
5. **License/Entitlement Issues** - Now Assist requires specific licensing

## Resolution Steps

### Step 1: Verify Now Assist Plugin Installation

1. Navigate to **System Definition > Plugins** (`sys_plugins.list`)
2. Search for the following plugins and verify they are installed and active:
   - `com.snc.generative_ai_controller` - Generative AI Controller
   - `com.snc.now_assist_common` - Now Assist Common
   - `com.snc.now_assist_catalog` - Now Assist for Service Catalog (if available)

If these plugins are not installed, you need to install them through the ServiceNow Store or request activation from ServiceNow.

### Step 2: Check AI System Tables

1. Navigate to **System Definition > Tables** (`sys_db_object.list`)
2. Search for `sys_ai_record_activity`
3. If the table doesn't exist, the Now Assist plugins need to be properly installed

### Step 3: Disable Now Assist for Catalog Items (Temporary Workaround)

If you don't have Now Assist licensing or need a quick fix:

1. Navigate to **Service Catalog > Catalog Definitions > Maintain Items**
2. Open your catalog item
3. Look for any Now Assist or AI-related settings and disable them
4. Alternatively, check **System Properties** for AI-related properties:
   - Navigate to `sys_properties.list`
   - Search for properties containing `ai` or `now_assist`
   - Set `glide.ai.enabled` to `false` if you want to disable AI features instance-wide

### Step 4: Check System Properties

Review and adjust these properties as needed:

| Property Name | Description | Recommended Action |
|--------------|-------------|-------------------|
| `glide.ai.enabled` | Master switch for AI features | Set to `false` to disable |
| `sn_gen_ai.enable_catalog_assist` | Now Assist for Catalog | Set to `false` if not licensed |
| `sn_gen_ai.enabled` | Generative AI features | Set to `false` if not licensed |

### Step 5: For Sub-Production/Clone Instances

If this is a cloned instance:

1. AI configurations may have been copied from production
2. Navigate to **System Clone > Exclude Tables** and ensure AI tables are excluded from future clones
3. Run the following script in **Scripts - Background** to check AI configuration:

```javascript
// Check AI-related system properties
var gr = new GlideRecord('sys_properties');
gr.addQuery('name', 'CONTAINS', 'ai');
gr.query();
while (gr.next()) {
    gs.info(gr.name + ' = ' + gr.value);
}
```

### Step 6: Contact ServiceNow Support

If the above steps don't resolve the issue:

1. Open a case with ServiceNow Support
2. Provide the exact error message
3. Include your instance version and installed plugins
4. Mention if this is a production or sub-production instance

## Prevention

To prevent this issue in the future:

1. Ensure Now Assist licensing is in place before enabling AI features
2. When cloning instances, exclude AI configuration tables
3. Test AI features in sub-production before enabling in production
4. Keep plugins updated to the latest versions

## Related Tables

The following tables are part of Now Assist infrastructure:

- `sys_ai_record_activity` - AI Record Activity tracking
- `sys_ai_config` - AI Configuration
- `sys_ai_model` - AI Models
- `sn_gen_ai_*` - Generative AI tables

## Notes About Your STICE Booking Widget

Your current widget code (STICE Booking System) does not directly reference Now Assist. The error is occurring at the platform level, not within your widget scripts. Once the Now Assist configuration is resolved, your booking widget should function normally.

---

**Document Created:** January 28, 2026  
**ServiceNow Instance Type:** Sub-Production (stdev_1)  
**Error Context:** Now Assist for Catalog Items
