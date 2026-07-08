import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Search, Star, Tag, Layers, Filter, CheckCircle, 
  ArrowUpRight, ArrowLeft, ShieldCheck, Heart, ArrowRight,
  Sparkles, FileText, Info, HelpCircle, Phone, MapPin, Building, Lock, Mail
} from "lucide-react";
import { Product, Category } from "../types";
import { safeAlert } from "../utils/safeAlert";

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onPostLead: (lead: any) => Promise<any>;
  currentUser: any;
  onAddToWishlist: (productId: string) => void;
  wishlist: string[];
}

export default function ProductsView({
  products,
  categories,
  onPostLead,
  currentUser,
  onAddToWishlist,
  wishlist,
}: ProductsViewProps) {
  const { categoryName } = useParams<{ categoryName?: string }>();
  const navigate = useNavigate();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "rating" | "views" | "name">("default");
  
  // Custom BANT modal for directly clicking "Get Free Quote"
  const [selectedQuoteProduct, setSelectedQuoteProduct] = useState<Product | null>(null);
  const [bantSubmitSuccess, setBantSubmitSuccess] = useState(false);
  const [bantForm, setBantForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.mobile || "",
    company: currentUser?.companyName || "",
    city: currentUser?.city || "",
    authority: "yes",
    budget: "",
    timeline: "immediate",
    qty: "10-50 users",
    notes: ""
  });

  // Sync with URL Category Param
  useEffect(() => {
    if (categoryName) {
      // Decode URL string (e.g., "ERP%20Software" -> "ERP Software")
      const decodedCat = decodeURIComponent(categoryName);
      // Check if it matches any category
      const found = categories.find(
        c => c.name.toLowerCase() === decodedCat.toLowerCase()
      );
      if (found) {
        setSelectedCategory(found.name);
      } else {
        setSelectedCategory(decodedCat);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [categoryName, categories]);

  // Sync user profiles with the BANT form
  useEffect(() => {
    if (currentUser) {
      setBantForm(prev => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.mobile || "",
        company: currentUser.companyName || "",
        city: currentUser.city || ""
      }));
    }
  }, [currentUser]);

  // Handle BANT Submit
  const handleBantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteProduct) return;

    const leadData = {
      title: `Quote Request for ${selectedQuoteProduct.name}`,
      category: selectedQuoteProduct.category || "General Software",
      description: `User requested a customized quote for ${selectedQuoteProduct.name}. Description: ${selectedQuoteProduct.description}`,
      budget: bantForm.budget || selectedQuoteProduct.pricing || "₹25,000 - ₹50,000 / month",
      companyName: bantForm.company || "Personal Demo",
      contactName: bantForm.name || "Anonymous Sourcing User",
      mobile: bantForm.phone || "",
      email: bantForm.email || "",
      city: bantForm.city || "",
      timeline: bantForm.timeline || "immediate",
      authority: bantForm.authority || "yes",
      qty: bantForm.qty || "10-50 users",
      notes: bantForm.notes || ""
    };

    try {
      await onPostLead(leadData);
      setBantSubmitSuccess(true);
      safeAlert(`Quote request for ${selectedQuoteProduct.name} submitted successfully under BANT criteria!`, "success");
    } catch (err: any) {
      console.error(err);
      safeAlert("Failed to submit quote request. Please try again.", "error");
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(p => {
    if (!p.approved) return false;

    // Category Filter
    if (selectedCategory && p.category !== selectedCategory) return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchVendor = p.vendorName?.toLowerCase().includes(q) || false;
      return matchName || matchDesc || matchCat || matchVendor;
    }

    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === "views") {
      return (b.views || 0) - (a.views || 0);
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0; // default
  });

  // Top Selling Products & Services (e.g. rating >= 4.7 or specific high converting tools)
  const topSellingProducts = products
    .filter(p => p.approved && (p.id === "prod-1" || p.id === "prod-6" || p.id === "prod-7" || (p.rating && p.rating >= 4.7)))
    .slice(0, 4);

  // Telecom Services & Cloud Telephony specifically
  const telecomProducts = products
    .filter(p => p.approved && (p.category === "Cloud Telephony" || p.category === "Contact Center"))
    .slice(0, 4);

  return (
    <div className="flex-grow bg-slate-50">
      
      {/* Banner/Header */}
      <div className="bg-slate-900 text-white py-12 px-4 md:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Main Solutions
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-slate-300">
              {selectedCategory ? `${selectedCategory} Sourcing` : "All Verified Products"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="bg-[#FFC107] text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                Enterprise Sourcing Catalog
              </span>
              <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                {selectedCategory ? `${selectedCategory} Category` : "Search Certified Software"}
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Browse, compare, and pre-qualify top-tier IT & SaaS solutions in India. Filter by budget, rating, or category.
              </p>
            </div>

            {/* Clear Filters */}
            {selectedCategory && (
              <button
                onClick={() => navigate("/products")}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-0 cursor-pointer shadow-sm self-start transition-all"
              >
                Clear Category Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-slate-400" />
              Keyword Filter
            </h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search CRM, ERP, HRMS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 border-0 bg-transparent font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Filter List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              Browse Categories
            </h4>

            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              <Link
                to="/products"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  !selectedCategory
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>All Solutions</span>
                <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                  {products.filter(p => p.approved).length}
                </span>
              </Link>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.approved && p.category === cat.name
                ).length;

                return (
                  <Link
                    key={cat.id}
                    to={`/category/${encodeURIComponent(cat.name)}`}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat.name
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sorting panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              Sort Criteria
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setSortBy("default")}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  sortBy === "default"
                    ? "bg-slate-100 text-slate-950 border-slate-300 font-bold"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                Default Directory
              </button>
              <button
                type="button"
                onClick={() => setSortBy("rating")}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  sortBy === "rating"
                    ? "bg-slate-100 text-slate-950 border-slate-300 font-bold"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                Highest Rated ⭐
              </button>
              <button
                type="button"
                onClick={() => setSortBy("views")}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  sortBy === "views"
                    ? "bg-slate-100 text-slate-950 border-slate-300 font-bold"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                Most Viewed 👀
              </button>
              <button
                type="button"
                onClick={() => setSortBy("name")}
                className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  sortBy === "name"
                    ? "bg-slate-100 text-slate-950 border-slate-300 font-bold"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                Alphabetical (A-Z)
              </button>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* SPECIAL HIGH ENGAGEMENT SHOWCASES */}
          {!selectedCategory && !searchQuery && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              
              {/* SECTION 1: TOP SELLING PRODUCTS & SERVICES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Sparkles className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        Top Selling Products & Services
                        <span className="text-[9px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse">Hot</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Our most popular solutions trusted by high-growth B2B teams across India.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topSellingProducts.map(p => (
                    <div 
                      key={`top-sell-${p.id}`} 
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                            🔥 Top Seller
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{p.rating}.0</span>
                          </div>
                        </div>

                        <div>
                          <h4 
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="text-xs font-black text-slate-800 group-hover:text-[#0066FF] transition-colors cursor-pointer line-clamp-1"
                          >
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.category} • by {p.vendorName}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 line-clamp-2">{p.description}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-700">{p.pricing}</span>
                        <button 
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="text-[#0066FF] text-[10px] font-extrabold hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                        >
                          <span>Explore Specs</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: TELECOM SERVICES & CLOUD TELEPHONY */}
              <div className="space-y-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        Telecom Services & Cloud Telephony
                        <span className="text-[8px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded font-sans uppercase">SLA Verified</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Virtual PBX, Enterprise SIP Trunks, and omnichannel VoIP systems with localized integration support.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {telecomProducts.map(p => (
                    <div 
                      key={`telecom-${p.id}`} 
                      className="bg-white rounded-2xl p-4 border border-blue-100 hover:border-blue-500 hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            Telecom Sourcing
                          </span>
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Gold Partner
                          </span>
                        </div>

                        <div>
                          <h4 
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                          >
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.category} • by {p.vendorName}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 line-clamp-2">{p.description}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-700">{p.pricing}</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedQuoteProduct(p)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm transition-all"
                          >
                            Get Free Quote
                          </button>
                          <button 
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="text-slate-500 hover:text-blue-600 text-[10px] font-bold border-0 bg-transparent cursor-pointer flex items-center gap-0.5"
                          >
                            <span>Specs</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MAIN CATALOGUE LISTINGS */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {!selectedCategory && !searchQuery ? "Browse All Sourcing Solutions" : "Filtered Solutions Search"}
            </h3>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{sortedProducts.length}</span> solutions
              {selectedCategory && (
                <span> matching <strong className="text-blue-600">{selectedCategory}</strong></span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                ● LIVE B2B INTEGRATED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-lg font-black">
                  ?
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No Enterprise Solutions Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    We couldn't find any verified products matching your keyword search. Try clearing keywords or posting requirements.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/post")}
                  className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md border-0 cursor-pointer"
                >
                  Post Sourcing Requirements
                </button>
              </div>
            ) : (
              sortedProducts.map((p) => {
                const isFavorited = wishlist.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group relative"
                  >
                    {p.isFeatured && (
                      <span className="absolute top-3 left-3 bg-yellow-400 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded shadow-sm z-10 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950" />
                        Premium Sponsored
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => onAddToWishlist(p.id)}
                      className={`absolute top-3 right-3 p-1.5 rounded-full border shadow-sm z-10 transition-all cursor-pointer ${
                        isFavorited
                          ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                          : "bg-white/90 backdrop-blur-xs border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-white"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-600" : ""}`} />
                    </button>

                    {/* Product Image */}
                    <div
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="h-40 bg-slate-100 overflow-hidden relative cursor-pointer"
                    >
                      <img
                        src={p.images?.[0] || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div onClick={() => navigate(`/products/${p.id}`)} className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#0066FF] font-black uppercase tracking-wider">
                            Verified Sourcing
                          </span>
                          <div className="flex items-center text-xs text-yellow-500 font-bold gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span>{p.rating || "4.8"}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 mt-1 line-clamp-1 group-hover:text-[#0066FF] transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Estimated Price Point</p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">{p.pricing || "₹30,000 / month"}</p>
                      </div>

                      {/* Sourcing Concession Badge */}
                      <div className="bg-amber-50/60 text-amber-800 text-[10.5px] px-2.5 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5 font-bold leading-normal">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                        <span>Get up to <strong className="text-amber-950 font-black">10% savings on deal value</strong> when you post an enquiry. <span className="text-[9px] text-slate-400 font-medium block mt-0.5">*Conditions apply.</span></span>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500 truncate max-w-[150px]">
                          By: {p.vendorName || "Certified Partner"}
                        </span>
                        <span className="font-mono text-[9px]">{p.views || 104} Views</span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => navigate(`/products/${p.id}`)}
                          className="border border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF] text-slate-700 font-bold py-2 rounded-lg text-[11px] transition-all cursor-pointer text-center bg-transparent"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuoteProduct(p);
                            setBantSubmitSuccess(false);
                          }}
                          className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-[11px] transition-all cursor-pointer shadow-xs text-center border-0"
                        >
                          Get Free Quote
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DIRECT BANT PARAMETERS QUOTE MODAL */}
      {selectedQuoteProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 text-slate-800">
            {/* Header */}
            <div className="p-5 bg-[#0066FF] text-white flex items-center justify-between">
              <div>
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                  Direct BANT Qualification
                </span>
                <h4 className="font-extrabold text-base text-white mt-1">
                  Get Free Quote for {selectedQuoteProduct.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedQuoteProduct(null)}
                className="text-white/80 hover:text-white text-2xl font-bold cursor-pointer transition-colors border-0 bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {bantSubmitSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-lg">BANT Lead Sourced Successfully!</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Your pre-qualified requirements for <strong>{selectedQuoteProduct.name}</strong> have been saved to the Admin Desk and Supabase database.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[11px] text-slate-400 max-w-sm mx-auto">
                    Gold integration partners matching your budget constraints will contact you shortly.
                  </div>
                  <button
                    onClick={() => setSelectedQuoteProduct(null)}
                    className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs cursor-pointer border-0 shadow-sm"
                  >
                    Finish Session
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBantSubmit} className="space-y-5">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-white overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={selectedQuoteProduct.images?.[0] || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop"}
                        alt={selectedQuoteProduct.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{selectedQuoteProduct.name}</h5>
                      <p className="text-[10px] text-slate-400">
                        Estimated Sourcing Price: <strong className="text-slate-600">{selectedQuoteProduct.pricing}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Sourcing Incentive Promo Banner */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Procurement Incentive Program</p>
                      <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                        Submit this verified enquiry to qualify for <strong className="text-amber-950 font-extrabold">up to 10% savings or rebate</strong> on your final contract deal value. <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">*Terms and conditions apply.</span>
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-[#0066FF] text-white flex items-center justify-center font-bold text-[9px]">1</span>
                      Contact Information
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={bantForm.name}
                          onChange={(e) => setBantForm({ ...bantForm, name: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Corporate Email *</label>
                        <input
                          type="email"
                          required
                          value={bantForm.email}
                          onChange={(e) => setBantForm({ ...bantForm, email: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Contact Phone *</label>
                        <input
                          type="text"
                          required
                          value={bantForm.phone}
                          onChange={(e) => setBantForm({ ...bantForm, phone: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Company *</label>
                        <input
                          type="text"
                          required
                          value={bantForm.company}
                          onChange={(e) => setBantForm({ ...bantForm, company: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">City Location *</label>
                        <input
                          type="text"
                          required
                          value={bantForm.city}
                          onChange={(e) => setBantForm({ ...bantForm, city: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-[#0066FF] text-white flex items-center justify-center font-bold text-[9px]">2</span>
                      Budget, Sourcing Authority & Needs (BANT)
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Do you have sign-off authority? *</label>
                        <select
                          value={bantForm.authority}
                          onChange={(e) => setBantForm({ ...bantForm, authority: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="yes">Yes (Evaluator or Decision Maker)</option>
                          <option value="influencer">Influencer (Recommendations provider)</option>
                          <option value="no">No (Pure Research / Personal Sourcing)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Budget Allocation Range *</label>
                        <select
                          required
                          value={bantForm.budget}
                          onChange={(e) => setBantForm({ ...bantForm, budget: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select your budget constraint</option>
                          <option value="₹10,000 - ₹25,000 / month">₹10,000 - ₹25,000 / month</option>
                          <option value="₹25,000 - ₹50,000 / month">₹25,000 - ₹50,000 / month</option>
                          <option value="₹50,000 - ₹1,000,000 / month">₹50,000 - ₹1,00,000 / month</option>
                          <option value="₹1,00,000+ / month">₹1,00,000+ / month (Enterprise tier)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Expected Procurement Timeline *</label>
                        <select
                          value={bantForm.timeline}
                          onChange={(e) => setBantForm({ ...bantForm, timeline: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="immediate">Immediate (Within 30 days)</option>
                          <option value="3-months">Short-term (1 - 3 months)</option>
                          <option value="6-months">Mid-term (3 - 6 months)</option>
                          <option value="none">Undecided (Exploratory / Budget planning)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">User Seat Count Requirements *</label>
                        <select
                          value={bantForm.qty}
                          onChange={(e) => setBantForm({ ...bantForm, qty: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="1-10 users">Small business (1 - 10 seats)</option>
                          <option value="10-50 users">Medium business (10 - 50 seats)</option>
                          <option value="50-200 users">Growth enterprise (50 - 200 seats)</option>
                          <option value="200+ users">Global enterprise (200+ seats)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Sourcing Notes & Requirements Description</label>
                      <textarea
                        rows={2}
                        placeholder="Please state custom integration demands, storage specifications, or compliance standards..."
                        value={bantForm.notes}
                        onChange={(e) => setBantForm({ ...bantForm, notes: e.target.value })}
                        className="w-full bg-slate-50 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteProduct(null)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-lg text-xs cursor-pointer shadow-md border-0"
                    >
                      Qualify and Submit Quote Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
