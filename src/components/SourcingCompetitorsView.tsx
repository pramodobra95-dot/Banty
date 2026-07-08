import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Building, ShieldCheck, CheckCircle2, Star, MapPin, 
  Search, Users, Sparkles, Scale, Info, ArrowUpRight, 
  TrendingUp, Copy, Check, Filter, ExternalLink, RefreshCw, AlertTriangle
} from "lucide-react";
import { Vendor, Product } from "../types";

interface SourcingCompetitorsViewProps {
  vendors: Vendor[];
  products: Product[];
  onNavigateToTab: (tab: string) => void;
  onPostLead: (leadData: any) => Promise<void>;
  openSeoViewer: () => void;
}

export default function SourcingCompetitorsView({
  vendors,
  products,
  onNavigateToTab,
  onPostLead,
  openSeoViewer
}: SourcingCompetitorsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVendorForMeta, setSelectedVendorForMeta] = useState<Vendor | null>(null);
  const [metaCopied, setMetaCopied] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'comparisons' | 'vendors'>('comparisons');

  // Competitor data definitions
  const competitors = [
    {
      name: "BANTConfirm",
      role: "SLA-Guaranteed B2B Sourcing Hub",
      leadQuality: "Pre-qualified (BANT verified by experts in 2 hours)",
      spamScore: "Zero Spam (Strict privacy-first routing to exactly 1-2 matches)",
      matchmaking: "Smart matching via precise Budget/SLA requirements",
      pricing: "Transparent, pre-negotiated volume pricing & partner discounts",
      rewards: "Up to 10% cash/referral rewards for IT Sourcing procurement managers",
      verification: "Mandatory GSTIN & PAN background checks on every listed vendor",
      isPremium: true
    },
    {
      name: "IndiaMart",
      role: "Traditional Directory Listing Portal",
      leadQuality: "Unverified (Self-declared keywords, no criteria checks)",
      spamScore: "High (Contact details sold to 15+ competing brokers instantly)",
      matchmaking: "Manual search directory with massive sponsor banners",
      pricing: "Hidden pricing, depends entirely on phone negotiation",
      rewards: "None (Standard ad-revenue model)",
      verification: "Optional self-declared verification badges",
      isPremium: false
    },
    {
      name: "TradeIndia",
      role: "Sponsor-Driven Trade Directory",
      leadQuality: "Unqualified wholesale inquiries",
      spamScore: "High (Mass email broadcasts and unsolicited SMS blasts)",
      matchmaking: "Sponsor-first static category catalogs",
      pricing: "Variable wholesale quotas only",
      rewards: "None",
      verification: "Basic email/mobile verification",
      isPremium: false
    },
    {
      name: "JustDial",
      role: "Local Search Business Directory",
      leadQuality: "Cold consumer inquiries mixed with B2B",
      spamScore: "Extreme (Immediate automated dialers calling you for hours)",
      matchmaking: "Proximity based search with no software expertise",
      pricing: "Manual individual telephone bidding",
      rewards: "None",
      verification: "Business registration check (unverified status common)",
      isPremium: false
    },
    {
      name: "Techjockey",
      role: "Software Licensing Reseller Portal",
      leadQuality: "Standard retail leads with basic requirements",
      spamScore: "Medium (Multiple follow-ups from internal sales agents)",
      matchmaking: "General filterable software list",
      pricing: "List pricing with slight platform commissions",
      rewards: "None",
      verification: "Publisher relationship checks only",
      isPremium: false
    },
    {
      name: "SoftwareSuggest",
      role: "Affiliate & Review Aggregator",
      leadQuality: "Inbound website form fills",
      spamScore: "Medium (Shared leads among up to 4 software publishers)",
      matchmaking: "Review score averages and catalog filters",
      pricing: "Vendor-published standard rates",
      rewards: "None",
      verification: "Software publisher checks only",
      isPremium: false
    }
  ];

  // Helper to filter and search vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = 
        v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.businessCategory.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = selectedLocation === "All" || v.location === selectedLocation;
      const matchesCategory = selectedCategory === "All" || v.businessCategory === selectedCategory;
      
      return matchesSearch && matchesLocation && matchesCategory && v.approved;
    });
  }, [vendors, searchTerm, selectedLocation, selectedCategory]);

  const uniqueLocations = useMemo(() => {
    const locs = vendors.map(v => v.location);
    return ["All", ...Array.from(new Set(locs))];
  }, [vendors]);

  const uniqueCategories = useMemo(() => {
    const cats = vendors.map(v => v.businessCategory);
    return ["All", ...Array.from(new Set(cats))];
  }, [vendors]);

  // Generate dynamic schema markup for SEO
  const seoSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Table",
      "about": "B2B Software Directories and Sourcing Platforms Comparison",
      "mainEntity": competitors.map(c => ({
        "@type": "Organization",
        "name": c.name,
        "description": `${c.name} is a ${c.role} in India.`,
        "review": {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": c.isPremium ? "4.9" : "3.5"
          },
          "author": {
            "@type": "Organization",
            "name": "BANTConfirm Enterprise Sourcing Audit"
          }
        }
      }))
    };
  }, [competitors]);

  const handleCopyMeta = (vendor: Vendor) => {
    const title = `${vendor.companyName} Sourcing, Reviews & GST Verified | BANTConfirm`;
    const desc = `Compare B2B software quotes from ${vendor.companyName}. Verified location: ${vendor.location}, rating: ${vendor.rating}. BANT confirmed procurement process with strict SLAs.`;
    const metaTags = `<title>${title}</title>\n<meta name="description" content="${desc}" />\n<meta name="keywords" content="${vendor.companyName}, BANTConfirm ${vendor.companyName}, verified vendor ${vendor.location}, ${vendor.businessCategory} India" />`;
    
    navigator.clipboard.writeText(metaTags);
    setMetaCopied(true);
    setTimeout(() => setMetaCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,255,0.15),transparent)] pointer-events-none"></div>
          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Search Engine Optimization Engine</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Sourcing Company Profile SEO <br />
              <span className="text-[#FFC107]">& Competitive Platforms Index</span>
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
              Maximize your digital search visibility. BANTConfirm indexes every certified B2B software vendor, GSTIN registration status, and platform comparisons natively—ensuring when corporate buyers search for your brand or standard alternatives (like <strong>IndiaMart, TradeIndia, JustDial, Techjockey</strong>), your qualified profile ranks high.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <button 
                onClick={() => setActiveSegment('comparisons')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeSegment === 'comparisons' 
                    ? 'bg-[#0066FF] text-white shadow-lg' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>BANTConfirm vs Competitors</span>
              </button>
              <button 
                onClick={() => setActiveSegment('vendors')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  activeSegment === 'vendors' 
                    ? 'bg-[#0066FF] text-white shadow-lg' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Certified Company Directory</span>
              </button>
              <button 
                onClick={openSeoViewer}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-400/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Launch Sitemap & XML Robots Hub</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 1: COMPETITOR BATTLECARDS */}
        {activeSegment === 'comparisons' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-[#0066FF] text-xs font-black uppercase tracking-widest">Alternative Sourcing Directory</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                How BANTConfirm Outperforms Traditional Platforms
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Standard catalogs trade in volume and sell your phone number to multiple aggressive callers. We prioritize qualified connections, zero spam, and verified budgets.
              </p>
            </div>

            {/* COMPARISON MATRIX - WEB / DESKTOP VIEW */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hidden md:block">
              <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Structured Competitor Sourcing Matrix
                  </h3>
                  <p className="text-[11px] text-slate-400">Direct comparison for corporate procurement audits and board evaluations</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono px-3 py-1 rounded-full uppercase">
                  JSON-LD Indexed
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px]">Platform Name</th>
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px]">Lead Qualification</th>
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px]">Spam Level</th>
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px]">Verification Standard</th>
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px]">Procurement Rewards</th>
                      <th className="p-4 uppercase tracking-wider font-extrabold text-[10px] text-right">Matchmaking Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {competitors.map((comp) => (
                      <tr 
                        key={comp.name} 
                        className={`transition-colors hover:bg-slate-50/70 ${comp.isPremium ? 'bg-blue-50/30 font-semibold' : ''}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {comp.isPremium ? (
                              <div className="w-5 h-5 bg-[#FFC107] text-slate-900 rounded-md font-black flex items-center justify-center text-[10px]">B</div>
                            ) : (
                              <div className="w-5 h-5 bg-slate-100 text-slate-500 rounded-md font-bold flex items-center justify-center text-[10px]">C</div>
                            )}
                            <div>
                              <span className={`text-slate-900 font-black text-sm ${comp.isPremium ? 'text-blue-700' : ''}`}>
                                {comp.name}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-semibold">{comp.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 leading-relaxed max-w-xs">{comp.leadQuality}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            comp.spamScore.includes("Zero") 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {comp.spamScore}
                          </span>
                        </td>
                        <td className="p-4 leading-relaxed">{comp.verification}</td>
                        <td className="p-4 text-slate-800 font-bold">{comp.rewards}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{comp.isPremium ? "4.9/5.0" : "3.2/5.0"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARDS VIEW - MOBILE SENSITIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
              {competitors.map((comp) => (
                <div 
                  key={comp.name}
                  className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm ${
                    comp.isPremium ? 'border-[#0066FF] ring-2 ring-blue-500/15' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-base text-slate-900">{comp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{comp.role}</p>
                    </div>
                    {comp.isPremium && (
                      <span className="bg-[#FFC107] text-slate-900 font-black text-[9px] px-2 py-0.5 rounded uppercase">Verified Best</span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[9px] block">Lead Quality:</span>
                      <p>{comp.leadQuality}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[9px] block">Spam & Privacy:</span>
                      <p>{comp.spamScore}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[9px] block">Verification Standard:</span>
                      <p>{comp.verification}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[9px] block">Procurement Reward:</span>
                      <p className="font-bold text-slate-800">{comp.rewards}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WHY IT HIGHLIGHTS ON GOOGLE */}
            <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1 md:col-span-2">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Why is this indexed by Google crawlers?
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  This comparison page injects standard industry search terms (e.g. <em>"IndiaMart alternatives"</em>, <em>"TradeIndia vs BANTConfirm"</em>, or <em>"Techjockey software prices"</em>) as semantic page descriptors. When search bots discover the page, they match BANTConfirm as a direct structured alternative—indexing our platform on the first page!
                </p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => onNavigateToTab("post")}
                  className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>Request Premium Quote</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CERTIFIED COMPANY DIRECTORY */}
        {activeSegment === 'vendors' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Search & Filter bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search corporate vendors by company name, location, or product category..."
                  className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                />
              </div>

              <div>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-800"
                >
                  <option value="All">All Locations (India)</option>
                  {uniqueLocations.filter(l => l !== "All").map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-800"
                >
                  <option value="All">All Tech Categories</option>
                  {uniqueCategories.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vendors Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <div 
                  key={vendor.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-[#0066FF] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-5 space-y-4">
                    {/* Upper brand row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={vendor.logo || "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=100&auto=format&fit=crop"} 
                          alt={vendor.companyName}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100"
                        />
                        <div>
                          <h3 className="font-black text-sm text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            {vendor.companyName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{vendor.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                          {vendor.plan}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{vendor.rating?.toFixed(1) || "4.0"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {vendor.docVerified && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>GST & PAN Verified</span>
                        </span>
                      )}
                      {vendor.approved && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          BANT Certified Partner
                        </span>
                      )}
                    </div>

                    {/* Sourcing Stats */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-[10px] text-slate-500 font-mono">
                      <div>
                        <span className="block text-slate-400 uppercase font-bold text-[8px]">Sourcing Solutions:</span>
                        <span className="text-slate-900 font-bold">{vendor.productsCount || 0} Listed</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold text-[8px]">Total Enquiries:</span>
                        <span className="text-slate-900 font-bold">{vendor.leadsCount || 0} Handled</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold text-[8px]">Registration Status:</span>
                        <span className="text-emerald-600 font-bold uppercase">ACTIVE</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase font-bold text-[8px]">Audit SLA Score:</span>
                        <span className="text-slate-900 font-bold">100% Verified</span>
                      </div>
                    </div>

                    {/* Category list */}
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Main Sourcing Offering:</span>
                      <p className="text-xs font-black text-slate-700">{vendor.businessCategory}</p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setSelectedVendorForMeta(vendor);
                      }}
                      className="text-slate-500 hover:text-blue-600 text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Review SEO Tags</span>
                    </button>

                    <button 
                      onClick={() => {
                        onNavigateToTab("post");
                      }}
                      className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#0066FF] hover:text-blue-700 font-extrabold px-3 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>SLA Match</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SEO Tags visualizer overlay modal */}
            {selectedVendorForMeta && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col font-mono">
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-white font-bold uppercase">{selectedVendorForMeta.companyName} - Meta Specifications</span>
                    </div>
                    <button 
                      onClick={() => setSelectedVendorForMeta(null)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-sans">Index URL Path:</span>
                      <p className="text-blue-300">https://bantconfirm.com/vendors/{selectedVendorForMeta.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-sans">SEO Title:</span>
                      <p className="text-slate-100 font-bold">{selectedVendorForMeta.companyName} Sourcing, Reviews & GST Verified | BANTConfirm</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-sans">SEO Meta Description:</span>
                      <p className="text-slate-300 leading-relaxed font-sans">Compare B2B software quotes from {selectedVendorForMeta.companyName}. Verified location: {selectedVendorForMeta.location}, rating: {selectedVendorForMeta.rating}. BANT confirmed procurement process with strict SLAs.</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-amber-400 uppercase tracking-widest block">HTML Meta Preview:</span>
                      <pre className="bg-slate-950 p-3 rounded-lg text-[10px] text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {`<!-- SEO Meta Tags for ${selectedVendorForMeta.companyName} -->\n`}
                        {`<title>${selectedVendorForMeta.companyName} Sourcing, Reviews & GST Verified | BANTConfirm</title>\n`}
                        {`<meta name="description" content="Compare B2B software quotes from ${selectedVendorForMeta.companyName}. Verified location: ${selectedVendorForMeta.location}, rating: ${selectedVendorForMeta.rating}. BANT confirmed procurement process with strict SLAs." />\n`}
                        {`<meta name="keywords" content="${selectedVendorForMeta.companyName}, BANTConfirm ${selectedVendorForMeta.companyName}, verified vendor ${selectedVendorForMeta.location}" />`}
                      </pre>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                    <button 
                      onClick={() => handleCopyMeta(selectedVendorForMeta)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                    >
                      {metaCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{metaCopied ? 'Copied' : 'Copy HTML Meta Tags'}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedVendorForMeta(null)}
                      className="bg-[#0066FF] hover:bg-blue-700 text-white py-1.5 px-3 rounded text-[10px] cursor-pointer font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
