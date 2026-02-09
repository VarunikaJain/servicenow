// ============================================================================
// BUSINESS RULE - Fire Event on Record Producer Submission
// ============================================================================
//
// Navigate to: System Definition > Business Rules > New
//
// Configuration:
// ----------------
// Name:        Record Producer Submission - Fire CC Notification Event
// Table:       <Your Record Producer target table>
// When:        after
// Insert:      true (checked)
// Update:      false (unchecked)
// Active:      true
//
// Advanced:    true (checked)
//
// Condition (optional - to scope it to your specific Record Producer):
//   current.cat_item == '<sys_id_of_your_record_producer>'
//
// ============================================================================

(function executeRule(current, previous /*null when async*/) {

    // Parameter 1 (parm1): the approver's sys_id or email
    //   Adjust the field name to match your approver field
    //   e.g. current.getValue('approval') or current.getValue('assigned_to')
    var approver = current.getValue('assigned_to') || '';

    // Parameter 2 (parm2): the CC email addresses from the u_cc variable
    //   For Record Producers targeting sc_req_item, variables are accessed via:
    //   current.variables.u_cc
    var ccEmails = current.variables.u_cc || '';

    // Fire the event - the Notification will pick this up
    gs.eventQueue(
        '<your_table>.record_producer.submitted',  // Must match Event Registration name
        current,                                     // The current record (GlideRecord)
        approver,                                    // parm1 - passed to Notification
        ccEmails                                     // parm2 - passed to Notification/Mail Script
    );

})(current, previous);
