# ARCaDe Credit/Debit Note - New Fields Implementation Guide

## Requirement Summary

Two new fields must be added to the Credit/Debit Note creation form (Record Producer):

| Field | Type | Max Length | Position | SAP Integration |
|-------|------|-----------|----------|-----------------|
| **Contract** | Free text (String) | 10 characters | Header area, same row as "Header text" | Stored in SAP table ZBL14 field VGBEL on submission |
| **People in CC** | Email list (comma-separated) | Standard format | Footer, above "OTHER FILE TO EXCHANGE" section | Recipients receive approval emails (CC) |

---

## Field 1: Contract

### Step 1: Add Variable to the Record Producer

1. Navigate to **Service Catalog** > **Record Producers**
2. Open the **ARCaDe Credit/Debit Note** record producer
3. Go to the **Variables** tab
4. Click **New** to create a new variable:

| Property | Value |
|----------|-------|
| Type | Single Line Text |
| Name | `contract` |
| Question/Label | `Contract` |
| Max Length | `10` |
| Mandatory | No (as per requirement, it's a free field) |
| Order | Set to appear next to "Header text" (check Header text's order and use a close number) |

### Step 2: Add the Field to the Form Layout (HTML)

The ARCaDe form uses a custom widget/HTML layout. Find the **Header text** field in the HTML template and place the Contract field in the **same row**.

Current Header text section looks approximately like:

```html
<!-- Header text field (existing) -->
<div class="form-group">
    <label>Header text <span class="mandatory">*</span></label>
    <input type="text" ng-model="c.data.header_text" 
           maxlength="25" 
           class="form-control"
           placeholder="Field length must be within 25 characters.">
</div>
```

Change it to a **two-column row** with Contract alongside:

```html
<!-- Header text + Contract (same row) -->
<div class="form-group">
    <div class="row">
        <div class="col-sm-6">
            <label>Header text <span class="mandatory">*</span></label>
            <input type="text" ng-model="c.data.header_text" 
                   maxlength="25" 
                   class="form-control"
                   placeholder="Field length must be within 25 characters.">
        </div>
        <div class="col-sm-6">
            <label>Contract</label>
            <input type="text" ng-model="c.data.contract" 
                   maxlength="10" 
                   class="form-control"
                   placeholder="Max 10 characters">
        </div>
    </div>
</div>
```

### Step 3: Add Client-Side Validation (Catalog Client Script)

Create a new **Catalog Client Script** or add to the existing one:

| Property | Value |
|----------|-------|
| Name | `Validate Contract Field Length` |
| Type | onChange |
| Variable name | `contract` |
| UI Type | Both |

**Script:**

```javascript
function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue === '') return;
    
    if (newValue.length > 10) {
        g_form.setValue('contract', newValue.substring(0, 10));
        g_form.addErrorMessage('Contract field must not exceed 10 characters.');
    }
}
```

Also add validation in the **Check button widget** (the widget that validates form data before submission). In the client script where the check button is handled, add:

```javascript
// Validate Contract field length
var contractValue = c.data.contract || '';
if (contractValue.length > 10) {
    spUtil.addErrorMessage("Contract field must not exceed 10 characters.");
    return;
}
```

### Step 4: Include Contract in the Submission Data (Server Script)

In the **submission catalog client script** (the one triggered on submit), make sure the contract value is included in the data sent to the server:

```javascript
// Add contract to the submission payload
data.contract = g_form.getValue('contract');
```

### Step 5: Store Contract in the Procurement Case Record

In the **server-side script** that creates the Procurement Case record, add:

```javascript
// Store contract value on the procurement case record
gr.setValue('u_contract', input.contract || '');
```

**Note:** You need to first add a field `u_contract` (String, max length 10) to the `sn_spend_psd_procurement_request` table:

1. Navigate to the table: `sn_spend_psd_procurement_request`
2. Go to **Configure** > **Dictionary**
3. Add a new field:
   - Column label: `Contract`
   - Column name: `u_contract`
   - Type: String
   - Max length: 10

### Step 6: Send Contract to SAP (REST API Integration)

The Contract value must be transmitted to SAP in field **ZBL14-VGBEL** when the request is submitted.

#### A. Update the `check data integrity` REST API call

In the **check for inconsistencies** widget (server script), include the contract field in the payload sent to SAP for validation:

```javascript
// Add to the JSON payload sent to SAP during check
payload.VGBEL = input.contract || '';
```

#### B. Update the `header set / save` REST API call

In the **submission script** where the header data is sent to SAP (the "header set save" call), include:

```javascript
// Include contract in the SAP submission payload
// This maps to SAP table ZBL14, field VGBEL
headerData.VGBEL = contract_value;
```

#### C. Update the REST Message if needed

If the REST Message `ST - S4 Hana - Credit Debit Notes` needs a new parameter:

1. Navigate to **System Web Services** > **Outbound** > **REST Message**
2. Open `ST - S4 Hana - Credit Debit Notes`
3. Open the relevant HTTP Method (e.g., `check data integrity` or the save method)
4. Add `VGBEL` to the request body template or as a variable substitution
5. Add it to **Variable Substitutions** with the appropriate test value

#### D. Include Contract in the Header JSON

From the KT document (timestamp 3:25), there is an "Header JSON" that contains all the data sent to SAP on submit. Make sure `VGBEL` (contract) is added to this JSON:

```javascript
// In the Header JSON construction
var headerJson = {
    // ... existing fields ...
    "VGBEL": c.data.contract || ''    // Contract field -> SAP ZBL14-VGBEL
};
```

### Step 7: Display Contract on the Details Page

On the `cdn_request_details` portal page, add the Contract field to the request details view so users can see it after submission:

```html
<div class="detail-field">
    <label>Contract</label>
    <span>{{data.contract}}</span>
</div>
```

And in the server script of that widget, retrieve it:

```javascript
data.contract = gr.getValue('u_contract') || '';
```

---

## Field 2: People in CC

### Step 1: Add Variable to the Record Producer

1. Open the **ARCaDe Credit/Debit Note** record producer
2. Go to the **Variables** tab
3. Click **New** to create a new variable:

| Property | Value |
|----------|-------|
| Type | String (or List if using glide_list) |
| Name | `people_in_cc` |
| Question/Label | `People in CC` |
| Help text | `Comma separated e-mail address of Distribution Lists (DLs), contacts not found in People in CC etc.` |
| Mandatory | No |
| Order | Set to appear just above "OTHER FILE TO EXCHANGE" section |

### Step 2: Add Field to the Procurement Case Table

Add a new field to `sn_spend_psd_procurement_request`:

1. Navigate to the table dictionary
2. Add a new field:
   - Column label: `People in CC`
   - Column name: `u_people_in_cc`
   - Type: **List** (of `sys_user`) for the user picker, OR **String** (max 4000) for comma-separated emails
   
**Recommended approach:** Use **two fields** for maximum flexibility:
   - `u_people_in_cc` (List of sys_user) - for the searchable user picker
   - `u_people_in_cc_emails` (String) - for manually typed email addresses / DLs

### Step 3: Add the Field to the Form Layout (HTML)

Place this in the **footer area**, just above "OTHER FILE TO EXCHANGE":

```html
<!-- People in CC Section - placed above OTHER FILE TO EXCHANGE -->
<div class="form-group people-in-cc-section">
    <label>
        People in CC 
        <span class="cc-info-icon" title="Info">&#x2716;</span>
    </label>
    <p class="help-text text-muted">
        Comma separated e-mail address of Distribution Lists (DLs), 
        contacts not found in People in CC etc.
    </p>
    <sn-record-picker
        field="c.data.people_in_cc"
        table="'sys_user'"
        display-field="'name'"
        display-fields="'email'"
        value-field="'sys_id'"
        search-fields="'name,email,user_name,employee_number'"
        multiple="true"
        page-size="20"
        placeholder="Search by name, email, Ed account...">
    </sn-record-picker>
    
    <!-- Additional free text for external emails / DLs -->
    <input type="text" 
           ng-model="c.data.people_in_cc_emails" 
           class="form-control" 
           style="margin-top: 8px;"
           placeholder="Add external email addresses (comma separated)">
</div>

<!-- OTHER FILE TO EXCHANGE section (existing) -->
<div class="other-files-section">
    <h4>OTHER FILE TO EXCHANGE (DESIGN SCHEMA, NDA...ETC)</h4>
    <div class="attachment-section">
        <a href="javascript:void(0)">Add attachments</a>
    </div>
</div>
```

**Key features matching the requirement:**
- `sn-record-picker` with `multiple="true"` enables ISTM-style multi-user search
- `search-fields="'name,email,user_name,employee_number'"` enables search by name, email, and Ed account
- `display-fields="'email'"` shows email alongside the name in search results
- Additional text input for external emails/DLs not in ServiceNow

### Step 4: Add the CSS Styling

Match the look from the screenshot (blue border, help text):

```css
.people-in-cc-section {
    border: 2px solid #1996cb;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
}

.people-in-cc-section .help-text {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 8px;
}

.people-in-cc-section .cc-info-icon {
    cursor: pointer;
    color: #1996cb;
    margin-left: 4px;
}
```

### Step 5: Store People in CC on Submission

In the **server-side submission script**, save the CC list:

```javascript
// Store People in CC on the procurement case record
if (input.people_in_cc) {
    gr.setValue('u_people_in_cc', input.people_in_cc);
}
if (input.people_in_cc_emails) {
    gr.setValue('u_people_in_cc_emails', input.people_in_cc_emails);
}
```

### Step 6: Update Approval Notifications to Include CC Recipients

This is the critical integration step. The approval emails must include the People in CC.

#### A. Find the Notification Records

From the KT document, the approval notifications are:
- Notification to approvers (triggered by Fire Event in the flow)
- Standard closure notification
- Technical failure notifications

1. Navigate to **System Notification** > **Email** > **Notifications**
2. Find the approval notification used in the CDN flow
3. Open it

#### B. Modify the Notification to Add CC Recipients

**Option 1: Using a Mail Script (Recommended)**

Create or update a **Mail Script** that adds CC recipients:

1. Navigate to **System Notification** > **Email** > **Notification Email Scripts**
2. Create a new mail script:

| Property | Value |
|----------|-------|
| Name | `CDN Add People in CC` |
| Script | See below |

```javascript
(function runMailScript(current, template, email, email_action, event) {
    
    // Get the procurement case record
    var pcGr = current; // or look up from related record if notification is on approvals table
    
    // Add sys_user CC recipients
    var ccUsers = pcGr.getValue('u_people_in_cc');
    if (ccUsers) {
        var userList = ccUsers.split(',');
        for (var i = 0; i < userList.length; i++) {
            var userGr = new GlideRecord('sys_user');
            if (userGr.get(userList[i].trim())) {
                var userEmail = userGr.getValue('email');
                if (userEmail) {
                    email.addAddress('cc', userEmail, userGr.getDisplayValue('name'));
                }
            }
        }
    }
    
    // Add manually entered email addresses
    var ccEmails = pcGr.getValue('u_people_in_cc_emails');
    if (ccEmails) {
        var emailList = ccEmails.split(',');
        for (var j = 0; j < emailList.length; j++) {
            var addr = emailList[j].trim();
            if (addr) {
                email.addAddress('cc', addr);
            }
        }
    }
    
})(current, template, email, email_action, event);
```

3. Attach this mail script to the approval notification:
   - Open the notification record
   - In the **Mail Script** field or **Advanced** tab, reference this script
   - Or add it in the **Email Script** related list

**Option 2: Using the Notification "CC" Field Directly**

If the notification supports it:
1. Open the notification record
2. In the **Who will receive** section
3. Set **CC** to use a mail script or expression that resolves `u_people_in_cc`

#### C. Update the Flow Designer Fire Event

If the approval notification is triggered via **Fire Event** (Step 9 and Step 46 in the main flow):

1. Open the Event Registration for the approval notification event
2. Ensure the event passes the procurement case record
3. The mail script above will read `u_people_in_cc` from the record

### Step 7: Display People in CC on the Details Page

On the `cdn_request_details` page, show who is in CC:

```html
<div class="detail-field" ng-if="data.people_in_cc_display">
    <label>People in CC</label>
    <span>{{data.people_in_cc_display}}</span>
</div>
```

Server script:

```javascript
// Get People in CC display values
var ccUsers = gr.getDisplayValue('u_people_in_cc');
data.people_in_cc_display = ccUsers || '';
var ccEmails = gr.getValue('u_people_in_cc_emails');
if (ccEmails) {
    data.people_in_cc_display += (ccUsers ? ', ' : '') + ccEmails;
}
```

---

## Complete Change Summary

### Database Changes (Table: sn_spend_psd_procurement_request)

| New Field | Column Name | Type | Max Length |
|-----------|------------|------|-----------|
| Contract | `u_contract` | String | 10 |
| People in CC | `u_people_in_cc` | List (sys_user) | - |
| People in CC Emails | `u_people_in_cc_emails` | String | 4000 |

### Record Producer Changes

| Change | What to Do |
|--------|-----------|
| Add `contract` variable | Single Line Text, max 10 chars |
| Add `people_in_cc` variable | Reference/List type |

### Widget/HTML Changes

| Widget | Change |
|--------|--------|
| Record Producer form HTML | Add Contract field next to Header text (same row) |
| Record Producer form HTML | Add People in CC section above OTHER FILE TO EXCHANGE |
| Record Producer form CSS | Add styles for People in CC section |
| Check for inconsistencies widget | Add Contract validation (max 10 chars) |
| cdn_request_details widget | Display Contract and People in CC |

### Client Script Changes

| Script | Change |
|--------|--------|
| Existing validation script | Add Contract length validation (max 10) |
| Submission script | Include `contract` and `people_in_cc` in submission data |

### Server Script Changes

| Script | Change |
|--------|--------|
| Record creation script | Save `u_contract`, `u_people_in_cc`, `u_people_in_cc_emails` |
| Check integrity script | Include VGBEL (contract) in SAP validation payload |
| Header save script | Include VGBEL (contract) in SAP save payload |

### REST API / SAP Integration Changes

| REST Method | Change |
|-------------|--------|
| `check data integrity` | Add VGBEL parameter to request body |
| Header save method | Add VGBEL parameter to request body |
| REST Message variable substitutions | Add VGBEL variable |

### Notification Changes

| Notification | Change |
|-------------|--------|
| Approval notification | Add mail script to include People in CC as email CC recipients |
| Closure notification | Add mail script to include People in CC as email CC recipients |
| Technical failure notifications | Consider if CC people should also receive these |

---

## Testing Checklist

### Contract Field
- [ ] Field visible on the form next to Header text
- [ ] Cannot enter more than 10 characters
- [ ] Error message shown if > 10 characters attempted
- [ ] Value saved to procurement case record on submission
- [ ] Value sent to SAP in field ZBL14-VGBEL during check
- [ ] Value sent to SAP in field ZBL14-VGBEL during save/submit
- [ ] Value visible on the request details page
- [ ] Value preserved when editing a draft record
- [ ] Value included when duplicating a record

### People in CC Field
- [ ] Field visible above OTHER FILE TO EXCHANGE section
- [ ] Can search users by name
- [ ] Can search users by email
- [ ] Can search users by Ed account (employee number / user_name)
- [ ] Can select multiple users
- [ ] Can add external email addresses (comma separated)
- [ ] CC recipients stored on procurement case record
- [ ] CC recipients receive approval notification emails
- [ ] CC recipients receive closure notification emails
- [ ] CC recipients visible on the request details page
- [ ] Email body for CC recipients is unchanged (same as approver email)
- [ ] CC recipients do NOT have approval actions (info only)
