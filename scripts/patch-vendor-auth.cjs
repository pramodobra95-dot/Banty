const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'server.ts');
let source = fs.readFileSync(file, 'utf8');

// The registration flow already persists the vendor's real password hash in
// vendor_registrations. Approval must never invent a different password and email it.
const approvalMarker = '    let password = "PartnerTempPass123!"; // generate friendly temp password for login';
const approvalReplacement = '    let password: string | undefined; // Keep the password created during vendor registration';

if (source.includes(approvalMarker)) {
  source = source.replace(approvalMarker, approvalReplacement);
  console.log('[Vendor Auth Patch] Approval no longer replaces the vendor registration password.');
} else if (source.includes(approvalReplacement)) {
  console.log('[Vendor Auth Patch] Approval password protection already present.');
} else {
  throw new Error('Vendor approval password marker not found; refusing to modify server.ts.');
}

fs.writeFileSync(file, source, 'utf8');
