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

// The production /api/products handler was still serving the old in-memory seed catalog,
// which meant products inserted into PostgreSQL were invisible on the live marketplace.
// Install this middleware immediately after JSON parsing so the real database catalog wins.
const productApiMarker = 'app.use(express.json());';
const productApiPatch = `app.use(express.json());

  app.get('/api/products', async (req, res, next) => {
    try {
      if (pgPool) {
        const result = await pgPool.query('SELECT * FROM products WHERE approved = true ORDER BY "createdAt" DESC NULLS LAST');
        res.set('Cache-Control', 'no-store');
        return res.json(result.rows);
      }
    } catch (err) {
      console.error('[Catalog] PostgreSQL product read failed:', err);
    }
    return next();
  });`;

if (source.includes(productApiPatch)) {
  console.log('[Catalog Patch] PostgreSQL-backed /api/products already present.');
} else if (source.includes(productApiMarker)) {
  source = source.replace(productApiMarker, productApiPatch);
  console.log('[Catalog Patch] /api/products now reads approved products from PostgreSQL.');
} else {
  throw new Error('Catalog API marker not found; refusing to modify server.ts.');
}

fs.writeFileSync(file, source, 'utf8');
