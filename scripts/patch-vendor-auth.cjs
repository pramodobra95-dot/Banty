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

// Homepage catalog patch: keep ALL products in the data source, but show only the first
// 12 on the homepage. The dedicated /products page already supports search, category
// filtering and sorting, and the new Show More button routes users there.
const homeFile = path.join(process.cwd(), 'src', 'components', 'HomeView.tsx');
let home = fs.readFileSync(homeFile, 'utf8');

const catalogStart = '        {/* A. FEATURED PRODUCTS SECTION */}';
const catalogEnd = '      {/* PROMOTIONAL BANNER SLIDER */}';
const startIndex = home.indexOf(catalogStart);
const endIndex = home.indexOf(catalogEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const catalogReplacement = `        {/* A. PRODUCT CATALOG — compact homepage preview; full directory is available via Show More */}\n        <div className="space-y-6">\n          <div className="border-b border-slate-200 pb-4">\n            <div className="flex items-center justify-between gap-4">\n              <div>\n                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider block">BANTConfirm Product Catalog</span>\n                <h3 className="text-lg md:text-xl font-black text-slate-900 mt-1">Products & Solutions</h3>\n                <p className="text-xs text-slate-500 mt-1">Explore our latest business technology solutions. All available products remain in the catalog.</p>\n              </div>\n              <span className="hidden sm:inline-flex bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{filteredProducts.length} available</span>\n            </div>\n          </div>\n\n          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">\n            {products.length === 0 ? (\n              [...Array(6)].map((_, idx) => (\n                <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs animate-pulse h-[360px]">\n                  <div className="h-40 bg-slate-200" />\n                </div>\n              ))\n            ) : (\n              [...filteredProducts]\n                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())\n                .slice(0, 12)\n                .map((p) => (\n                  <div key={\`catalog-\${p.id}\`} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group relative">\n                    {p.isFeatured && (\n                      <span className="absolute top-3 left-3 bg-yellow-400 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded shadow-sm z-10 flex items-center gap-1">\n                        <Star className="w-3.5 h-3.5 fill-slate-950" /> Featured\n                      </span>\n                    )}\n                    <div onClick={() => handleOpenProduct(p)} className="h-40 bg-slate-100 overflow-hidden relative cursor-pointer">\n                      <img src={p.images?.[0] || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop"} alt={p.name} className="w-full h-full object-cover" />\n                      <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded">{p.category}</span>\n                    </div>\n                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">\n                      <div>\n                        <p className="text-[10px] text-[#0066FF] font-bold uppercase tracking-wider">BANTConfirm Catalog</p>\n                        <h4 onClick={() => handleOpenProduct(p)} className="font-bold text-sm text-slate-800 mt-1 cursor-pointer hover:text-[#0066FF] transition-colors">{p.name}</h4>\n                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>\n                      </div>\n                      <div className="bg-slate-50 p-2.5 rounded-lg border">\n                        <p className="text-[9px] text-slate-400 uppercase font-bold">Estimated Pricing</p>\n                        <p className="text-xs font-black text-slate-800">{p.pricing}</p>\n                      </div>\n                      <div className="grid grid-cols-2 gap-2 pt-1">\n                        <button onClick={() => handleOpenProduct(p)} className="border border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF] text-slate-700 font-semibold py-2 rounded-lg text-xs transition-all cursor-pointer">Specs</button>\n                        <button onClick={() => setSelectedQuoteProduct(p)} className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer">Get Quote</button>\n                      </div>\n                    </div>\n                  </div>\n                ))\n            )}\n          </div>\n\n          {filteredProducts.length > 12 && !selectedCategory && !searchQuery && (\n            <div className="flex justify-center pt-2">\n              <button\n                type="button"\n                onClick={() => navigate("/products")}\n                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"\n              >\n                Show More Products\n                <ArrowRight className="w-4 h-4" />\n              </button>\n            </div>\n          )}\n        </div>\n\n`;
  home = home.slice(0, startIndex) + catalogReplacement + home.slice(endIndex);
  console.log('[Homepage Catalog Patch] Homepage now shows 12 products with Show More to the full catalog.');
} else if (home.includes('Show More Products') && home.includes('slice(0, 12)')) {
  console.log('[Homepage Catalog Patch] Homepage catalog patch already present.');
} else {
  throw new Error('Homepage catalog section markers not found; refusing to modify HomeView.tsx.');
}

fs.writeFileSync(homeFile, home, 'utf8');
`;
