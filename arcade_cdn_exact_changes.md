# Exact Code Changes for Contract and People in CC Fields

## Architecture Understanding

The ARCaDe form has TWO separate pages:
1. **Record Producer** (creation form) - variables rendered via `g_form`, submission via catalog client script
2. **CDN_Summary widget** (details/edit page) - separate widget HTML at `cdn_request_details`

Both need to be updated independently.

---

## CHANGE 1: Add Table Fields

On table `sn_spend_psd_procurement_request`, add:

| Column Label | Column Name | Type | Max Length |
|-------------|------------|------|-----------|
| Contract | u_contract | String | 10 |
| People in CC | u_people_in_cc | String | 4000 |

---

## CHANGE 2: Add Record Producer Variables

On the ARCaDe Record Producer, add two new variables:

### Contract Variable:
| Property | Value |
|----------|-------|
| Type | Single Line Text |
| Name | u_contract |
| Question | Contract |
| Max Length | 10 |
| Order | 225 (places it right after Header text which is 220) |

### People in CC Variable:
| Property | Value |
|----------|-------|
| Type | String |
| Name | u_people_in_cc |
| Question | People in CC |
| Help text | Comma separated e-mail address of Distribution Lists (DLs), contacts not found in People in CC etc. |
| Order | Set just above OTHER FILE TO EXCHANGE section |

---

## CHANGE 3: Catalog Client Script - onSubmit (the submission script)

### 3a. Add variable reads at the top (where all other g_form.getValue calls are):

```javascript
// ADD these two lines alongside the existing variable reads:
var contract = g_form.getValue("u_contract");
var people_in_cc = g_form.getValue("u_people_in_cc");
```

### 3b. Add Contract validation before submission:

```javascript
// ADD this validation inside onSubmit(), before the check validation:
if (contract && contract.length > 10) {
    confirm("Contract field must not exceed 10 characters.");
    return false;
}
```

### 3c. Include Contract in the NEW submission GlideAjax call (saveData):

```javascript
// In the else block where ga = new GlideAjax('CDNAccrualsUtils') with saveData:
// ADD these lines alongside the other ga.addParam calls:
ga.addParam('sysparm_contract', contract);
ga.addParam('sysparm_people_in_cc', people_in_cc);
```

### 3d. Include Contract in the EDIT submission GlideAjax call (updateSapDataOnEditing):

```javascript
// In the if block where gaUpdateSap = new GlideAjax('CDNAccrualsUtils') with updateSapDataOnEditing:
// ADD these lines alongside the other gaUpdateSap.addParam calls:
gaUpdateSap.addParam('sysparm_contract', contract);
gaUpdateSap.addParam('sysparm_people_in_cc', people_in_cc);
```

### 3e. Include Contract in the editData GlideAjax call:

```javascript
// Inside the updateSapData function, in the ga with 'editData':
// ADD these lines:
ga.addParam('sysparm_contract', contract);
ga.addParam('sysparm_people_in_cc', people_in_cc);
```

### 3f. Include Contract in setHeaderJson():

```javascript
// In the setHeaderJson() function, ADD this line after body.Znote = note;
body.Zvgbel = g_form.getValue("u_contract");
```

### Full updated setHeaderJson function:

