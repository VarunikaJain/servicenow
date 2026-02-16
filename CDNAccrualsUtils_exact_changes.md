# Exact Changes to CDNAccrualsUtils Script Include

## How It Works (Before Changes)

| Method | Called When | What It Does |
|--------|-----------|-------------|
| `saveData` | New submission | Builds SAP payload, sends to SAP (Check + Save), gets SAP ID and approvers |
| `editData` | Edit/resubmit of existing record | Updates the procurement case record in ServiceNow, optionally re-fetches approvers |
| `updateSapDataOnEditing` | Edit of existing record | Sends updated data to SAP (Check + Save) |
| `retrieveData` | Loading edit form | Retrieves record data for the edit form |

**Important**: `saveData` does NOT create the procurement case record. It only talks to SAP. The record is created when `g_form.submit()` is called in the catalog client script callback -- the Record Producer handles saving all variables including `u_contract` and `u_people_in_cc` automatically.

---

## CHANGE A: retrieveData method

**Purpose**: Include contract and people_in_cc when loading data for the edit form.

**Find** (around line 114):
```javascript
            el.sap_id = pr.u_sap_id + "";
        }
```

**Replace with**:
```javascript
            el.sap_id = pr.u_sap_id + "";
            el.contract = pr.u_contract + "";
            el.people_in_cc = pr.u_people_in_cc + "";
        }
```

---

## CHANGE B: editData method

**Purpose**: Save contract and people_in_cc when editing an existing record.

**Find** (around line 138-140):
```javascript
        var u_save_as_draft = this.getParameter('sysparm_u_save_as_draft');
        var u_ready_for_submition = this.getParameter('sysparm_u_ready_for_submition');
        var empty_tax = this.getParameter('sysparm_empty_tax');
```

**Replace with**:
```javascript
        var u_save_as_draft = this.getParameter('sysparm_u_save_as_draft');
        var u_ready_for_submition = this.getParameter('sysparm_u_ready_for_submition');
        var empty_tax = this.getParameter('sysparm_empty_tax');
        var contract = this.getParameter('sysparm_contract');
        var people_in_cc = this.getParameter('sysparm_people_in_cc');
```

**Find** (around line 153-154):
```javascript
            pr.short_description = shortDescription;
            pr.u_catcherror = "";
```

**Replace with**:
```javascript
            pr.short_description = shortDescription;
            pr.u_contract = contract;
            pr.u_people_in_cc = people_in_cc;
            pr.u_catcherror = "";
```

**Find** (around line 159-161, where header JSON is updated with note):
```javascript
            var u_header_json_note = JSON.parse(pr.u_header_json);
            u_header_json_note.Znote = note;
            pr.u_header_json = JSON.stringify(u_header_json_note);
```

**Replace with**:
```javascript
            var u_header_json_note = JSON.parse(pr.u_header_json);
            u_header_json_note.Znote = note;
            u_header_json_note.Zvgbel = contract;
            pr.u_header_json = JSON.stringify(u_header_json_note);
```

---

## CHANGE C: saveData method

**Purpose**: Include contract in the SAP payload sent during new submission.

`saveData` does NOT save to the ServiceNow table -- the Record Producer handles that via `g_form.submit()`. So we only need to add the contract to the SAP payload.

**Find** (around line 289-291):
```javascript
        var empty_tax = this.getParameter('sysparm_empty_tax');
        var header_json = this.getParameter('sysparm_header_json').toString();
        var pc_record_sys_id = this.getParameter('sysparm_unique_value').toString();
```

**Replace with**:
```javascript
        var empty_tax = this.getParameter('sysparm_empty_tax');
        var header_json = this.getParameter('sysparm_header_json').toString();
        var pc_record_sys_id = this.getParameter('sysparm_unique_value').toString();
        var contract = this.getParameter('sysparm_contract');
```

The contract value is already included in the `header_json` (because we added `body.Zvgbel = contract` in the `setHeaderJson()` catalog client script). So the `partial` object (parsed from `header_json`) will automatically contain `Zvgbel` when sent to SAP via `Check Data Integrity`.

**No additional changes needed in saveData** for the SAP payload because `partial = JSON.parse(header_json)` already contains `Zvgbel` from the client-side `setHeaderJson()` function.

However, if you want to be defensive and ensure it's always set:

**Find** (around line 302-304):
```javascript
        partial.Zwf = "";
        partial.Zaction = "C";
        partial.Zstatus = "D";
```

**Replace with**:
```javascript
        partial.Zwf = "";
        partial.Zaction = "C";
        partial.Zstatus = "D";
        if (contract) {
            partial.Zvgbel = contract;
        }
```

---

## CHANGE D: updateSapDataOnEditing method

**Purpose**: Include contract in the SAP payload when editing.

**Find** (around line 604):
```javascript
            partial.ZheaderText = this.getParameter("sysparm_header_text");
```

**Replace with**:
```javascript
            partial.ZheaderText = this.getParameter("sysparm_header_text");
            partial.Zvgbel = this.getParameter("sysparm_contract") || "";
```

---

## Summary of All Script Include Changes

| Method | Line Area | Change |
|--------|-----------|--------|
| `retrieveData` | ~114 | Add `el.contract` and `el.people_in_cc` to returned object |
| `editData` | ~138-140 | Read `sysparm_contract` and `sysparm_people_in_cc` parameters |
| `editData` | ~153-154 | Set `pr.u_contract` and `pr.u_people_in_cc` on the record |
| `editData` | ~159-161 | Add `Zvgbel` to the header JSON |
| `saveData` | ~289-291 | Read `sysparm_contract` parameter |
| `saveData` | ~302-304 | Defensively set `partial.Zvgbel` |
| `updateSapDataOnEditing` | ~604 | Add `partial.Zvgbel` to the SAP payload |

**Note about People in CC**: The `people_in_cc` field does NOT need to go to SAP -- it's only used within ServiceNow for email notifications. It only needs to be saved to the record in `editData` and returned in `retrieveData`.
