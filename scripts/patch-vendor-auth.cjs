const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'server.ts');
let source = fs.readFileSync(file, 'utf8');

const required = [
  'let password = "PartnerTempPass123!"; // generate friendly temp password for login',
  'const user = db.users?.find((u: any) => u.email.toLowerCase() === emailLower);',
  'user.password = newPassword; // Update local credentials'
];
for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`Vendor auth build patch marker not found: ${marker}`);
  }
}

// Preserve the password created at vendor registration. The old approval flow emailed a
// hard-coded temporary password without updating the persistent vendor password hash.
source = source.replace(
  '    let password = "PartnerTempPass123!"; // generate friendly temp password for login',
  '    let password: string | undefined;\n    let passwordWasGenerated = false;\n\n    // Never replace an existing vendor password during approval. If this registration\n    // was created without a persistent password hash (for example, an admin-created\n    // vendor), generate one and persist it before sending credentials.\n    let vendorAuthRecord: any = null;\n    if (pgPool) {\n      try {\n        const authQuery = await pgPool.query(\n          "SELECT * FROM vendor_registrations WHERE id = $1 OR LOWER(email) = $2 LIMIT 1",\n          [id, emailLower]\n        );\n        vendorAuthRecord = authQuery.rows[0] || null;\n      } catch (err) {\n        console.error("Failed to load persistent vendor credentials during approval:", err);\n      }\n    }\n    if (!vendorAuthRecord && db.vendor_registrations) {\n      vendorAuthRecord = db.vendor_registrations.find((vr: any) =>\n        vr.id === id || String(vr.email || "").trim().toLowerCase() === emailLower\n      ) || null;\n    }\n\n    if (!vendorAuthRecord?.password_hash && !vendorAuthRecord?.passwordHash) {\n      password = "PartnerTempPass123!";\n      passwordWasGenerated = true;\n      const generatedHash = hashVendorPassword(password);\n      if (pgPool && vendorAuthRecord?.id) {\n        try {\n          await pgPool.query(\n            "UPDATE vendor_registrations SET password_hash = $1 WHERE id = $2",\n            [generatedHash, vendorAuthRecord.id]\n          );\n        } catch (err) {\n          console.error("Failed to persist generated vendor password during approval:", err);\n          return res.status(500).json({ success: false, error: "Could not securely initialize vendor login credentials." });\n        }\n      }\n      if (db.vendor_registrations) {\n        db.vendor_registrations = db.vendor_registrations.map((vr: any) =>\n          (vr.id === id || String(vr.email || "").trim().toLowerCase() === emailLower)\n            ? { ...vr, password_hash: generatedHash }\n            : vr\n        );\n      }\n    }'
);

// Persist approval state in the actual vendor authentication record, including linkage to
// the active vendor and profile. Add columns defensively for existing production schemas.
source = source.replace(
  '    if (pgPool) {\n      try {\n        await pgPool.query(\n          "UPDATE partner_registrations SET status = \'Approved\', \\"userId\\" = $1 WHERE id = $2",\n          [userId, id]\n        );\n      } catch (err) {\n        console.error("Failed to update status of partner registration to Approved in PostgreSQL:", err);\n      }\n    }',
  '    if (pgPool) {\n      try {\n        await pgPool.query(\n          "UPDATE partner_registrations SET status = \'Approved\', \\"userId\\" = $1 WHERE id = $2",\n          [userId, id]\n        );\n      } catch (err) {\n        console.error("Failed to update status of partner registration to Approved in PostgreSQL:", err);\n      }\n\n      try {\n        await pgPool.query("ALTER TABLE vendor_registrations ADD COLUMN IF NOT EXISTS user_id VARCHAR(100)");\n        await pgPool.query("ALTER TABLE vendor_registrations ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(100)");\n        await pgPool.query(\n          "UPDATE vendor_registrations SET status = \'Approved\', user_id = $1, vendor_id = $2 WHERE id = $3 OR LOWER(email) = $4",\n          [userId, vendorId, id, emailLower]\n        );\n      } catch (err) {\n        console.error("Failed to synchronize approved vendor authentication state:", err);\n      }\n    }'
);

// Only send a temporary password when one was genuinely generated. Registered vendors keep
// the password they created during signup; the approval email must not invent another one.
source = source.replace(
  '    sendVendorWelcomeEmail(companionUser.name, companionUser.companyName, companionUser.email, password).catch(console.error);',
  '    sendVendorWelcomeEmail(companionUser.name, companionUser.companyName, companionUser.email, passwordWasGenerated ? password : undefined).catch(console.error);'
);

// Password reset must update the persistent vendor credential, not just the ephemeral JSON user.
source = source.replace(
  '  if (user) {\n    user.password = newPassword; // Update local credentials\n  }',
  '  if (user) {\n    user.password = newPassword; // Update local credentials\n  }\n\n  // Keep vendor password resets synchronized with the PostgreSQL authentication source.\n  if (pgPool) {\n    try {\n      const vendorHash = hashVendorPassword(String(newPassword));\n      await pgPool.query(\n        "UPDATE vendor_registrations SET password_hash = $1 WHERE LOWER(email) = $2",\n        [vendorHash, emailLower]\n      );\n    } catch (err) {\n      console.error("Failed to persist vendor password reset in PostgreSQL:", err);\n      return res.status(500).json({ error: "Password reset could not be securely persisted. Please try again." });\n    }\n  }\n\n  if (db.vendor_registrations) {\n    db.vendor_registrations = db.vendor_registrations.map((vr: any) =>\n      String(vr.email || "").trim().toLowerCase() === emailLower\n        ? { ...vr, password_hash: hashVendorPassword(String(newPassword)) }\n        : vr\n    );\n  }'
);

fs.writeFileSync(file, source, 'utf8');
console.log('[Vendor Auth Patch] Production vendor approval/login/reset synchronization applied.');