```javascript
function setHeaderJson() {
    var sap_id = "";
    if (g_scratchpad.is_editing != -1) {
        sap_id = g_form.getValue("sap_id");
    }

    var dir_ship_to = g_form.getValue("u_direct_ship_to");
    var fnl_ship_to = g_form.getValue("u_final_ship_to");
    var reason = g_form.getValue("u_reason_code");
    reason = reason.slice(0, 4);
    var currency = g_form.getValue("u_currency").toUpperCase();
    currency = currency.slice(0, 3);
    var tax_code = g_form.getValue("u_tax_code").toUpperCase();
    tax_code = tax_code.slice(0, 2);
    var short_description = g_form.getValue("short_description");
    var note = g_form.getValue("note");
    var contract = g_form.getValue("u_contract");  // NEW
    var action_type = "C";
    var zwf = "1";
    var now = "20241108230000";
    var status = "D";
    var statusN = "Draft";
    var doc_type = "";
    var doc_type_name = "";
    var check = g_form.getValue("case_type");

    if (check == "112") {
        doc_type = "CR";
        doc_type_name = "Credit";
    } else {
        doc_type = "DN";
        doc_type_name = "Debit";
    }

    var body = {};

    body.ZdocumentNr = sap_id;
    body.Zaction = action_type;
    body.Zwf = zwf;
    body.ZcreateDateTime = now;
    body.Zstatus = status;
    body.ZstatusN = statusN;
    body.ZdocumentType = doc_type;
    body.ZdocumentTypeN = doc_type_name;
    body.Zreason = reason;
    body.Zwaers = currency;
    body.ZdirectShipTo = dir_ship_to.substring(0, 10);
    body.ZfinalShipTo = fnl_ship_to.substring(0, 10);
    body.ZtaxCode = tax_code;
    body.ZheaderText = short_description;
    body.Znote = note;
    body.Zvgbel = contract;  // NEW - maps to SAP ZBL14-VGBEL

    g_form.setValue("u_header_json", JSON.stringify(body));
}
```

---

## CHANGE 4: CDNAccrualsUtils Script Include

In the `CDNAccrualsUtils` Script Include, update these methods:

### 4a. saveData method - add contract and people_in_cc:

```javascript
// Where other parameters are read, ADD:
var contract = this.getParameter('sysparm_contract');
var people_in_cc = this.getParameter('sysparm_people_in_cc');

// Where the procurement case record is created/updated, ADD:
gr.setValue('u_contract', contract);
gr.setValue('u_people_in_cc', people_in_cc);
```

### 4b. editData method - add contract and people_in_cc:

```javascript
// Where other parameters are read, ADD:
var contract = this.getParameter('sysparm_contract');
var people_in_cc = this.getParameter('sysparm_people_in_cc');

// Where the record is updated, ADD:
gr.setValue('u_contract', contract);
gr.setValue('u_people_in_cc', people_in_cc);
```

### 4c. updateSapDataOnEditing method - include contract in SAP payload:

```javascript
// Where the SAP API payload is built, ADD contract (VGBEL):
var contract = this.getParameter('sysparm_contract');
// Include in the header JSON or API payload as VGBEL
```

---

## CHANGE 5: CDN_Summary Widget - HTML Template

### 5a. Add Contract field next to Header text:

Find this block in the HTML:

```html
<div class='info'>
    <span class='info-label'>Header text</span>
    <input type='text' id='cd_db' class='form-control info-value' ng-model='c.data.headerText'readonly/>
</div>
```

Add Contract right after it:

```html
<div class='info'>
    <span class='info-label'>Header text</span>
    <input type='text' id='cd_db' class='form-control info-value' ng-model='c.data.headerText'readonly/>
</div>
<div class='info'>
    <span class='info-label'>Contract</span>
    <input type='text' id='contract' class='form-control info-value' ng-model='c.data.contract' ng-readonly="c.data.edit_form == 'false'" maxlength="10"/>
</div>
```

### 5b. Add People in CC field (above the invoice table section):

Find the closing of the form-container div and add People in CC before the table-container:

```html
<!-- ADD after the Note field and before the table-container div -->
<div class='info people-in-cc-section'>
    <span class='info-label'>People in CC</span>
    <p class='help-text'>Comma separated e-mail address of Distribution Lists (DLs), contacts not found in People in CC etc.</p>
    <input type='text' id='people_in_cc' class='form-control info-value' ng-model='c.data.people_in_cc' ng-readonly="c.data.edit_form == 'false'" placeholder="Enter email addresses separated by commas"/>
</div>
```

---

## CHANGE 6: CDN_Summary Widget - Server Script

### 6a. On load - read Contract and People in CC from the record:

In the `if (gr.next())` block where other fields are read, ADD:

```javascript
data.contract = gr.getValue('u_contract') || '';
data.people_in_cc = gr.getValue('u_people_in_cc') || '';
```

### 6b. On resubmit - save Contract and People in CC:

