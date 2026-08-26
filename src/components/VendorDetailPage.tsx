import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building, MapPin, Globe, Star, CheckCircle, Phone, Mail,
  ArrowLeft, Laptop, ShieldCheck, FileText, Send
} from "lucide-react";
import { Vendor, Product } from "../types";
import { safeAlert } from "../utils/safeAlert";

interface VendorDetailPageProps {
  vendors: Vendor[];
  products: Product[];
  onPostLead: (leadData: any) => Promise<void>;
  currentUser: any;
}

export default function VendorDetailPage({ vendors, products, onPostLead, currentUser }: VendorDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Find vendor where slug matches company name or ID
  const cleanSlug = decodeURIComponent(slug || "").toLowerCase().trim();
  const vendor = vendors.find(v => {
    const slugName = v.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return slugName === cleanSlug || v.id.toLowerCase() === cleanSlug;
  });

  const [rfqSubmitting, setRfqSubmitting] = React.useState(false);
  const [rfqForm, setRfqForm] = React.useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.mobile || "",
    notes: ""
  });

  React.useEffect(() => {
    if (currentUser) {
      setRfqForm(prev => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.mobile || ""
      }));
    }
  }, [currentUser]);

  if (!vendor) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <Building className="w-16 h-16 text-slate-350" />
        <h2 className="text-2xl font-extrabold text-slate-800">Company Profile Not Found</h2>
        <p className="text-slate-500 max-w-md">
          The requested vendor profile is not found or is currently undergoing administrative verification.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
        >
          Return to Sourcing Desk
        </button>
      </div>
    );
  }

  // Fetch products offered by this vendor
  const vendorProducts = products.filter(p => p.approved && p.vendorId === vendor.id);

  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqForm.name || !rfqForm.email || !rfqForm.phone) {
      safeAlert("Please fill in all contact fields.", "warning");
      return;
    }

    setRfqSubmitting(true);
    try {
      const leadData = {
        title: `Enquiry for ${vendor.companyName}`,
        category: vendor.businessCategory || "General Sourcing",
        description: `RFP Sourcing Request for ${vendor.companyName}. Notes: ${rfqForm.notes}`,
        budget: "Custom Sourcing",
        timeline: "Immediate (Within 30 Days)",
        contactName: rfqForm.name,
        companyName: currentUser?.companyName || "MSME Partner",
        mobile: rfqForm.phone,
        email: rfqForm.email,
        city: currentUser?.city || "Mumbai",
        bantAuthority: "Yes",
        bantNeed: rfqForm.notes || "Sourcing requirements"
      };

      await onPostLead(leadData);
      setRfqForm(prev => ({ ...prev, notes: "" }));
      safeAlert("Your sourcing inquiry has been successfully transmitted and pre-qualified!", "success");
      navigate("/dashboard");
    } catch (err: any) {
      safeAlert(err.message || "Could not publish RFP.", "error");
    } finally {
      setRfqSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0066FF] transition-all bg-white py-2 px-4 rounded-xl border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <a href="/" className="hover:text-[#0066FF] transition-all">Home</a>
            <span>&gt;</span>
            <a href="/vendors" className="hover:text-[#0066FF] transition-all">Vendors</a>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold max-w-[180px] truncate">{vendor.companyName}</span>
          </div>
        </div>

        {/* Company Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-4.5">
            <img
              src={vendor.logo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150"}
              alt={vendor.companyName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-50 text-[#0066FF] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
                  {vendor.businessCategory}
                </span>
                {vendor.docVerified && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-150">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
                    GSTIN Checked
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{vendor.companyName}</h1>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {vendor.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border rounded-2xl p-4 shrink-0">
            <div className="text-center shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Trust rating</span>
              <div className="flex items-center gap-1 justify-center mt-1 text-amber-500 text-sm font-black">
                <Star className="w-4 h-4 fill-current" />
                <span>{vendor.rating} / 5</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="text-center shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Membership</span>
              <span className="bg-[#0066FF]/10 text-[#0066FF] font-black text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                {vendor.plan || "Free"} Partner
              </span>
            </div>
          </div>
        </div>

        {/* Company Portfolio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Products & Description (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Sourcing Description */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-500" />
                Company Capabilities & Description
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                {vendor.panNumber ? `${vendor.companyName} is a certified technology provider registered under corporate PAN ${vendor.panNumber} and audited under BANTConfirm sourcing standards.` : ""}
                {"\n\n"}
                We specialize in deploying scalable integration suites, custom configurations, and providing SLA-backed technical assistance to growing MSMEs and large enterprises across India.
              </p>
            </div>

            {/* Products catalog offered */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-500" />
                Active Sourcing Portfolio ({vendorProducts.length})
              </h3>

              {vendorProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No products listed in the catalog currently.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="border border-slate-200 hover:border-[#0066FF] rounded-xl overflow-hidden p-3 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="h-28 bg-slate-100 rounded-lg overflow-hidden border">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-black text-slate-800 text-xs leading-tight line-clamp-1 hover:text-[#0066FF]">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{p.category}</p>
                      </div>
                      <div className="pt-2.5 border-t mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">{p.pricing}</span>
                        <span className="text-[#0066FF] font-bold hover:underline">Specs &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: RfQ Sourcing Box (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-500" />
              Request Verified BANT Quotes
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              Directly submit an RfQ to <strong>{vendor.companyName}</strong>. Our sourcing desk qualifies BANT parameters immediately to bypass sales noise.
            </p>

            <form onSubmit={handleRfqSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={rfqForm.name}
                  onChange={(e) => setRfqForm({ ...rfqForm, name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={rfqForm.email}
                  onChange={(e) => setRfqForm({ ...rfqForm, email: e.target.value })}
                  placeholder="anand@company.com"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Mobile / Phone</label>
                <input
                  type="tel"
                  required
                  value={rfqForm.phone}
                  onChange={(e) => setRfqForm({ ...rfqForm, phone: e.target.value })}
                  placeholder="+91 99999 88888"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Requirement Notes & Specs</label>
                <textarea
                  rows={4}
                  required
                  value={rfqForm.notes}
                  onChange={(e) => setRfqForm({ ...rfqForm, notes: e.target.value })}
                  placeholder="Describe your user seats, budget limits, target timeline, or legacy tech stack..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none leading-relaxed font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={rfqSubmitting}
                className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {rfqSubmitting ? "Transmitting BANT RFP..." : "Send Sourcing Inquiry"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
