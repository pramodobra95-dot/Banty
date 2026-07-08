import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Check, Shield, Star, Award, Share2, 
  HelpCircle, FileText, Send, Sparkles, Mail, Phone, 
  MapPin, ExternalLink, MessageSquare, Download, CheckCircle, Info
} from "lucide-react";
import { Product, Category, Review } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { safeAlert } from "../utils/safeAlert";

interface ProductDetailPageProps {
  products: Product[];
  onPostLead: (leadData: any) => Promise<void>;
  currentUser: any;
  reviews?: Review[];
  onAddReview?: (reviewData: any) => void;
}

export default function ProductDetailPage({ 
  products: initialProducts, 
  onPostLead, 
  currentUser,
  reviews = [],
  onAddReview
}: ProductDetailPageProps) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const slug = decodeURIComponent(paramSlug || location.pathname.split("/products/")[1]?.replace(/\/$/, "") || "");
  const slugLower = slug.toLowerCase();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "specifications" | "faqs" | "reviews">("overview");

  // BANT Modal State
  const [bantModalOpen, setBantModalOpen] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    title: "",
    category: "",
    description: "",
    budget: "₹25,000 - ₹50,000 / month",
    timeline: "Immediate (1-2 weeks)",
    contactName: currentUser?.name || "",
    companyName: currentUser?.companyName || "",
    mobile: currentUser?.mobile || "",
    email: currentUser?.email || "",
    city: currentUser?.city || "Noida",
    bantAuthority: "Yes",
    bantNeed: "",
  });

  // Review form states
  const [reviewType, setReviewType] = useState<"product" | "vendor">("product");
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Sync user name if authenticated
  useEffect(() => {
    if (currentUser?.name) {
      setReviewName(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewName.trim()) {
      safeAlert("Please specify your name to submit a review.", "error");
      return;
    }
    if (!reviewComment.trim()) {
      safeAlert("Please write some review details.", "error");
      return;
    }
    if (!onAddReview) {
      safeAlert("Reviews management service is currently unavailable.", "error");
      return;
    }

    try {
      const payload = {
        productId: reviewType === "product" ? product.id : "",
        vendorId: product.vendorId || "",
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
        type: reviewType
      };

      onAddReview(payload);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      console.error(err);
    }
  };

  // Find product by slug
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Try finding locally first
        const matchedLocal = initialProducts.find(
          p => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugLower || p.id.toLowerCase() === slugLower
        );

        if (matchedLocal) {
          setProduct(matchedLocal);
          setSelectedImage(matchedLocal.images?.[0] || "");
          setLoading(false);
          // Increment views count dynamically
          try {
            await fetch(`/api/products/${matchedLocal.id}/view`, { method: "POST" });
          } catch (e) {
            console.warn("Could not log view count locally:", e);
          }
          return;
        }

        // Otherwise query Supabase directly to support real-time dynamic additions
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .filter("approved", "eq", true);

          if (!error && data) {
            const matchedDb = data.find(
              (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugLower || p.id.toLowerCase() === slugLower
            );
            if (matchedDb) {
              // Convert schema format if necessary
              const mappedProduct: Product = {
                id: matchedDb.id,
                name: matchedDb.name,
                description: matchedDb.description || "",
                images: matchedDb.logo ? [matchedDb.logo] : ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"],
                pricing: matchedDb.pricing || "Contact Vendor",
                features: Array.isArray(matchedDb.features) ? matchedDb.features : [],
                brochureUrl: matchedDb.brochureUrl || "#",
                videoUrl: matchedDb.videoUrl || "",
                faqs: Array.isArray(matchedDb.faqs) ? matchedDb.faqs : [],
                rating: Number(matchedDb.rating || 5),
                category: matchedDb.category || "IT Solutions",
                vendorId: matchedDb.vendorId,
                vendorName: matchedDb.vendorName,
                isFeatured: !!matchedDb.featured,
                approved: !!matchedDb.approved,
                views: Number(matchedDb.views || 48),
                createdAt: matchedDb.createdAt || new Date().toISOString()
              };
              setProduct(mappedProduct);
              setSelectedImage(mappedProduct.images?.[0] || "");
            }
          }
        }
      } catch (err) {
        console.error("Error finding dynamic product by slug:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, initialProducts]);

  // Set initial form states once product is loaded
  useEffect(() => {
    if (product) {
      setLeadForm(prev => ({
        ...prev,
        title: `Procurement of ${product.name}`,
        category: product.category,
        bantNeed: `We are looking for verified services or licenses for ${product.name}. Our current requirements are...`,
        description: `Company requirement for ${product.name}. Preferred vendor is ${product.vendorName}.`
      }));
    }
  }, [product, currentUser]);

  // Similar products recommendation logic
  const getSimilarProducts = (): Product[] => {
    if (!product) return [];
    
    // 1. Same category first
    const sameCategory = initialProducts
      .filter(p => p.approved && p.id !== product.id && p.category === product.category);
      
    // 2. If we need more to reach 4 items, fallback to highest rated in other categories
    if (sameCategory.length < 4) {
      const excludedIds = [product.id, ...sameCategory.map(s => s.id)];
      const fallback = initialProducts
        .filter(p => p.approved && !excludedIds.includes(p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
      return [...sameCategory, ...fallback].slice(0, 4);
    }
    
    return sameCategory.slice(0, 4);
  };

  const similarProductsList = getSimilarProducts();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product?.name} on BANTConfirm`,
        text: `Check out BANT certified specs and verified prices of ${product?.name}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      safeAlert("Product link copied to clipboard!", "success");
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.contactName || !leadForm.companyName || !leadForm.mobile || !leadForm.email) {
      safeAlert("Please fill in all buyer verification details.", "warning");
      return;
    }

    setSubmittingLead(true);
    try {
      await onPostLead({
        title: leadForm.title,
        category: leadForm.category,
        description: leadForm.description,
        budget: leadForm.budget,
        timeline: leadForm.timeline,
        contactName: leadForm.contactName,
        companyName: leadForm.companyName,
        mobile: leadForm.mobile,
        email: leadForm.email,
        city: leadForm.city,
        bantAuthority: leadForm.bantAuthority,
        bantNeed: leadForm.bantNeed,
      });
      setBantModalOpen(false);
      safeAlert("Enquiry submitted! Sourcing desk is pre-qualifying BANT parameters.", "success");
      navigate("/dashboard");
    } catch (err: any) {
      safeAlert(err.message || "Could not save your BANT query.", "error");
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">Retrieving real-time certified specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Product Not Found</h2>
        <p className="text-slate-500 max-w-md">
          The requested product may have been removed, archived, or is currently pending approval by the BANTConfirm Admin Desk.
        </p>
        <button 
          onClick={() => navigate("/")}
          className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Create a beautiful default gallery if product images are limited
  const galleryImages = product.images && product.images.length > 0
    ? product.images 
    : [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80"
      ];

  const defaultFaqs = [
    {
      question: `What makes ${product.name} different from other solutions in ${product.category}?`,
      answer: `This solution offers real-time API integrations, guaranteed 99.9% uptime, localized Indian payment integrations, and dedicated SLA support verified under BANTConfirm audits.`
    },
    {
      question: `Are there customizable pricing plans for small and medium enterprises (SMEs)?`,
      answer: `Yes, ${product.vendorName} provides highly elastic pricing models. Submit a BANT enquiry to receive custom enterprise quotes corresponding to your budget.`
    },
    {
      question: `How long does the onboarding and deployment process take?`,
      answer: `Standard deployments are completed within 1 to 2 weeks. Our sourcing managers will work alongside you to accelerate validation of tech specs.`
    }
  ];

  const actualFaqs = product.faqs && product.faqs.length > 0 ? product.faqs : defaultFaqs;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0066FF] transition-all bg-white py-2 px-4 rounded-xl border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Marketplace</span>
            <span>&gt;</span>
            <span className="hover:text-[#0066FF] cursor-pointer transition-all" onClick={() => navigate("/")}>products</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold max-w-[150px] truncate">{product.name.toLowerCase()}</span>
          </div>
        </div>

        {/* Core Product Presentation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Premium Gallery (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="relative aspect-video rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
              <img 
                src={selectedImage || galleryImages[0]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {product.isFeatured && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  Premium Choice
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-video rounded-lg bg-slate-50 border overflow-hidden transition-all duration-200 cursor-pointer ${
                    selectedImage === img ? "border-[#0066FF] ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>

            {/* Sharing and Trust Indicators */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0066FF] transition-all py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share Specifications
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {product.views || 48} Real-time Views
              </div>
            </div>
          </div>

          {/* Center Column: Core Specs & Overview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header Identity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-50 text-[#0066FF] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                  {product.category}
                </span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  BANT Certified
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {product.name}
              </h1>

              {/* Vendor & Reviews row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 border-t border-b border-slate-100 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px]">
                    {product.vendorName.substring(0, 2).toUpperCase()}
                  </span>
                  <span className="text-slate-800 font-extrabold">{product.vendorName}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-extrabold">{product.rating}</span>
                  <span className="text-slate-400">(Verified Partner)</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            {/* Sourcing Actions Box (Pricing & RFP Sourcing Button) */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[10px] text-blue-200 font-black uppercase tracking-wider">Estimated Sourcing Pricing</p>
                  <p className="text-3xl font-black tracking-tight text-white mt-1">{product.pricing}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">BANT Sourced SLA</span>
                </div>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div className="space-y-3">
                <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
                  We pre-qualify your requirement across Budget, Authority, Need, and Timeline (BANT) within minutes. Submit a certified RfQ to receive direct SLA proposals from checked providers.
                </p>

                {/* Sourcing Incentive Alert */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <Sparkles className="w-4.5 h-4.5 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-[11px] text-blue-200 font-black uppercase tracking-wider">Sourcing Incentive Program</p>
                    <p className="text-xs text-slate-200 font-medium mt-0.5 leading-relaxed">
                      Post an official sourcing enquiry for this product through our platform and obtain <strong className="text-yellow-400 font-extrabold">up to 10% savings on the verified final contract value</strong>. <span className="text-[10px] text-slate-400 block mt-1 font-semibold">*Terms and conditions apply.</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => setBantModalOpen(true)}
                    className="w-full bg-[#0066FF] hover:bg-blue-600 text-white font-black py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
                  >
                    <Send className="w-4 h-4" />
                    Enquire & Pre-qualify BANT
                  </button>
                  <a 
                    href={product.brochureUrl && product.brochureUrl !== "#" ? product.brochureUrl : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!product.brochureUrl || product.brochureUrl === "#") {
                        safeAlert("Technical specifications booklet will be sent to your registered email.", "info");
                      }
                    }}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10 text-center"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    Download Brochure
                  </a>
                </div>
              </div>
            </div>

            {/* Technical Tabs & Detailed info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
                {(["overview", "specifications", "faqs", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
                      activeTab === tab 
                        ? "bg-white text-[#0066FF] shadow-xs" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                
                {/* TAB 1: Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Key Capability Indicators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(product.features || [
                        "Automated high-capacity routing pipelines",
                        "End-to-end security audit compliance",
                        "Real-time customer intent discovery dashboards",
                        "BANT matching and routing SLA protection"
                      ]).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                          <Check className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="h-[1px] bg-slate-100" />

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-blue-800">
                        <Sparkles className="w-4 h-4 text-blue-600 animate-bounce" />
                        India SEO Optimized Visibility Index
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        This catalog list is live-indexed across Indian networks. Sourcing managers queries like <strong>"{product.name} specs lists India"</strong> or <strong>"compare {product.category} vendor models"</strong> route directly to this checked landing hub.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: Specifications */}
                {activeTab === "specifications" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Technical Matrix Parameters</h3>
                    
                    <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-2 bg-slate-50/50 p-2.5 border-b border-slate-100 font-extrabold text-slate-500">
                        <span>Technical Attribute</span>
                        <span>Certified Specification Value</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 border-b border-slate-100 font-bold text-slate-700">
                        <span>Solution Category</span>
                        <span>{product.category}</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 border-b border-slate-100 font-bold text-slate-700">
                        <span>Vendor Organization</span>
                        <span>{product.vendorName}</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 border-b border-slate-100 font-bold text-slate-700">
                        <span>Standard Deployment Timeline</span>
                        <span>7-15 Working Days (UP, NCR, PAN India)</span>
                      </div>
                      <div className="grid grid-cols-2 p-2.5 font-bold text-slate-700">
                        <span>Audit Integrity Status</span>
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 fill-current" /> Active Verified
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FAQs */}
                {activeTab === "faqs" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Frequently Asked Sourcing Queries</h3>
                    <div className="space-y-3.5">
                      {actualFaqs.map((faq, idx) => (
                        <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <p className="text-xs font-black text-slate-800">{faq.question}</p>
                          <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Reviews */}
                {activeTab === "reviews" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Side: Reviews Listing (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg max-w-sm">
                          <button
                            type="button"
                            onClick={() => setReviewType("product")}
                            className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                              reviewType === "product"
                                ? "bg-white text-slate-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Product Reviews ({reviews.filter(r => r.productId === product.id && r.type !== 'vendor').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewType("vendor")}
                            className={`flex-1 py-1.5 px-3 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                              reviewType === "vendor"
                                ? "bg-white text-slate-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Vendor Reviews ({reviews.filter(r => r.vendorId === product.vendorId && r.type === 'vendor').length})
                          </button>
                        </div>

                        {/* List items */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {(reviewType === "product"
                            ? reviews.filter(r => r.productId === product.id && r.type !== 'vendor')
                            : reviews.filter(r => r.vendorId === product.vendorId && r.type === 'vendor')
                          ).length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-medium text-xs">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No {reviewType} reviews written yet. Be the first to write one!
                            </div>
                          ) : (
                            (reviewType === "product"
                              ? reviews.filter(r => r.productId === product.id && r.type !== 'vendor')
                              : reviews.filter(r => r.vendorId === product.vendorId && r.type === 'vendor')
                            ).map((rev) => (
                              <div key={rev.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-[10px]">
                                      {rev.userName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{rev.userName}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{rev.rating}.0</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  {rev.comment}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right Side: Write a Review Form (5 cols) */}
                      <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                          Write a Professional Review
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                          Your review is verified and assists the BANT procurement community in evaluating SLA compliance.
                        </p>

                        <form onSubmit={handleSubmitReview} className="space-y-3.5">
                          {/* Type field */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Review Subject</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setReviewType("product")}
                                className={`py-2 px-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                  reviewType === "product"
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                This Product
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewType("vendor")}
                                className={`py-2 px-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                  reviewType === "vendor"
                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                This Vendor Organization
                              </button>
                            </div>
                          </div>

                          {/* Name field */}
                          <div className="space-y-1">
                            <label htmlFor="review-name" className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Your Name</label>
                            <input
                              id="review-name"
                              type="text"
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              placeholder="e.g. Ramesh Sharma"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Rating stars */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">SLA & Performance Rating</label>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="cursor-pointer text-amber-400 hover:scale-110 transition-transform"
                                >
                                  <Star className={`w-5 h-5 ${star <= reviewRating ? "fill-current" : "text-slate-200"}`} />
                                </button>
                              ))}
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ml-2">
                                {reviewRating}/5 Stars
                              </span>
                            </div>
                          </div>

                          {/* Comments text */}
                          <div className="space-y-1">
                            <label htmlFor="review-comment" className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Review details</label>
                            <textarea
                              id="review-comment"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Describe your verification, features capability, or customer response times..."
                              rows={3}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-lg text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit Verified Review
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

        {/* SIMILAR & RELATED SOLUTIONS */}
        {product?.showSimilar && similarProductsList.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                Similar & Alternative Solutions
                <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Recommendations</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Compare BANT certified specifications and select the perfect SLA match for your organization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProductsList.map((p) => (
                <div 
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#0066FF] hover:shadow-lg transition-all duration-300 group flex flex-col overflow-hidden"
                >
                  {/* Image Header with Category Badge */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img 
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"} 
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-slate-900/85 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-xs">
                        {p.category}
                      </span>
                    </div>
                    {p.isFeatured && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.vendorName}</span>
                        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{p.rating}.0</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 
                          onClick={() => {
                            navigate(`/products/${p.id}`);
                            window.scrollTo(0, 0);
                          }}
                          className="text-xs font-black text-slate-800 hover:text-[#0066FF] transition-colors cursor-pointer line-clamp-1"
                        >
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      </div>

                      {/* Mini features list */}
                      <div className="space-y-1 pt-1.5">
                        {p.features?.slice(0, 2).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-600">
                            <Check className="w-3 h-3 text-[#0066FF] shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Call To Actions */}
                    <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sourcing Price</span>
                        <span className="text-[10px] font-black text-slate-800">{p.pricing}</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          navigate(`/products/${p.id}`);
                          window.scrollTo(0, 0);
                        }}
                        className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#0066FF] hover:text-blue-700 font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Specs</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* BANT QUALIFICATION LEAD SOURCING MODAL */}
      {bantModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="bg-blue-600 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded">Pre-fill BANT Query</span>
                <h4 className="font-extrabold text-base text-white mt-1">Certified Sourcing Desk verification</h4>
              </div>
              <button 
                onClick={() => setBantModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer text-sm font-extrabold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLeadSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Product context box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <img 
                  src={product.images?.[0] || galleryImages[0]} 
                  alt={product.name} 
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <div className="text-left">
                  <h5 className="text-xs font-black text-slate-800">{product.name}</h5>
                  <p className="text-[10px] text-slate-400">Estimated Sourcing Price: <strong className="text-slate-600">{product.pricing}</strong></p>
                </div>
              </div>

              {/* Requirement Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Lead Requirement Title</label>
                  <input 
                    type="text" 
                    value={leadForm.title}
                    onChange={(e) => setLeadForm({...leadForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Matching Category</label>
                  <input 
                    type="text" 
                    value={leadForm.category}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold p-2.5 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Contact parameters */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-1">1. Buyer Verification Parameters</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Contact Name</label>
                    <input 
                      type="text" 
                      value={leadForm.contactName}
                      onChange={(e) => setLeadForm({...leadForm, contactName: e.target.value})}
                      placeholder="e.g., Pramod Kumar"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Company Name</label>
                    <input 
                      type="text" 
                      value={leadForm.companyName}
                      onChange={(e) => setLeadForm({...leadForm, companyName: e.target.value})}
                      placeholder="e.g., Bouuz IT Services"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Mobile / Telephone</label>
                    <input 
                      type="text" 
                      value={leadForm.mobile}
                      onChange={(e) => setLeadForm({...leadForm, mobile: e.target.value})}
                      placeholder="e.g., +91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Corporate Email</label>
                    <input 
                      type="email" 
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                      placeholder="e.g., procurement@bouuz.in"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BANT parameters */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-1">2. BANT Procurement Alignment</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Verified Annual Budget</label>
                    <select 
                      value={leadForm.budget}
                      onChange={(e) => setLeadForm({...leadForm, budget: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                    >
                      <option value="₹10,000 - ₹25,000 / month">₹10,000 - ₹25,000 / mo</option>
                      <option value="₹25,000 - ₹50,000 / month">₹25,000 - ₹50,000 / mo</option>
                      <option value="₹50,000 - ₹1,000,000 / year">₹50k - ₹1L / yr</option>
                      <option value="₹100,000 - ₹500,000 / year">₹1L - ₹5L / yr</option>
                      <option value="₹500,000+ Enterprise Tier">₹5L+ Enterprise Tier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Decision Authority Status</label>
                    <select 
                      value={leadForm.bantAuthority}
                      onChange={(e) => setLeadForm({...leadForm, bantAuthority: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                    >
                      <option value="Yes">Yes (Direct decision maker)</option>
                      <option value="Committee">Committee (Evaluation team)</option>
                      <option value="Consultant">Consultant (Recommending model)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="Sourcing Timeline block text-[10px] font-bold text-slate-500 mb-1">Deployment Timeline</label>
                    <select 
                      value={leadForm.timeline}
                      onChange={(e) => setLeadForm({...leadForm, timeline: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer"
                    >
                      <option value="Immediate (1-2 weeks)">Immediate (1-2 weeks)</option>
                      <option value="Planned (1 month)">Planned (1 month)</option>
                      <option value="Evaluation (2-3 months)">Evaluation (2-3 months)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Corporate Location / City</label>
                    <input 
                      type="text" 
                      value={leadForm.city}
                      onChange={(e) => setLeadForm({...leadForm, city: e.target.value})}
                      placeholder="e.g., Noida"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Sourcing Goal / Core Business Needs</label>
                  <textarea 
                    rows={3}
                    value={leadForm.bantNeed}
                    onChange={(e) => setLeadForm({...leadForm, bantNeed: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Promo Incentive Highlight */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium leading-relaxed">
                📢 <strong className="font-extrabold text-amber-950">Procurement Program Notification:</strong> By submitting this verified BANT requirement, your organization becomes eligible to receive <span className="font-bold text-blue-700 underline">up to 10% savings or rebate</span> on the final contract deal value. *Subject to standard terms and conditions.*
              </div>

              {/* Submit */}
              <button 
                type="submit"
                disabled={submittingLead}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-extrabold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
              >
                {submittingLead ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                    <span>Verifying BANT specifications...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Publish Certified BANT Requirement</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