In the `else if (input.action == "resubmit")` block, ADD:

```javascript
gr.u_contract = input.contract;
gr.u_people_in_cc = input.people_in_cc;
```

---

## CHANGE 7: CDN_Summary Widget - Client Controller

### 7a. Include Contract and People in CC in the resubmit action:

In the `$rootScope.$on('yz', ...)` handler, ADD:

```javascript
c.data.contract = document.getElementById("contract").value;
c.data.people_in_cc = document.getElementById("people_in_cc").value;
```

---

## CHANGE 8: REST Message Update (SAP Integration for Contract)

In the REST Message `ST - S4 Hana - Credit Debit Notes`:

### 8a. Update the check data integrity HTTP method:

Add `Zvgbel` / `VGBEL` to the request body/payload template if the header JSON is sent to SAP during the check.

Since the `setHeaderJson()` function now includes `body.Zvgbel = contract`, and the header JSON is sent to SAP via the `sysparm_header_json` parameter, the Contract value will automatically be included in the SAP payload through the header JSON. No separate REST Message changes should be needed IF the header JSON is passed directly to SAP.

If the SAP endpoint has a separate field for VGBEL outside the header JSON, add it as a new variable substitution in the relevant HTTP methods.

---

## CHANGE 9: Notification Update (People in CC)

### 9a. Create a Notification Email Script:

| Property | Value |
|----------|-------|
| Name | CDN Add People in CC |

```javascript
(function runMailScript(current, template, email, email_action, event) {
    var ccEmails = current.getValue('u_people_in_cc');
    if (ccEmails) {
        var emailList = ccEmails.split(',');
        for (var i = 0; i < emailList.length; i++) {
            var addr = emailList[i].trim();
            if (addr) {
                // Check if it's a sys_id (user reference) or an email address
                if (addr.indexOf('@') > -1) {
                    email.addAddress('cc', addr);
                } else {
                    var userGr = new GlideRecord('sys_user');
                    if (userGr.get(addr)) {
                        var userEmail = userGr.getValue('email');
                        if (userEmail) {
                            email.addAddress('cc', userEmail);
                        }
                    }
                }
            }
        }
    }
})(current, template, email, email_action, event);
```

### 9b. Attach to approval notifications:

Add this mail script to the approval notification records used in the CDN flow (the ones triggered by Fire Event in steps 9 and 46 of the main flow).

---

## Summary of All Changes

| # | File/Object | Change |
|---|-------------|--------|
| 1 | Table `sn_spend_psd_procurement_request` | Add `u_contract` (String 10) and `u_people_in_cc` (String 4000) |
| 2 | Record Producer (Variables) | Add `u_contract` (order 225) and `u_people_in_cc` |
| 3a | Catalog Client Script (top) | Add `g_form.getValue` for both new fields |
| 3b | Catalog Client Script (onSubmit) | Add contract length validation |
| 3c | Catalog Client Script (saveData) | Add `ga.addParam` for both fields |
| 3d | Catalog Client Script (updateSapDataOnEditing) | Add `gaUpdateSap.addParam` for both fields |
| 3e | Catalog Client Script (editData) | Add `ga.addParam` for both fields |
| 3f | Catalog Client Script (setHeaderJson) | Add `body.Zvgbel = contract` |
| 4a | CDNAccrualsUtils (saveData) | Read and save both fields |
| 4b | CDNAccrualsUtils (editData) | Read and save both fields |
| 4c | CDNAccrualsUtils (updateSapDataOnEditing) | Include contract in SAP payload |
| 5a | CDN_Summary HTML | Add Contract field next to Header text |
| 5b | CDN_Summary HTML | Add People in CC field |
| 6a | CDN_Summary Server Script (load) | Read both fields from record |
| 6b | CDN_Summary Server Script (resubmit) | Save both fields on resubmit |
| 7 | CDN_Summary Client Controller | Include both fields in resubmit data |
| 8 | REST Message (if needed) | Add VGBEL variable substitution |
| 9 | Notification Mail Script | Add People in CC as email CC recipients |
