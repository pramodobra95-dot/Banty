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

// Product-first paint patch: the homepage must not wait for the full dashboard data
// bundle before showing the catalog. Fetch only the lightweight product card fields
// independently and put them into the existing product state immediately. This does
// not touch leads, vendors, blogs, banners, notifications, or their fetch flows.
const appFile = path.join(process.cwd(), 'src', 'App.tsx');
let appSource = fs.readFileSync(appFile, 'utf8');
const productFastMarker = '  // PRODUCT-FIRST CATALOG REFRESH: load catalog independently from dashboard data';
const productFastPatch = [
  productFastMarker,
  '  useEffect(() => {',
  '    if (!isSupabaseConfigured) return;',
  '    let cancelled = false;',
  '    const refreshCatalogFirst = async () => {',
  '      try {',
  '        const { data, error } = await supabase',
  '          .from("products")',
  '          .select("id,name,description,images,pricing,features,rating,category,vendorId,vendorName,isFeatured,approved,views,brochureUrl,videoUrl,faqs,createdAt,showSimilar")',
  '          .eq("approved", true)',
  '          .order("createdAt", { ascending: false });',
  '        if (!cancelled && !error && Array.isArray(data)) {',
  '          setProducts(data as Product[]);',
  '          try { localStorage.setItem("cache_products", JSON.stringify(data)); } catch {}',
  '        }',
  '      } catch (err) {',
  '        console.warn("Catalog-first refresh failed; keeping cached products:", err);',
  '      }',
  '    };',
  '    refreshCatalogFirst();',
  '    return () => { cancelled = true; };',
  '  }, []);',
  ''
].join('\n');

const productFastInsertMarker = '  // Fetch all states from Supabase or Express fullstack API on mount';
if (!appSource.includes(productFastMarker)) {
  if (!appSource.includes(productFastInsertMarker)) {
    throw new Error('App catalog fetch marker not found; refusing to modify App.tsx.');
  }
  appSource = appSource.replace(productFastInsertMarker, productFastPatch + productFastInsertMarker);
  fs.writeFileSync(appFile, appSource, 'utf8');
  console.log('[Catalog Speed Patch] Added independent product-first refresh.');
} else {
  console.log('[Catalog Speed Patch] Independent product-first refresh already present.');
}

// Remove the visible blurred/skeleton product cards. The catalog should render real
// product cards whenever data exists and otherwise remain clean rather than showing
// fake loading placeholders. Only the two product-grid branches in HomeView are touched.
const homeFile = path.join(process.cwd(), 'src', 'components', 'HomeView.tsx');
let homeSource = fs.readFileSync(homeFile, 'utf8');
const skeletonMarker = '            {products.length === 0 ? (';
if (homeSource.includes(skeletonMarker)) {
  homeSource = homeSource.replace(/\{products\.length === 0 \? \(/g, '{false ? (');
  fs.writeFileSync(homeFile, homeSource, 'utf8');
  console.log('[Catalog UI Patch] Removed product skeleton placeholders from homepage grids.');
} else {
  console.log('[Catalog UI Patch] Product skeleton placeholders already removed.');
}
