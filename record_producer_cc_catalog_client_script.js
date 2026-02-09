// ============================================================================
// CATALOG CLIENT SCRIPT - CC Field Email Validation
// ============================================================================
//
// Name:        Validate CC Email Addresses
// Applies to:  <Your Record Producer name>
// UI Type:     Both (Desktop & Mobile / Service Portal)
// Type:        onSubmit
//
// Description:
//   Validates the CC field on form submission. Each email address
//   (separated by ';') must contain '@' and '.' to be considered valid.
//   If any address is invalid, submission is blocked and the user is alerted.
// ============================================================================

function onSubmit() {
    var ccField = g_form.getValue('u_cc');

    // CC is optional - if empty, allow submission
    if (!ccField || ccField.trim() === '') {
        return true;
    }

    var emails = ccField.split(';');
    var invalidEmails = [];

    for (var i = 0; i < emails.length; i++) {
        var email = emails[i].trim();

        // Skip empty strings caused by trailing semicolons
        if (email === '') {
            continue;
        }

        // Each address must contain '@' and '.'
        if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            invalidEmails.push(email);
        }
    }

    if (invalidEmails.length > 0) {
        var msg = 'The following CC email address(es) are invalid:\n\n' +
                  invalidEmails.join('\n') +
                  '\n\nEach email address must contain \'@\' and \'.\'. ' +
                  'Separate multiple addresses with \';\'.';
        g_form.showErrorBox('u_cc', 'Invalid email address(es): ' + invalidEmails.join(', ') + ". Each address must contain '@' and '.'");
        g_form.addErrorMessage(msg);
        return false; // Block submission
    }

    return true; // Allow submission
}
