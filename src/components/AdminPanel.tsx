import React, { useState, useEffect } from "react";
import { 
  Users, Layers, ShoppingBag, BarChart, CheckCircle, AlertTriangle, 
  Trash2, Plus, Calendar, FileText, Globe, ToggleLeft, ToggleRight, 
  Download, ArrowUpRight, Shield, BadgeAlert, PlusCircle, CheckSquare,
  Pencil, UploadCloud, Sparkles, Eye, BookOpen, Search, Mail, Send, RefreshCw, ExternalLink
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from "recharts";
import { Vendor, Product, Lead, Blog, Banner, Category, MarketingBanner } from "../types";
import { safeAlert } from "../utils/safeAlert";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

interface AdminPanelProps {
  vendors: Vendor[];
  products: Product[];
  leads: Lead[];
  categories: Category[];
  blogs: Blog[];
  banners: Banner[];
  marketingBanners?: MarketingBanner[];
  onApproveVendor: (vendorId: string) => void;
  onApproveProduct: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  onToggleFeatureProduct: (productId: string) => void;
  onAssignVendorToLead: (leadId: string, vendorId: string) => void;
  onAddBanner: (bannerData: any) => void;
  onDeleteBanner: (bannerId: string) => void;
  onAddBlog: (blogData: any) => void;
  onUpdateBlog?: (blogId: string, blogData: any) => void;
  onDeleteBlog: (blogId: string) => void;
  cmsPages: Record<string, string>;
  onUpdateCMSPage: (key: string, val: string) => void;
  onAddProduct?: (productData: any) => void;
  onUpdateProduct?: (productId: string, productData: any) => void;
  onDeleteProduct?: (productId: string) => void;
  onAddVendor?: (vendorData: any) => void;
  onUpdateVendor?: (vendorId: string, vendorData: any) => void;
  onDeleteVendor?: (vendorId: string) => void;
  registeredUsers?: any[];
  onDeleteUser?: (userId: string) => void;
  onAddCategory?: (catData: { name: string; description: string; icon: string }) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onRefreshData?: () => void;
}

export default function AdminPanel({
  vendors,
  products,
  leads,
  categories,
  blogs,
  banners,
  marketingBanners = [],
  onApproveVendor,
  onApproveProduct,
  onRejectProduct,
  onToggleFeatureProduct,
  onAssignVendorToLead,
  onAddBanner,
  onDeleteBanner,
  onAddBlog,
  onUpdateBlog,
  onDeleteBlog,
  cmsPages,
  onUpdateCMSPage,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  registeredUsers = [],
  onDeleteUser,
  onAddCategory,
  onDeleteCategory,
  onRefreshData
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'products' | 'leads' | 'banners' | 'blogs' | 'cms' | 'users' | 'categories' | 'trusted-vendors' | 'marketing-banners' | 'admin-bot' | 'resend-emails'>('overview');

  // Partner / Vendor Registrations Pipeline State
  const [partnerRegistrations, setPartnerRegistrations] = useState<any[]>([]);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(false);
  const [vendorSubTab, setVendorSubTab] = useState<'active' | 'pipeline'>('active');

  const fetchPartnerRegistrations = async () => {
    setIsRegistrationsLoading(true);
    try {
      const res = await fetch("/api/admin/partner-registrations");
      if (res.ok) {
        const data = await res.json();
        setPartnerRegistrations(data);
      }
    } catch (err) {
      console.error("Failed to fetch partner registrations:", err);
    } finally {
      setIsRegistrationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchPartnerRegistrations();
    }
  }, [activeTab]);

  const handleUpdateRegistrationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/partner-registrations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        safeAlert(`Status updated successfully to ${status}!`, "success");
        fetchPartnerRegistrations();
        if (onRefreshData) onRefreshData();
      } else {
        const data = await res.json();
        safeAlert(`Failed: ${data.error || "Could not update status"}`, "error");
      }
    } catch (err) {
      console.error(err);
      safeAlert("Network error.", "error");
    }
  };

  const handleRejectRegistration = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/partner-registrations/${id}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        safeAlert("Partner registration marked as Rejected.", "success");
        fetchPartnerRegistrations();
        if (onRefreshData) onRefreshData();
      } else {
        safeAlert("Failed to reject registration.", "error");
      }
    } catch (err) {
      console.error(err);
      safeAlert("Network error.", "error");
    }
  };

  const handleContactRegistration = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/partner-registrations/${id}/contact`, {
        method: "POST"
      });
      if (res.ok) {
        safeAlert("Status marked as 'Contacted' successfully.", "success");
        fetchPartnerRegistrations();
        if (onRefreshData) onRefreshData();
      } else {
        safeAlert("Failed to update status to contacted.", "error");
      }
    } catch (err) {
      console.error(err);
      safeAlert("Network error.", "error");
    }
  };

  const handleApproveRegistration = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/partner-registrations/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        safeAlert("Partner registration approved and converted into an Active Vendor successfully!", "success");
        fetchPartnerRegistrations();
        if (onRefreshData) onRefreshData();
      } else {
        const data = await res.json();
        safeAlert(`Failed: ${data.error || "Could not approve partner"}`, "error");
      }
    } catch (err) {
      console.error(err);
      safeAlert("Network error.", "error");
    }
  };

  // Resend Logs state
  const [resendLogs, setResendLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState("pramodobra95@gmail.com");
  const [testEmailType, setTestEmailType] = useState<"welcome-buyer" | "welcome-vendor" | "new-enquiry" | "general_handshake">("general_handshake");
  const [isTestSending, setIsTestSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchResendLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch("/api/resend/logs");
      if (res.ok) {
        const data = await res.json();
        setResendLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch Resend logs:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "resend-emails") {
      fetchResendLogs();
    }
  }, [activeTab]);

  const handleSendTestEmail = async () => {
    if (!testEmailInput || !testEmailInput.trim() || !testEmailInput.includes("@")) {
      safeAlert("Please specify a valid test recipient email address (e.g. yourname@domain.com).", "warning");
      return;
    }
    setIsTestSending(true);
    try {
      const res = await fetch("/api/resend/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmailInput.trim(), type: testEmailType })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        safeAlert(`Resend API: Test email successfully processed! Destination: ${testEmailInput}`, "success");
        fetchResendLogs();
      } else {
        safeAlert(`Resend Error: ${data.error || "Failed to trigger test dispatch"}`, "error");
      }
    } catch (err: any) {
      safeAlert(`Network Error: ${err.message}`, "error");
    } finally {
      setIsTestSending(false);
    }
  };

  const handleRetryEmail = async (logItem: any) => {
    try {
      safeAlert(`Re-triggering delivery to ${logItem.recipient}...`, "info");
      const res = await fetch("/api/resend/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: logItem.recipient,
          subject: logItem.subject,
          htmlContent: logItem.htmlContent
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        safeAlert(`Email successfully resent to ${logItem.recipient}!`, "success");
        fetchResendLogs();
      } else {
        safeAlert(`Retry delivery failed: ${data.error || "Check Resend credentials"}`, "error");
      }
    } catch (err: any) {
      safeAlert(`Retry network error: ${err.message}`, "error");
    }
  };

  // Admin Bot State
  const [adminBotMessages, setAdminBotMessages] = useState<any[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello Administrator! I am your BANTConfirm AI Co-Pilot. I have live telemetry access to the marketplace database.\n\nAsk me anything about user registrations, vendor partnership statuses, product catalogs, or lead routing opportunities. I can analyze trends and draft communications for you on the fly!",
      createdAt: new Date().toISOString()
    }
  ]);
  const [adminBotInput, setAdminBotInput] = useState("");
  const [isAdminBotLoading, setIsAdminBotLoading] = useState(false);

  const handleSendAdminBot = async (textToSend?: string) => {
    const text = (textToSend || adminBotInput).trim();
    if (!text) return;

    if (!textToSend) setAdminBotInput("");

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
      createdAt: new Date().toISOString()
    };

    setAdminBotMessages(prev => [...prev, userMsg]);
    setIsAdminBotLoading(true);

    try {
      const response = await fetch("/api/admin/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatHistory: adminBotMessages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to consult AI");
      }

      const data = await response.json();
      
      const modelMsg = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: data.text || "I am processing your query. Could you please specify which metric you are auditing?",
        createdAt: new Date().toISOString()
      };

      setAdminBotMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        role: "model",
        text: "I experienced a connection lag. Please try again. Or, you can type 'users' or 'vendors' to query local database metrics.",
        createdAt: new Date().toISOString()
      };
      setAdminBotMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAdminBotLoading(false);
    }
  };

  // Trusted Vendors administration state
  const [trustedVendors, setTrustedVendors] = useState<any[]>([]);
  const [loadingTv, setLoadingTv] = useState(false);
  const [showTvForm, setShowTvForm] = useState(false);
  const [editingTv, setEditingTv] = useState<any | null>(null);
  const [tvForm, setTvForm] = useState({
    vendor_name: "",
    logo_url: "",
    website_url: "",
    display_order: 0,
    is_active: true
  });

  const [isDraggingTvLogo, setIsDraggingTvLogo] = useState(false);

  const handleTvLogoProcess = (file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      safeAlert("Invalid file format. Please upload a JPEG or PNG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setTvForm(prev => ({
          ...prev,
          logo_url: result
        }));
        safeAlert("Logo image uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchTrustedVendors = async () => {
    setLoadingTv(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from("trusted_vendors").select("*").order("display_order", { ascending: true });
        if (!error && data) {
          setTrustedVendors(data);
          setLoadingTv(false);
          return;
        }
      }

      const res = await fetch("/api/admin/trusted-vendors");
      if (res.ok) {
        const data = await res.json();
        setTrustedVendors(data);
      }
    } catch (e) {
      console.error("Failed to fetch trusted vendors in AdminPanel:", e);
    } finally {
      setLoadingTv(false);
    }
  };

  useEffect(() => {
    if (activeTab === "trusted-vendors") {
      fetchTrustedVendors();
    }
  }, [activeTab]);

  // Marketing Banners state and handlers
  const [showMbForm, setShowMbForm] = useState(false);
  const [editingMb, setEditingMb] = useState<any | null>(null);
  const [mbForm, setMbForm] = useState({
    title: "",
    image_url: "",
    button_text: "Explore Now",
    redirect_url: "",
    display_order: 1,
    is_active: true,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "2030-12-31"
  });
  const [mbUploading, setMbUploading] = useState(false);
  const [mbDragOver, setMbDragOver] = useState(false);
  const [draggedMbIndex, setDraggedMbIndex] = useState<number | null>(null);

  const handleOpenAddMb = () => {
    setEditingMb(null);
    setMbForm({
      title: "",
      image_url: "",
      button_text: "Explore Now",
      redirect_url: "",
      display_order: marketingBanners.length + 1,
      is_active: true,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "2030-12-31"
    });
    setShowMbForm(true);
  };

  const handleOpenEditMb = (mb: any) => {
    setEditingMb(mb);
    setMbForm({
      title: mb.title || "",
      image_url: mb.image_url || "",
      button_text: mb.button_text || "Explore Now",
      redirect_url: mb.redirect_url || "",
      display_order: mb.display_order || 1,
      is_active: mb.is_active !== false,
      start_date: mb.start_date || new Date().toISOString().split("T")[0],
      end_date: mb.end_date || "2030-12-31"
    });
    setShowMbForm(true);
  };

  const handleSaveMb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mbForm.title || !mbForm.image_url) {
      safeAlert("Title and Image URL are required.");
      return;
    }

    try {
      const payload = {
        title: mbForm.title,
        image_url: mbForm.image_url,
        button_text: mbForm.button_text,
        redirect_url: mbForm.redirect_url,
        display_order: Number(mbForm.display_order),
        is_active: mbForm.is_active,
        start_date: mbForm.start_date,
        end_date: mbForm.end_date
      };

      if (editingMb) {
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from("marketing_banners")
            .update(payload)
            .eq("id", editingMb.id);
          if (error) throw error;
        }
        await fetch(`/api/admin/marketing-banners/${editingMb.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        const newId = `mb-${Date.now()}`;
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from("marketing_banners")
            .insert([{ id: newId, ...payload }]);
          if (error) throw error;
        }
        await fetch("/api/admin/marketing-banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newId, ...payload })
        });
      }

      setShowMbForm(false);
      setEditingMb(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      safeAlert("Failed to save banner: " + (err.message || err));
    }
  };

  const handleDeleteMb = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("marketing_banners")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
      await fetch(`/api/admin/marketing-banners/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      safeAlert("Failed to delete banner: " + (err.message || err));
    }
  };

  const handleToggleMbActive = async (banner: any) => {
    try {
      const updatedActive = !banner.is_active;
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("marketing_banners")
          .update({ is_active: updatedActive })
          .eq("id", banner.id);
        if (error) throw error;
      }
      await fetch(`/api/admin/marketing-banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: updatedActive })
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      safeAlert("Failed to toggle banner status: " + (err.message || err));
    }
  };

  const handleUpdateBannerDisplayOrder = async (id: string, order: number) => {
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from("marketing_banners")
          .update({ display_order: order })
          .eq("id", id);
      }
      await fetch(`/api/admin/marketing-banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: order })
      });
    } catch (err) {
      console.error("Failed to update display order:", err);
    }
  };

  const handleUploadMbImage = async (file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      safeAlert("Supported formats: JPG, JPEG, PNG, WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      safeAlert("Maximum file size allowed is 5 MB.");
      return;
    }

    const readAsDataURL = (f: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === "string") {
            resolve(e.target.result);
          } else {
            reject(new Error("Failed to read file."));
          }
        };
        reader.onerror = () => reject(new Error("File reading error."));
        reader.readAsDataURL(f);
      });
    };

    setMbUploading(true);
    try {
      let imageUrlToSet = "";
      let fellBack = false;

      if (isSupabaseConfigured) {
        try {
          const fileExt = file.name.split('.').pop() || 'png';
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `banners/${fileName}`;

          let { data, error } = await supabase.storage
            .from("marketing")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (error) {
            const fallbackRes = await supabase.storage
              .from("public")
              .upload(filePath, file, { cacheControl: "3600", upsert: true });
            if (fallbackRes.error) {
              throw new Error(fallbackRes.error.message);
            }
            data = fallbackRes.data;
          }

          if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from(data.path.startsWith("marketing") ? "marketing" : "public")
              .getPublicUrl(filePath);
            imageUrlToSet = publicUrl;
          } else {
            throw new Error("No data returned from storage.");
          }
        } catch (storageErr) {
          console.warn("Supabase storage upload failed, falling back to secure Base64:", storageErr);
          imageUrlToSet = await readAsDataURL(file);
          fellBack = true;
        }
      } else {
        imageUrlToSet = await readAsDataURL(file);
      }

      setMbForm(prev => ({ ...prev, image_url: imageUrlToSet }));
      if (fellBack) {
        safeAlert("Note: Supabase storage buckets are not fully configured yet. Image has been safely loaded using persistent Base64 encoder!", "info");
      } else {
        safeAlert("Image uploaded and processed successfully!", "success");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      safeAlert("Failed to process image. Please try another image or paste an Image URL.", "error");
    } finally {
      setMbUploading(false);
    }
  };

  const handleMbDragStart = (index: number) => {
    setDraggedMbIndex(index);
  };

  const handleMbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMbDrop = async (targetIndex: number) => {
    if (draggedMbIndex === null) return;
    const reordered = [...marketingBanners];
    const [draggedItem] = reordered.splice(draggedMbIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);
    setDraggedMbIndex(null);

    const updatedBanners = reordered.map((b, idx) => ({
      ...b,
      display_order: idx + 1
    }));

    for (const b of updatedBanners) {
      await handleUpdateBannerDisplayOrder(b.id, b.display_order);
    }
    if (onRefreshData) onRefreshData();
  };

  const handleOpenAddTv = () => {
    setEditingTv(null);
    setTvForm({
      vendor_name: "",
      logo_url: "",
      website_url: "",
      display_order: trustedVendors.length + 1,
      is_active: true
    });
    setShowTvForm(true);
  };

  const handleOpenEditTv = (tv: any) => {
    setEditingTv(tv);
    setTvForm({
      vendor_name: tv.vendor_name,
      logo_url: tv.logo_url,
      website_url: tv.website_url || "",
      display_order: tv.display_order || 0,
      is_active: tv.is_active !== false
    });
    setShowTvForm(true);
  };

  const handleSaveTv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvForm.vendor_name || !tvForm.logo_url) {
      safeAlert("Vendor Name and Logo URL are required");
      return;
    }

    try {
      const tvId = editingTv ? editingTv.id : `tv-${Date.now()}`;
      const tvData = {
        id: tvId,
        vendor_name: tvForm.vendor_name,
        logo_url: tvForm.logo_url,
        website_url: tvForm.website_url || null,
        display_order: typeof tvForm.display_order === "number" ? tvForm.display_order : parseInt(String(tvForm.display_order) || "0", 10),
        is_active: tvForm.is_active !== false,
        created_at: editingTv?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: editingTv?.created_at || new Date().toISOString()
      };

      let savedLocal = false;
      try {
        const url = editingTv 
          ? `/api/admin/trusted-vendors/${editingTv.id}`
          : "/api/admin/trusted-vendors";
        const method = editingTv ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...tvForm, id: tvId })
        });
        if (res.ok) {
          savedLocal = true;
        }
      } catch (err) {
        console.warn("Local server trusted_vendors save failed/not available, relying on Supabase:", err);
      }

      // If Supabase is configured, sync to Supabase as well
      if (isSupabaseConfigured) {
        try {
          // Try with full payload
          let { error } = await supabase.from("trusted_vendors").upsert([tvData]);
          
          if (error) {
            console.warn("Supabase trusted_vendors sync with full fields failed. Retrying with core fields only...", error);
            
            // Core fields only
            const coreTvData = {
              id: tvData.id,
              vendor_name: tvData.vendor_name,
              logo_url: tvData.logo_url,
              website_url: tvData.website_url,
              display_order: tvData.display_order,
              is_active: tvData.is_active
            };
            
            const retryRes = await supabase.from("trusted_vendors").upsert([coreTvData]);
            if (retryRes.error) {
              console.error("Supabase trusted_vendors sync retry with core fields also failed:", retryRes.error);
              if (!savedLocal) throw retryRes.error;
            } else {
              console.log("Successfully synced trusted vendor to Supabase using core fields fallback!");
            }
          } else {
            console.log("Successfully synced trusted vendor to Supabase with full fields!");
          }
        } catch (supabaseErr) {
          console.error("Resilient fallback: Supabase trusted_vendors sync failed:", supabaseErr);
          if (!savedLocal) throw supabaseErr;
        }
      }

      setShowTvForm(false);
      fetchTrustedVendors();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      safeAlert(`An unexpected error occurred while saving: ${err?.message || err}`);
    }
  };

  const handleDeleteTv = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trusted vendor?")) return;
    try {
      let deletedLocal = false;
      try {
        const res = await fetch(`/api/admin/trusted-vendors/${id}`, { method: "DELETE" });
        if (res.ok) {
          deletedLocal = true;
        }
      } catch (err) {
        console.warn("Local server trusted_vendors delete failed/not available, relying on Supabase:", err);
      }

      // If Supabase is configured, delete from Supabase as well
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from("trusted_vendors").delete().eq("id", id);
          if (error) {
            console.error("Supabase trusted_vendors delete error:", error);
            if (!deletedLocal) throw error;
          } else {
            console.log("Successfully deleted trusted vendor from Supabase!");
          }
        } catch (supabaseErr) {
          console.error("Resilient fallback: Supabase trusted_vendors delete failed:", supabaseErr);
          if (!deletedLocal) throw supabaseErr;
        }
      }

      fetchTrustedVendors();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      safeAlert(`Failed to delete trusted vendor: ${err?.message || err}`);
    }
  };

  // Product addition and editing form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: categories[0]?.name || "CRM Software",
    pricing: "Custom Pricing",
    vendorId: vendors[0]?.id || "ven-1",
    vendorName: vendors[0]?.companyName || "BANTConfirm Verified Partner",
    imagesText: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60",
    imagesText2: "",
    imagesText3: "",
    featuresText: "AI Qualification, Live Matchmaking, Verified Pricing",
    brochureUrl: "#",
    videoUrl: "",
    faqQuestion1: "",
    faqAnswer1: "",
    faqQuestion2: "",
    faqAnswer2: "",
    approved: true,
    isFeatured: false,
    showSimilar: false
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeImageSlot, setActiveImageSlot] = useState<1 | 2 | 3>(1);

  const handleFileProcess = (file: File, slot: 1 | 2 | 3 = 1) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      safeAlert("Invalid file format. Please upload a JPEG or PNG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setProductForm(prev => {
          const key = slot === 1 ? "imagesText" : slot === 2 ? "imagesText2" : "imagesText3";
          return {
            ...prev,
            [key]: result
          };
        });
        safeAlert(`Image file for Slot ${slot} uploaded and loaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Vendor addition and editing form state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [slaAuditLoading, setSlaAuditLoading] = useState(false);
  const [slaAuditResults, setSlaAuditResults] = useState<any | null>(null);
  const [vendorForm, setVendorForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    mobile: "",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60",
    gstNumber: "",
    panNumber: "",
    website: "",
    businessCategory: "CRM Software",
    location: "India",
    approved: true,
    docVerified: true,
    plan: "Free" as const
  });

  const [isDraggingVendorLogo, setIsDraggingVendorLogo] = useState(false);

  const handleVendorLogoProcess = (file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      safeAlert("Invalid file format. Please upload a JPEG or PNG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setVendorForm(prev => ({
          ...prev,
          logo: result
        }));
        safeAlert("Logo image uploaded and loaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      companyName: vendorForm.companyName,
      name: vendorForm.name,
      email: vendorForm.email,
      password: vendorForm.password,
      mobile: vendorForm.mobile,
      logo: vendorForm.logo,
      gstNumber: vendorForm.gstNumber,
      panNumber: vendorForm.panNumber,
      website: vendorForm.website,
      businessCategory: vendorForm.businessCategory,
      location: vendorForm.location,
      approved: vendorForm.approved,
      docVerified: vendorForm.docVerified,
      plan: vendorForm.plan
    };

    if (editingVendor) {
      if (onUpdateVendor) {
        onUpdateVendor(editingVendor.id, payload);
        safeAlert("Vendor updated successfully!");
      }
    } else {
      if (onAddVendor) {
        onAddVendor(payload);
        safeAlert("Vendor created successfully with automated welcome email credentials!");
      }
    }

    setShowVendorForm(false);
    setEditingVendor(null);
    setVendorForm({
      companyName: "",
      name: "",
      email: "",
      password: "",
      mobile: "",
      logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60",
      gstNumber: "",
      panNumber: "",
      website: "",
      businessCategory: "CRM Software",
      location: "India",
      approved: true,
      docVerified: true,
      plan: "Free"
    });
  };

  const handleStartEditVendor = (v: any) => {
    setEditingVendor(v);
    setVendorForm({
      companyName: v.companyName,
      name: v.name,
      email: v.email || "",
      password: "", // Leave blank on edit for safety
      mobile: v.mobile || "",
      logo: v.logo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60",
      gstNumber: v.gstNumber || "",
      panNumber: v.panNumber || "",
      website: v.website || "",
      businessCategory: v.businessCategory || "CRM Software",
      location: v.location || "India",
      approved: v.approved,
      docVerified: !!v.docVerified,
      plan: (v.plan as any) || "Free"
    });
    setShowVendorForm(true);
  };

  const handleRunSlaAudit = async (testMode: boolean) => {
    setSlaAuditLoading(true);
    setSlaAuditResults(null);
    try {
      const response = await fetch("/api/admin/trigger-followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode })
      });
      const data = await response.json();
      if (response.ok) {
        setSlaAuditResults(data);
        if (data.emailsSent && data.emailsSent.length > 0) {
          safeAlert(`Audit Complete! ${data.emailsSent.length} warning emails successfully dispatched to unresponsive partners.`);
        } else {
          safeAlert("Audit Complete! All assigned partners are fully compliant with response SLAs.");
        }
      } else {
        safeAlert(`Failed to run SLA Audit: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      safeAlert(`Error executing SLA Audit: ${error.message || error}`);
    } finally {
      setSlaAuditLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = productForm.featuresText.split(",").map(f => f.trim()).filter(Boolean);
    const faqs = [];
    if (productForm.faqQuestion1 && productForm.faqAnswer1) {
      faqs.push({ question: productForm.faqQuestion1, answer: productForm.faqAnswer1 });
    }
    if (productForm.faqQuestion2 && productForm.faqAnswer2) {
      faqs.push({ question: productForm.faqQuestion2, answer: productForm.faqAnswer2 });
    }

    const selectedVendor = vendors.find(v => v.id === productForm.vendorId);
    const vendorName = selectedVendor ? selectedVendor.companyName : productForm.vendorName;

    const payload = {
      name: productForm.name,
      description: productForm.description,
      category: productForm.category,
      pricing: productForm.pricing,
      vendorId: productForm.vendorId,
      vendorName,
      images: [productForm.imagesText, productForm.imagesText2, productForm.imagesText3].filter(Boolean),
      features,
      brochureUrl: productForm.brochureUrl || "#",
      videoUrl: productForm.videoUrl || "",
      faqs,
      approved: productForm.approved,
      isFeatured: productForm.isFeatured,
      showSimilar: productForm.showSimilar
    };

    if (editingProduct) {
      if (onUpdateProduct) {
        await onUpdateProduct(editingProduct.id, payload);
      }
    } else {
      if (onAddProduct) {
        await onAddProduct(payload);
      }
    }

    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      category: categories[0]?.name || "CRM Software",
      pricing: "Custom Pricing",
      vendorId: vendors[0]?.id || "ven-1",
      vendorName: vendors[0]?.companyName || "BANTConfirm Verified Partner",
      imagesText: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60",
      imagesText2: "",
      imagesText3: "",
      featuresText: "AI Qualification, Live Matchmaking, Verified Pricing",
      brochureUrl: "#",
      videoUrl: "",
      faqQuestion1: "",
      faqAnswer1: "",
      faqQuestion2: "",
      faqAnswer2: "",
      approved: true,
      isFeatured: false,
      showSimilar: false
    });
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      category: p.category,
      pricing: p.pricing,
      vendorId: p.vendorId,
      vendorName: p.vendorName,
      imagesText: p.images[0] || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60",
      imagesText2: p.images[1] || "",
      imagesText3: p.images[2] || "",
      featuresText: p.features.join(", "),
      brochureUrl: p.brochureUrl || "#",
      videoUrl: p.videoUrl || "",
      faqQuestion1: p.faqs[0]?.question || "",
      faqAnswer1: p.faqs[0]?.answer || "",
      faqQuestion2: p.faqs[1]?.question || "",
      faqAnswer2: p.faqs[1]?.answer || "",
      approved: p.approved,
      isFeatured: p.isFeatured,
      showSimilar: p.showSimilar !== undefined ? !!p.showSimilar : false
    });
    setShowProductForm(true);
  };

  // New Banner form state
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop&q=80",
    linkUrl: "#",
    type: "image" as const
  });

  // New Blog form state
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showSeoAccordion, setShowSeoAccordion] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  
  // Auto-save notification
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");

  const [blogForm, setBlogForm] = useState({
    title: "",
    content: "",
    category: "CRM & Sales",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
    tagsText: "Sourcing, BANT, CRM",
    author: "BANTConfirm Editorial",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    focusKeyword: "",
    schemaMarkup: "",
    slug: "",
    status: "Published" as "Draft" | "Published" | "Scheduled",
    shortDescription: "",
    canonicalUrl: "",
    publishDate: new Date().toISOString().split('T')[0],
    isAiGenerated: false,
    views: 0
  });

  // Filters & Sorting State
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("All");
  const [blogStatusFilter, setBlogStatusFilter] = useState("All");
  const [blogSortBy, setBlogSortBy] = useState<"Latest" | "Oldest" | "Most Viewed" | "Most Liked">("Latest");

  // AI Blog Generator parameters state
  const [showAiBlogWriter, setShowAiBlogWriter] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiAudience, setAiAudience] = useState("SME Decision Makers");
  const [aiIndustry, setAiIndustry] = useState("Technology & B2B Sourcing");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiLanguage, setAiLanguage] = useState("English");
  const [aiLength, setAiLength] = useState("1000 words");
  const [aiSeoKeyword, setAiSeoKeyword] = useState("");
  const [aiCta, setAiCta] = useState("");
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isImprovingContent, setIsImprovingContent] = useState(false);
  const [aiImprovementOutput, setAiImprovementOutput] = useState("");

  // Load draft from localStorage on mount or when opening form
  useEffect(() => {
    if (showBlogForm && !editingBlogId) {
      const saved = localStorage.getItem("bantconfirm_blog_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBlogForm(parsed);
          setAutoSaveStatus("Draft loaded from auto-save!");
          setTimeout(() => setAutoSaveStatus(""), 3000);
        } catch (e) {
          console.error("Failed to parse auto-saved draft");
        }
      }
    }
  }, [showBlogForm, editingBlogId]);

  // Auto-save loop (every 10 seconds)
  useEffect(() => {
    if (!showBlogForm || editingBlogId) return;
    const interval = setInterval(() => {
      localStorage.setItem("bantconfirm_blog_draft", JSON.stringify(blogForm));
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setAutoSaveStatus(`Draft saved at ${timeStr}`);
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }, 10000);

    return () => clearInterval(interval);
  }, [showBlogForm, editingBlogId, blogForm]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingBlogId && blogForm.title) {
      const suggestedSlug = blogForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setBlogForm(prev => ({ ...prev, slug: suggestedSlug }));
    }
  }, [blogForm.title, editingBlogId]);

  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        safeAlert("Only JPEG and PNG format images are allowed for SEO Blog manual guidelines.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBanner(bannerForm);
    setShowBannerForm(false);
    setBannerForm({
      title: "",
      subtitle: "",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop&q=80",
      linkUrl: "#",
      type: "image"
    });
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = blogForm.tagsText.split(",").map(t => t.trim());
    
    let finalSchema = "";
    if (blogForm.schemaMarkup.trim()) {
      try {
        const parsed = JSON.parse(blogForm.schemaMarkup);
        finalSchema = JSON.stringify(parsed);
      } catch (err) {
        console.error("Invalid schema JSON, using raw text input:", err);
        finalSchema = blogForm.schemaMarkup.trim();
      }
    } else {
      finalSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blogForm.title,
        "author": { "@type": "Person", "name": blogForm.author },
        "publisher": { "@type": "Organization", "name": "BANTConfirm" }
      });
    }

    const submissionData = {
      title: blogForm.title,
      content: blogForm.content,
      category: blogForm.category,
      image: blogForm.image,
      tags,
      author: blogForm.author,
      readTime: "5 mins read",
      metaTitle: blogForm.metaTitle.trim() || `${blogForm.title} - BANTConfirm`,
      metaDescription: blogForm.metaDescription.trim() || (blogForm.content ? blogForm.content.substring(0, 155) + "..." : ""),
      metaKeywords: blogForm.metaKeywords.trim() || tags.join(", "),
      focusKeyword: blogForm.focusKeyword.trim(),
      schemaMarkup: finalSchema,
      slug: blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      status: blogForm.status,
      shortDescription: blogForm.shortDescription || (blogForm.content ? blogForm.content.substring(0, 155) + "..." : ""),
      canonicalUrl: blogForm.canonicalUrl || `https://bantconfirm.com/blogs/${blogForm.slug || "sourcing"}`,
      publishDate: blogForm.publishDate || new Date().toISOString(),
      isAiGenerated: blogForm.isAiGenerated,
      views: blogForm.views || 0
    };

    if (editingBlogId) {
      if (onUpdateBlog) {
        onUpdateBlog(editingBlogId, submissionData);
      }
    } else {
      onAddBlog(submissionData);
    }

    // Clear draft storage
    localStorage.removeItem("bantconfirm_blog_draft");

    setShowBlogForm(false);
    setEditingBlogId(null);
    setBlogForm({
      title: "",
      content: "",
      category: "CRM & Sales",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
      tagsText: "Sourcing, BANT, CRM",
      author: "BANTConfirm Editorial",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      focusKeyword: "",
      schemaMarkup: "",
      slug: "",
      status: "Published",
      shortDescription: "",
      canonicalUrl: "",
      publishDate: new Date().toISOString().split('T')[0],
      isAiGenerated: false,
      views: 0
    });
  };

  // Export lead data as CSV (Simulated Excel Download)
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Lead ID,Title,Category,Budget,Timeline,Status,Company,Contact,Phone,Email\n";
    
    leads.forEach(l => {
      csvContent += `"${l.id}","${l.title.replace(/"/g, '""')}","${l.category}","${l.budget}","${l.timeline}","${l.status}","${l.companyName}","${l.contactName}","${l.mobile}","${l.email}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bantconfirm_qualified_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recharts Dashboard Data
  const platformRevenueData = [
    { month: "Jan", Subscriptions: 140000, Leads: 80000, Commission: 45000 },
    { month: "Feb", Subscriptions: 190000, Leads: 110000, Commission: 75000 },
    { month: "Mar", Subscriptions: 280000, Leads: 160000, Commission: 120000 },
    { month: "Apr", Subscriptions: 420000, Leads: 250000, Commission: 180000 }
  ];

  const leadDistributionData = [
    { name: "CRM Software", value: 3 },
    { name: "ERP Software", value: 4 },
    { name: "Cloud Telephony", value: 5 },
    { name: "Accounting", value: 2 }
  ];

  const COLORS = ["#0066FF", "#FFC107", "#9333EA", "#22C55E"];

  // Core CMS text editor buffers
  const [cmsPageEditing, setCmsPageEditing] = useState<'about' | 'terms' | 'privacy'>('about');
  const [cmsText, setCmsText] = useState(cmsPages[cmsPageEditing] || "BANTConfirm description");

  React.useEffect(() => {
    if (cmsPages && cmsPages[cmsPageEditing] !== undefined) {
      setCmsText(cmsPages[cmsPageEditing]);
    }
  }, [cmsPages, cmsPageEditing]);

  const handleCmsSave = () => {
    onUpdateCMSPage(cmsPageEditing, cmsText);
    safeAlert("CMS Page updated live on platform routing.");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Header and navigation bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            BANTConfirm Administrator Console
          </h2>
          <p className="text-xs text-slate-500 mt-1">Global Marketplace Audit & Lead routing controls.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto md:ml-auto md:self-center text-xs font-semibold overflow-x-auto flex-nowrap scrollbar-thin admin-tabs-scrollbar gap-1">
          <style dangerouslySetInnerHTML={{ __html: `
            .admin-tabs-scrollbar::-webkit-scrollbar {
              height: 4px;
            }
            .admin-tabs-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .admin-tabs-scrollbar::-webkit-scrollbar-thumb {
              background-color: #cbd5e1;
              border-radius: 2px;
            }
          `}} />
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('admin-bot')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'admin-bot' ? 'bg-[#0066FF] text-white shadow-xs font-bold' : 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/70 hover:text-indigo-800'
            }`}
          >
            <span className="text-sm">🤖</span> Admin Bot
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'vendors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Catalog Verification
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'leads' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            BANT Routing ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'banners' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Banners Slider
          </button>
          <button
            onClick={() => setActiveTab('marketing-banners')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'marketing-banners' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Marketing → Promo Banners ({marketingBanners.length})
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'blogs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SEO Blog
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'cms' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CMS Copy
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('trusted-vendors')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 ${
              activeTab === 'trusted-vendors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Trusted Vendors ({trustedVendors.length})
          </button>
          <button
            onClick={() => setActiveTab('resend-emails')}
            className={`px-3 py-2 rounded-md cursor-pointer transition-all shrink-0 flex items-center gap-1 font-bold ${
              activeTab === 'resend-emails' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Resend Mail logs
          </button>
        </div>
      </div>

      {/* 0. ADMIN BOT TAB */}
      {activeTab === 'admin-bot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[700px]">
          {/* Bot Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-[#0066FF] rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white">BANTConfirm AI Co-Pilot</h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Live Platform Database Telemetry Active
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
              <span>Model:</span>
              <span className="font-mono text-[10px] text-blue-400 font-bold uppercase">gemini-3.5-flash</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200 text-center">
            <div className="p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Telemetry Users</span>
              <span className="text-xs font-extrabold text-slate-800">{registeredUsers.length} Users</span>
            </div>
            <div className="p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Telemetry Vendors</span>
              <span className="text-xs font-extrabold text-slate-800">{vendors.length} Partners</span>
            </div>
            <div className="p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Products</span>
              <span className="text-xs font-extrabold text-slate-800">{products.length} Items</span>
            </div>
            <div className="p-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">BANT Leads</span>
              <span className="text-xs font-extrabold text-slate-800">{leads.length} Opportunities</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 animate-chat">
            {adminBotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user" ? "bg-slate-200 text-slate-700" : "bg-[#0066FF] text-white"
                }`}>
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                
                <div className={`p-4 rounded-2xl shadow-xs text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-[#0066FF] text-white rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                }`}>
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="space-y-2">
                      {msg.text.split("\n\n").map((p: string, pIdx: number) => {
                        // Simple parser for bullets or bold
                        if (p.startsWith("###")) {
                          return <h4 key={pIdx} className="font-extrabold text-slate-950 text-xs mt-3 mb-1">{p.replace("###", "").trim()}</h4>;
                        }
                        if (p.startsWith("-")) {
                          return (
                            <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                              {p.split("\n").map((li, liIdx) => (
                                <li key={liIdx} className="text-slate-700">
                                  {li.replace(/^- \*\*(.*?)\*\*/g, "$1").replace(/^-/g, "").trim()}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        // Handle bold markers **text**
                        const boldParts = p.split(/\*\*(.*?)\*\*/g);
                        if (boldParts.length > 1) {
                          return (
                            <p key={pIdx} className="text-slate-700">
                              {boldParts.map((part, partIdx) => 
                                partIdx % 2 === 1 ? <strong key={partIdx} className="font-extrabold text-slate-900">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        return <p key={pIdx} className="text-slate-700">{p}</p>;
                      })}
                    </div>
                  )}
                  
                  <span className={`text-[8px] mt-1.5 block text-right ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isAdminBotLoading && (
              <div className="flex gap-3 max-w-lg mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 font-bold shrink-0">
                  🤖
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1">Co-Pilot auditing platform database...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 items-center">
            <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mr-1">Shortcuts:</span>
            <button
              onClick={() => handleSendAdminBot("Show me registered users")}
              className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              👥 Show Users
            </button>
            <button
              onClick={() => handleSendAdminBot("List registered vendors")}
              className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              🏢 Show Vendors
            </button>
            <button
              onClick={() => handleSendAdminBot("Summarize active BANT leads")}
              className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              📊 Summarize Leads
            </button>
            <button
              onClick={() => handleSendAdminBot("Audit product catalog status")}
              className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              💻 Catalog Audit
            </button>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAdminBot();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={adminBotInput}
                onChange={(e) => setAdminBotInput(e.target.value)}
                placeholder="Ask your Admin Co-Pilot to analyze users, vendors, leads or draft a message..."
                disabled={isAdminBotLoading}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={isAdminBotLoading || !adminBotInput.trim()}
                className="bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick numbers bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Buyers</span>
              <p className="text-xl font-black text-slate-800 mt-1">{registeredUsers.filter((u: any) => u.role === 'buyer').length || 1} Active</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Verified Providers</span>
              <p className="text-xl font-black text-slate-800 mt-1">{vendors.length} Partners</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Catalog Items</span>
              <p className="text-xl font-black text-slate-800 mt-1">{products.length} Solutions</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">BANT Leads</span>
              <p className="text-xl font-black text-slate-800 mt-1">{leads.length} Enquiries</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-yellow-400/5 border-yellow-400/20">
              <span className="text-[10px] text-yellow-600 font-bold block uppercase">Dynamic Sitemaps</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Auto-indexing active</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-blue-50/50 border-blue-100">
              <span className="text-[10px] text-[#0066FF] font-bold block uppercase">Platform Revenue</span>
              <p className="text-xl font-black text-slate-800 mt-1">₹8,50,000</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Platform Sourcing Revenue Streams (INR)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={platformRevenueData}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Subscriptions" stackId="1" stroke="#0066FF" fill="#0066FF" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="Leads" stackId="1" stroke="#FFC107" fill="#FFC107" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="Commission" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sourcing Category Pie Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Sourcing Lead Categories Distribution</h3>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leadDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 font-semibold">
                {leadDistributionData.map((d, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{d.name}</span>
                    </div>
                    <span>{d.value} enquiries</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VENDORS & USERS MANAGEMENT TAB */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          {/* Sub Tab Navigation inside Vendors */}
          <div className="flex border-b border-slate-200 gap-4 mb-2">
            <button
              onClick={() => setVendorSubTab('active')}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                vendorSubTab === 'active'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Active Certified Vendors ({vendors.length})
            </button>
            <button
              onClick={() => setVendorSubTab('pipeline')}
              className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                vendorSubTab === 'pipeline'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Vendor / Partner Registrations ({partnerRegistrations.length})
            </button>
          </div>

          {vendorSubTab === 'active' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl border border-slate-200 p-5 shadow-xs gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Solution Integrators / Vendors</h3>
              <p className="text-xs text-slate-500 mt-1">Add manual entries, verify registrations, upgrade plan tiers or delete vendor profiles.</p>
            </div>
            <button
              onClick={() => {
                setEditingVendor(null);
                setVendorForm({
                  companyName: "",
                  name: "",
                  logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60",
                  gstNumber: "",
                  panNumber: "",
                  website: "",
                  businessCategory: "CRM Software",
                  location: "India",
                  approved: true,
                  docVerified: true,
                  plan: "Free",
                  mobile: ""
                });
                setShowVendorForm(!showVendorForm);
              }}
              className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Manual Vendor
            </button>
          </div>

          {/* SLA Response Monitor & Automated Follow-Up Controller */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  ⏱️ Partner SLA & Automated Follow-Up Monitor
                </h4>
                <p className="text-[11px] text-slate-500 max-w-2xl leading-relaxed">
                  BANTConfirm requires partners to initiate contact and update their lead pipeline status within 48 hours of assignment. This automated system triggers follow-up alerts for any lead stuck in the "New" pipeline.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={slaAuditLoading}
                  onClick={() => handleRunSlaAudit(false)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {slaAuditLoading ? "Auditing..." : "Run SLA Audit (48h)"}
                </button>
                <button
                  type="button"
                  disabled={slaAuditLoading}
                  onClick={() => handleRunSlaAudit(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-black px-3 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  ⚡ Run Test Audit (1 Minute)
                </button>
              </div>
            </div>

            {/* SLA Audit Outputs */}
            {slaAuditResults && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 transition-all animate-fadeIn">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Audit execution logs</span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    Total Audited: {slaAuditResults.auditedCount} Assignments
                  </span>
                </div>

                {slaAuditResults.emailsSent && slaAuditResults.emailsSent.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700 font-extrabold flex items-center gap-1.5">
                      ⚠️ Dispatched {slaAuditResults.emailsSent.length} automated warnings to inactive partners:
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded divide-y divide-slate-100">
                      {slaAuditResults.emailsSent.map((item: any, idx: number) => (
                        <div key={idx} className="p-2.5 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                          <div>
                            <p className="font-bold text-slate-800">{item.vendorName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.vendorEmail}</p>
                          </div>
                          <div className="text-right sm:max-w-xs">
                            <p className="text-slate-600 font-medium truncate">Lead: {item.leadTitle}</p>
                            <p className="text-[9px] text-slate-400">Assigned: {new Date(item.assignedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 py-1.5 text-xs text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SLA Compliance Green: All assigned vendors have contacted buyers within the designated SLA timeline.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vendor creation and editing form */}
          {showVendorForm && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-extrabold text-slate-900 text-sm mb-4 border-b pb-2">
                {editingVendor ? `Edit Vendor: ${editingVendor.companyName}` : "Create New Manual Vendor"}
              </h4>
              <form onSubmit={handleVendorSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.companyName}
                      onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Representative Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Business Email Address *</label>
                    <input
                      type="email"
                      required={!editingVendor}
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      placeholder="e.g. partner@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {!editingVendor && (
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Onboarding Password (Optional - Auto-generated if blank)</label>
                      <input
                        type="password"
                        value={vendorForm.password}
                        onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                        placeholder="Leave blank for secure auto-generation"
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">GSTIN / Tax ID *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.gstNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">PAN Card Number</label>
                    <input
                      type="text"
                      value={vendorForm.panNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, panNumber: e.target.value })}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Category Focus *</label>
                    <select
                      value={vendorForm.businessCategory}
                      onChange={(e) => setVendorForm({ ...vendorForm, businessCategory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Plan Tier</label>
                    <select
                      value={vendorForm.plan}
                      onChange={(e) => setVendorForm({ ...vendorForm, plan: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      <option value="Free">Free Basic</option>
                      <option value="Silver">Silver Tier</option>
                      <option value="Gold">Gold Premium</option>
                      <option value="Enterprise">Enterprise Elite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Website URL</label>
                    <input
                      type="text"
                      value={vendorForm.website}
                      onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                      placeholder="e.g. https://example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">HQ Location</label>
                    <input
                      type="text"
                      value={vendorForm.location}
                      onChange={(e) => setVendorForm({ ...vendorForm, location: e.target.value })}
                      placeholder="e.g. Mumbai, India"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Representative Mobile / Phone Number</label>
                    <input
                      type="text"
                      value={vendorForm.mobile}
                      onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium font-mono"
                    />
                  </div>

                  {/* Logo upload & paste */}
                  <div className="md:col-span-2 border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <span className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">Vendor Logo / Avatar</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Paste Logo Link */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <label className="block text-slate-500 mb-1 font-bold text-[10px] uppercase tracking-wider">Option A: Logo URL Link</label>
                          <input
                            type="url"
                            value={vendorForm.logo}
                            onChange={(e) => setVendorForm({ ...vendorForm, logo: e.target.value })}
                            placeholder="https://example.com/logo.png"
                            className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                          />
                        </div>
                        
                        <div className="border border-slate-200 bg-white rounded-lg p-2.5 flex items-center gap-3">
                          {vendorForm.logo ? (
                            <img 
                              src={vendorForm.logo} 
                              alt="Logo Preview" 
                              className="w-12 h-12 rounded border border-slate-100 shadow-xs shrink-0 object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-dashed shrink-0">
                              No image
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-700 text-[11px]">Logo Preview</p>
                            <p className="text-[9px] text-slate-400 font-mono line-clamp-1 select-all max-w-[180px]">
                              {vendorForm.logo || "No logo source"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Drag & Drop File */}
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold text-[10px] uppercase tracking-wider">Option B: Upload Logo File (JPEG, PNG)</label>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingVendorLogo(true);
                          }}
                          onDragLeave={() => setIsDraggingVendorLogo(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingVendorLogo(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleVendorLogoProcess(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => {
                            document.getElementById("vendor-logo-file-input")?.click();
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[100px] ${
                            isDraggingVendorLogo 
                              ? "border-[#0066FF] bg-blue-50/40" 
                              : "border-slate-200 bg-white hover:border-[#0066FF]/60 hover:bg-slate-50/50"
                          }`}
                        >
                          <input 
                            type="file"
                            id="vendor-logo-file-input"
                            accept="image/jpeg, image/png, image/jpg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleVendorLogoProcess(e.target.files[0]);
                              }
                            }}
                          />
                          <UploadCloud className={`w-5 h-5 mb-1 transition-colors ${isDraggingVendorLogo ? "text-[#0066FF]" : "text-slate-400"}`} />
                          <p className="font-bold text-slate-700 text-[10px]">
                            {isDraggingVendorLogo ? "Drop it!" : "Drag & drop JPEG/PNG logo"}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">or click to browse local files</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2 col-span-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vendorForm.approved}
                        onChange={(e) => setVendorForm({ ...vendorForm, approved: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Active Verified Partner</span>
                    </label>

                    <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vendorForm.docVerified}
                        onChange={(e) => setVendorForm({ ...vendorForm, docVerified: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>GSTIN & Identity Docs Verified</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVendorForm(false);
                      setEditingVendor(null);
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0066FF] text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    {editingVendor ? "Save Changes" : "Deploy Vendor"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendor Approvals Queue */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Solution Integrator Registry</h3>
            
            <div className="overflow-x-auto divide-y divide-slate-100">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Company Details</th>
                    <th className="p-3">GSTIN / Tax ID</th>
                    <th className="p-3">Category Focus</th>
                    <th className="p-3">Plan Tier</th>
                    <th className="p-3">Approval Actions</th>
                    <th className="p-3">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-3 font-semibold text-slate-800">
                        <div className="flex items-center space-x-3">
                          <img src={v.logo} alt={v.companyName} className="w-10 h-10 rounded border object-cover shrink-0 bg-slate-50" referrerPolicy="no-referrer" />
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 text-sm leading-snug">{v.companyName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Rep: <strong className="text-slate-700">{v.name || "N/A"}</strong> • Loc: <span className="text-slate-700">{v.location || "India"}</span></p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                              {v.email && <span>📧 {v.email}</span>}
                              {v.mobile && <span>📞 {v.mobile}</span>}
                              {v.website && <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🌐 Website</a>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-mono font-bold text-slate-700 text-[11px]">{v.gstNumber || "N/A"}</p>
                        {v.panNumber && <p className="text-[10px] text-slate-400 font-mono">PAN: {v.panNumber}</p>}
                      </td>
                      <td className="p-3">{v.businessCategory}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                          {v.plan || "Free"}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.approved ? (
                          <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">
                            Partner Active
                          </span>
                        ) : (
                          <button
                            onClick={() => onApproveVendor(v.id)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-3 py-1.5 rounded text-[10px] cursor-pointer"
                          >
                            Approve & Verify Docs
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStartEditVendor(v)}
                            title="Edit Vendor Specs"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete vendor "${v.companyName}"?`)) {
                                if (onDeleteVendor) onDeleteVendor(v.id);
                                safeAlert("Vendor profile deleted successfully.");
                              }
                            }}
                            title="Delete Vendor"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Management List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">App User Registry (Buyers & Sellers)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr className="border-b border-slate-100">
                    <th className="p-3">User Name</th>
                    <th className="p-3">Registered Email</th>
                    <th className="p-3">Default Account Role</th>
                    <th className="p-3">Control status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="p-3 font-mono">{u.email}</td>
                      <td className="p-3 uppercase font-bold text-slate-500">{u.role}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete user registration for "${u.name}"?`)) {
                              if (onDeleteUser) onDeleteUser(u.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          Delete Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          )}

          {vendorSubTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Vendor / Partner Registrations Pipeline</h3>
                  <p className="text-xs text-slate-500 mt-1">Review applicant files, establish direct contact, update pipeline status, or approve/convert into live verified Vendor accounts.</p>
                </div>

                {isRegistrationsLoading ? (
                  <div className="text-center py-10 text-xs text-slate-500 font-semibold">
                    Loading registrations pipeline...
                  </div>
                ) : partnerRegistrations.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed">
                    No registrations in the pipeline yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3">Company Name / Contact</th>
                          <th className="p-3">Email / Mobile</th>
                          <th className="p-3">Products / Services</th>
                          <th className="p-3">Company Description</th>
                          <th className="p-3">Registration Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Process Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {partnerRegistrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/50 transition-all align-top">
                            <td className="p-3">
                              <p className="font-black text-slate-900 text-sm">{reg.companyName}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Rep: <strong className="text-slate-700">{reg.name}</strong></p>
                              <span className={`inline-block mt-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                reg.source === 'SolutionProviderSignup'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {reg.source === 'SolutionProviderSignup' ? 'Vendor Signup' : 'Become Certified Partner'}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-mono text-slate-700 font-bold">{reg.email}</p>
                              <p className="font-mono text-slate-500 text-[10px]">{reg.mobile || "N/A"}</p>
                            </td>
                            <td className="p-3 font-medium text-slate-700 max-w-xs truncate" title={reg.products}>
                              {reg.products || "N/A"}
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs" title={reg.description}>
                              <p className="line-clamp-2 leading-relaxed">{reg.description || "N/A"}</p>
                            </td>
                            <td className="p-3 text-slate-400 text-[10px] font-medium whitespace-nowrap">
                              {reg.createdAt ? new Date(reg.createdAt).toLocaleString() : "N/A"}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  reg.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  reg.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                  reg.status === 'Contacted' ? 'bg-indigo-100 text-indigo-700' :
                                  reg.status === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                                  'bg-yellow-100 text-yellow-700 animate-pulse'
                                }`}>
                                  {reg.status || 'Pending'}
                                </span>
                                <select
                                  value={reg.status || 'Pending'}
                                  onChange={(e) => handleUpdateRegistrationStatus(reg.id, e.target.value)}
                                  className="block w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1.5">
                                {reg.status !== 'Approved' && (
                                  <button
                                    onClick={() => handleApproveRegistration(reg.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded shadow-xs cursor-pointer transition-colors"
                                  >
                                    Approve & Convert
                                  </button>
                                )}
                                {reg.status !== 'Rejected' && (
                                  <button
                                    onClick={() => handleRejectRegistration(reg.id)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                )}
                                {reg.status !== 'Contacted' && (
                                  <button
                                    onClick={() => handleContactRegistration(reg.id)}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Contact
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}      {/* 3. PRODUCT CATALOG VERIFICATION TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl border border-slate-200 p-5 shadow-xs gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Catalog Solutions Curation</h3>
              <p className="text-xs text-slate-500 mt-1">Add manual entries, verify submitted solutions, update specifications or delete products.</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: "",
                  description: "",
                  category: categories[0]?.name || "CRM Software",
                  pricing: "Custom Pricing",
                  vendorId: vendors[0]?.id || "ven-1",
                  vendorName: vendors[0]?.companyName || "BANTConfirm Verified Partner",
                  imagesText: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60",
                  featuresText: "AI Qualification, Live Matchmaking, Verified Pricing",
                  brochureUrl: "#",
                  videoUrl: "",
                  faqQuestion1: "",
                  faqAnswer1: "",
                  faqQuestion2: "",
                  faqAnswer2: "",
                  approved: true,
                  isFeatured: false,
                  showSimilar: false
                });
                setShowProductForm(!showProductForm);
              }}
              className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Manual Product
            </button>
          </div>

          {/* Product form for add/edit */}
          {showProductForm && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-extrabold text-slate-900 text-sm mb-4 border-b pb-2">
                {editingProduct ? `Edit Solution: ${editingProduct.name}` : "Create New Manual Product"}
              </h4>
              <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Solution/Product Name *</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Salesmate CRM Enterprise"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Pricing Label *</label>
                    <input
                      type="text"
                      required
                      value={productForm.pricing}
                      onChange={(e) => setProductForm({ ...productForm, pricing: e.target.value })}
                      placeholder="e.g. ₹1,200/user/month or Custom Quote"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Sourcing Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Associated Vendor / Solution Partner *</label>
                    <select
                      value={productForm.vendorId}
                      onChange={(e) => {
                        const selectedVendor = vendors.find(v => v.id === e.target.value);
                        setProductForm({
                          ...productForm,
                          vendorId: e.target.value,
                          vendorName: selectedVendor ? selectedVendor.companyName : "BANTConfirm Verified Partner"
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-500 mb-1 font-bold">Product Pitch / Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Enter a descriptive overview highlighting key BANT features..."
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2 border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">Solution Product Images (Up to 3 Images)</span>
                      <div className="flex gap-1 p-0.5 bg-slate-200 rounded-lg">
                        {([1, 2, 3] as const).map((slot) => {
                          const val = slot === 1 ? productForm.imagesText : slot === 2 ? productForm.imagesText2 : productForm.imagesText3;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setActiveImageSlot(slot)}
                              className={`py-1 px-2.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                                activeImageSlot === slot
                                  ? "bg-white text-[#0066FF] shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Slot {slot} {val ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Side: URL paste and preview for the active slot */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <label className="block text-slate-500 mb-1 font-bold text-[10px] uppercase tracking-wider">Option A: Image URL Link (Slot {activeImageSlot})</label>
                          <input
                            type="url"
                            id="product-image-url-input"
                            value={activeImageSlot === 1 ? productForm.imagesText : activeImageSlot === 2 ? productForm.imagesText2 : productForm.imagesText3}
                            onChange={(e) => setProductForm({
                              ...productForm,
                              [activeImageSlot === 1 ? "imagesText" : activeImageSlot === 2 ? "imagesText2" : "imagesText3"]: e.target.value
                            })}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                          />
                        </div>
                        
                        <div id="product-image-preview-wrapper" className="border border-slate-200 bg-white rounded-lg p-2.5 flex items-center gap-3">
                          {((activeImageSlot === 1 ? productForm.imagesText : activeImageSlot === 2 ? productForm.imagesText2 : productForm.imagesText3)) ? (
                            <img 
                              src={activeImageSlot === 1 ? productForm.imagesText : activeImageSlot === 2 ? productForm.imagesText2 : productForm.imagesText3} 
                              alt={`Slot ${activeImageSlot} Preview`} 
                              className="w-16 h-16 rounded object-cover border border-slate-100 shadow-xs shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-dashed shrink-0">
                              Empty
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-700 text-[11px]">Live Preview - Slot {activeImageSlot}</p>
                            <p className="text-[9px] text-slate-400 font-mono line-clamp-2 select-all leading-tight max-w-[180px]">
                              {(activeImageSlot === 1 ? productForm.imagesText : activeImageSlot === 2 ? productForm.imagesText2 : productForm.imagesText3) || "No image in this slot"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: File Drag & Drop / Click Upload for active slot */}
                      <div>
                        <label className="block text-slate-500 mb-1 font-bold text-[10px] uppercase tracking-wider">Option B: Upload Image (Slot {activeImageSlot})</label>
                        <div
                          id="product-drag-drop-zone"
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileProcess(e.dataTransfer.files[0], activeImageSlot);
                            }
                          }}
                          onClick={() => {
                            document.getElementById("product-file-input")?.click();
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[110px] ${
                            isDragging 
                              ? "border-[#0066FF] bg-blue-50/40" 
                              : "border-slate-300 bg-white hover:border-[#0066FF] hover:shadow-md hover:shadow-blue-500/5"
                          }`}
                        >
                          <input 
                            type="file"
                            id="product-file-input"
                            accept="image/jpeg, image/png, image/jpg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileProcess(e.target.files[0], activeImageSlot);
                              }
                            }}
                          />
                          <UploadCloud className={`w-6 h-6 mb-1.5 transition-colors ${isDragging ? "text-[#0066FF]" : "text-slate-400"}`} />
                          <p className="font-bold text-slate-700 text-[11px]">
                            {isDragging ? "Drop your image here!" : `Drag & drop JPEG/PNG for Slot ${activeImageSlot}`}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">or click to browse local files</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Features (Comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.featuresText}
                      onChange={(e) => setProductForm({ ...productForm, featuresText: e.target.value })}
                      placeholder="Feature 1, Feature 2, Feature 3"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">PDF Brochure URL / Upload File</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={productForm.brochureUrl}
                        onChange={(e) => setProductForm({ ...productForm, brochureUrl: e.target.value })}
                        placeholder="e.g. # or brochure link"
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="product-pdf-file-input"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (readerEvent) => {
                                const result = readerEvent.target?.result;
                                if (typeof result === "string") {
                                  setProductForm(prev => ({
                                    ...prev,
                                    brochureUrl: result
                                  }));
                                  safeAlert("PDF brochure uploaded and integrated successfully!", "success");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("product-pdf-file-input")?.click()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          Upload PDF File
                        </button>
                        {productForm.brochureUrl && productForm.brochureUrl.startsWith("data:") && (
                          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
                            ✓ PDF Attached (Base64)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Video Showcase URL (Optional)</label>
                    <input
                      type="text"
                      value={productForm.videoUrl}
                      onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                      placeholder="e.g. YouTube or Vimeo link"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* FAQ 1 */}
                  <div className="border border-slate-100 p-3 rounded bg-slate-50/50 space-y-2">
                    <p className="font-bold text-slate-700">FAQ Question 1 (Optional)</p>
                    <input
                      type="text"
                      value={productForm.faqQuestion1}
                      onChange={(e) => setProductForm({ ...productForm, faqQuestion1: e.target.value })}
                      placeholder="e.g. Is there a free trial?"
                      className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      value={productForm.faqAnswer1}
                      onChange={(e) => setProductForm({ ...productForm, faqAnswer1: e.target.value })}
                      placeholder="e.g. Yes, we provide a 14-day premium trial."
                      className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* FAQ 2 */}
                  <div className="border border-slate-100 p-3 rounded bg-slate-50/50 space-y-2">
                    <p className="font-bold text-slate-700">FAQ Question 2 (Optional)</p>
                    <input
                      type="text"
                      value={productForm.faqQuestion2}
                      onChange={(e) => setProductForm({ ...productForm, faqQuestion2: e.target.value })}
                      placeholder="e.g. Do you offer SLA support?"
                      className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      value={productForm.faqAnswer2}
                      onChange={(e) => setProductForm({ ...productForm, faqAnswer2: e.target.value })}
                      placeholder="e.g. Yes, Enterprise contracts include 24/7 SLA."
                      className="w-full bg-white border border-slate-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2 col-span-2">
                    <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.approved}
                        onChange={(e) => setProductForm({ ...productForm, approved: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Auto-Approve / Make Searchable</span>
                    </label>

                    <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Promoted / Sponsored Listing</span>
                    </label>

                    <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all">
                      <input
                        type="checkbox"
                        checked={productForm.showSimilar}
                        onChange={(e) => setProductForm({ ...productForm, showSimilar: e.target.checked })}
                        className="rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="text-xs text-[#0066FF] font-black uppercase tracking-wider">Show Similar Products Recommendations</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0066FF] text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    {editingProduct ? "Save Changes" : "Deploy Product"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr className="border-b border-slate-100">
                    <th className="p-3">Solution Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Pricing Label</th>
                    <th className="p-3">Verification state</th>
                    <th className="p-3">Promotion Status</th>
                    <th className="p-3">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center space-x-2">
                          {p.images && p.images[0] && (
                            <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded border object-cover shrink-0" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">By: {p.vendorName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-500">{p.category}</td>
                      <td className="p-3 font-mono">{p.pricing}</td>
                      <td className="p-3">
                        {p.approved ? (
                          <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                            Approved & Indexing
                          </span>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onApproveProduct(p.id)}
                              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onRejectProduct(p.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onToggleFeatureProduct(p.id)}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            p.isFeatured ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p.isFeatured ? '★ Premium Sponsored' : 'Set Premium'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStartEdit(p)}
                            title="Edit Product Specs"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                if (onDeleteProduct) onDeleteProduct(p.id);
                                safeAlert("Product deleted successfully.");
                              }
                            }}
                            title="Delete Product"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEADS ROUTING & BANT DESK */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Procurement Requirements & BANT Router</h3>
              <p className="text-xs text-slate-400 mt-0.5">Vetter system triggers BANT audits and forwards leads to verified gold vendors.</p>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Export BANT Leads (CSV / Excel)
            </button>
          </div>

          <div className="space-y-4">
            {leads.map((l) => (
              <div key={l.id} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] bg-slate-100 border text-slate-500 px-2.5 py-0.5 rounded uppercase font-bold">{l.category}</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-1.5">{l.title}</h4>
                    <p className="text-[10px] text-slate-400">Buyer: {l.contactName} ({l.companyName}, {l.city})</p>
                  </div>
                  
                  <span className="text-xs font-bold bg-[#0066FF] text-white py-1 px-3 rounded">
                    Status: {l.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="md:col-span-2 space-y-2">
                    <p className="font-bold text-slate-700">Detailed Description:</p>
                    <p className="bg-white p-3 rounded border border-slate-100 line-clamp-3 leading-relaxed">{l.description}</p>
                  </div>

                  {/* BANT Audit summary */}
                  <div className="bg-yellow-400/5 border border-yellow-400/20 p-3 rounded-lg space-y-1 text-[11px]">
                    <p className="font-bold text-slate-800 uppercase text-[9px] tracking-wider border-b border-yellow-400/20 pb-0.5">BANT Auditor Flags</p>
                    <p><strong>[B]:</strong> {l.bant.budget}</p>
                    <p><strong>[A]:</strong> {l.bant.authority}</p>
                    <p><strong>[N]:</strong> {l.bant.need}</p>
                    <p><strong>[T]:</strong> {l.bant.timeline}</p>
                  </div>
                </div>

                {/* Routing / Assignment dropdown */}
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-500">Matched Partner channels:</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {(l as any).assignments && (l as any).assignments.length > 0 ? (
                        (l as any).assignments.map((assignment: any, idx: number) => {
                          let statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                          if (assignment.status === "Contacted") statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                          if (assignment.status === "Proposal Sent") statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                          if (assignment.status === "Won" || assignment.status === "Closed Won" || assignment.status === "Closed") statusColor = "bg-green-50 text-green-700 border-green-200";
                          if (assignment.status === "Lost" || assignment.status === "Closed Lost") statusColor = "bg-rose-50 text-rose-700 border-rose-200";
                          
                          return (
                            <div key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${statusColor}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{assignment.companyName}</span>
                              <span className="opacity-50">•</span>
                              <span className="uppercase text-[9px] tracking-wider">{assignment.status}</span>
                            </div>
                          );
                        })
                      ) : l.assignedVendors && l.assignedVendors.length > 0 ? (
                        l.assignedVendors.map((vId, idx) => (
                          <span key={idx} className="bg-blue-100 text-[#0066FF] px-2.5 py-0.5 rounded font-semibold text-[10px]">
                            Assigned Partner ID: {vId}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No matching vendors assigned yet. Select from dropdown to route.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-slate-500 font-bold shrink-0">Assign Partner Sourcing Desk:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignVendorToLead(l.id, e.target.value);
                          e.target.value = ""; // Reset selector
                        }
                      }}
                      className="bg-white border border-slate-200 rounded p-1.5 text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Vetted Vendor --</option>
                      {vendors.filter(v => v.approved).map((v) => (
                        <option key={v.id} value={v.id}>{v.companyName} ({v.businessCategory})</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BANNERS MANAGEMENT TAB */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Banner Slider Manager</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure, upload, and schedule premium slider campaigns on the home landing screen.</p>
            </div>
            <button
              onClick={() => setShowBannerForm(!showBannerForm)}
              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Banner
            </button>
          </div>

          {/* Banner creation form */}
          {showBannerForm && (
            <form onSubmit={handleBannerSubmit} className="bg-slate-50 border p-4 rounded-xl space-y-4 text-xs max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})} // standard typing
                    placeholder="e.g. Expand Your AI Tech Stack"
                    className="w-full bg-white border rounded p-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Subtext / Marketing Hook *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})}
                    placeholder="e.g. Access qualified AI models with gold implementation partners"
                    className="w-full bg-white border rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Campaign Link Location</label>
                  <input
                    type="text"
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({...bannerForm, linkUrl: e.target.value})}
                    placeholder="#categories"
                    className="w-full bg-white border rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Visual Banner Cover (Image URL)</label>
                  <input
                    type="url"
                    value={bannerForm.image}
                    onChange={(e) => setBannerForm({...bannerForm, image: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white border rounded p-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowBannerForm(false)} className="px-3 py-1.5 border rounded cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#0066FF] text-white font-bold rounded cursor-pointer">Deploy Campaign</button>
              </div>
            </form>
          )}

          {/* Banners List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((ban) => (
              <div key={ban.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="h-32 bg-slate-900 relative">
                  <img src={ban.image} alt={ban.title} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                    <h4 className="font-extrabold text-xs">{ban.title}</h4>
                    <p className="text-[10px] text-slate-300 mt-1">{ban.subtitle}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t flex justify-between items-center text-xs">
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border font-semibold">Active Campaign</span>
                  <button
                    onClick={() => onDeleteBanner(ban.id)}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SEO BLOG MANAGEMENT TAB */}
      {activeTab === 'blogs' && (() => {
        // Compute dashboard metrics
        const totalBlogs = blogs.length;
        const publishedBlogs = blogs.filter(b => b.status === "Published" || !b.status).length;
        const draftBlogs = blogs.filter(b => b.status === "Draft").length;
        const scheduledBlogs = blogs.filter(b => b.status === "Scheduled").length;
        const aiGeneratedBlogs = blogs.filter(b => b.isAiGenerated).length;
        const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0) + (blogs.length * 142); // Realistic organic views baseline

        // Filter and Sort manuals
        const filteredBlogs = blogs.filter(b => {
          const titleContent = `${b.title} ${b.content}`.toLowerCase();
          const matchesSearch = titleContent.includes(blogSearchQuery.toLowerCase());
          const matchesCategory = blogCategoryFilter === "All" || b.category === blogCategoryFilter;
          const matchesStatus = blogStatusFilter === "All" || 
                                (blogStatusFilter === "Published" && (b.status === "Published" || !b.status)) ||
                                (b.status === blogStatusFilter);
          return matchesSearch && matchesCategory && matchesStatus;
        }).sort((a, b) => {
          if (blogSortBy === "Oldest") {
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          } else if (blogSortBy === "Most Viewed") {
            return (b.views || 0) - (a.views || 0);
          } else if (blogSortBy === "Most Liked") {
            return (b.likes || 0) - (a.likes || 0);
          } else {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }
        });

        // Markdown visual renderer
        const renderMarkdownToHtml = (mdText: string) => {
          if (!mdText) return "<p class='text-slate-400 italic'>Write content to preview it here...</p>";
          let html = mdText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          html = html.replace(/^# (.*?)$/gm, '<h1 class="text-sm font-extrabold text-[#0066FF] border-b pb-1 mt-4 mb-1.5">$1</h1>');
          html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xs font-bold text-slate-800 mt-3 mb-1 border-l-4 border-[#0066FF] pl-2">$1</h2>');
          html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xs font-semibold text-slate-700 mt-2 mb-1">$1</h3>');
          html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
          html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-slate-600">$1</li>');
          html = html.replace(/\n\n/g, '</p><p class="text-slate-600 mb-2 leading-relaxed">');
          return '<p class="text-slate-600 mb-2 leading-relaxed">' + html + '</p>';
        };

        const handleGenerateAiBlog = async () => {
          if (!aiTopic) {
            safeAlert("Please provide a blog topic for Gemini.");
            return;
          }
          setIsGeneratingBlog(true);
          try {
            const res = await fetch("/api/gemini/generate-blog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic: aiTopic,
                keywords: aiKeywords,
                targetAudience: aiAudience,
                industry: aiIndustry,
                tone: aiTone,
                language: aiLanguage,
                length: aiLength,
                seoKeyword: aiSeoKeyword,
                cta: aiCta
              })
            });
            if (res.ok) {
              const data = await res.json();
              setBlogForm({
                title: data.title || "",
                content: data.content || "",
                category: data.category || "CRM & Sales",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
                tagsText: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || "Sourcing, AI"),
                author: "BANTConfirm AI Writer",
                metaTitle: data.metaTitle || "",
                metaDescription: data.metaDescription || "",
                metaKeywords: Array.isArray(data.tags) ? data.tags.join(", ") : "",
                focusKeyword: aiSeoKeyword || aiTopic,
                schemaMarkup: data.schemaMarkup || "",
                slug: data.slug || "",
                status: "Draft",
                shortDescription: data.introduction || data.metaDescription || "",
                canonicalUrl: `https://bantconfirm.com/blogs/${data.slug}`,
                publishDate: new Date().toISOString().split('T')[0],
                isAiGenerated: true,
                views: 0
              });
              setShowBlogForm(true);
              setEditingBlogId(null);
              setShowAiBlogWriter(false);
              safeAlert("Sourcing manual generated! Review, polish, and publish using the form below.");
            } else {
              safeAlert("Failed to generate from AI. Falling back to local template.");
            }
          } catch (err) {
            console.error(err);
            safeAlert("AI generation failed.");
          } finally {
            setIsGeneratingBlog(false);
          }
        };

        const handleImproveBlog = async (action: string) => {
          if (!blogForm.content) {
            safeAlert("Content is empty.");
            return;
          }
          setIsImprovingContent(true);
          setAiImprovementOutput("");
          try {
            const res = await fetch("/api/gemini/improve-blog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action,
                content: blogForm.content,
                title: blogForm.title,
                focusKeyword: blogForm.focusKeyword
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (["improve", "rewrite", "expand", "shorten", "grammar", "seo", "faq"].includes(action)) {
                setBlogForm(prev => ({ ...prev, content: data.text }));
                setAutoSaveStatus("Polished with Gemini! 👍");
                setTimeout(() => setAutoSaveStatus(""), 3000);
              } else {
                setAiImprovementOutput(data.text);
                if (action === "meta_desc") {
                  setBlogForm(prev => ({ ...prev, metaDescription: data.text.substring(0, 155) }));
                }
              }
            } else {
              safeAlert("Polish action failed.");
            }
          } catch (err) {
            console.error(err);
            safeAlert("Polish error.");
          } finally {
            setIsImprovingContent(false);
          }
        };

        return (
          <div className="space-y-6">
            {/* 1. Header & Quick Toggles */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0066FF]" />
                  AI-Powered BANT Sourcing Manuals
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Draft, schedule, fine-tune, and publish high-converting SEO B2B Buyer Manuals instantly.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowAiBlogWriter(!showAiBlogWriter);
                    setShowBlogForm(false);
                  }}
                  className={`font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer border transition-colors ${
                    showAiBlogWriter 
                      ? 'bg-amber-50 border-amber-300 text-amber-700' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Gemini AI Blog Writer
                </button>
                <button
                  onClick={() => {
                    setShowBlogForm(!showBlogForm);
                    setShowAiBlogWriter(false);
                    setEditingBlogId(null);
                    setBlogForm({
                      title: "",
                      content: "",
                      category: "CRM & Sales",
                      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
                      tagsText: "Sourcing, BANT, CRM",
                      author: "BANTConfirm Editorial",
                      metaTitle: "",
                      metaDescription: "",
                      metaKeywords: "",
                      focusKeyword: "",
                      schemaMarkup: "",
                      slug: "",
                      status: "Published",
                      shortDescription: "",
                      canonicalUrl: "",
                      publishDate: new Date().toISOString().split('T')[0],
                      isAiGenerated: false,
                      views: 0
                    });
                  }}
                  className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Manual Editor
                </button>
              </div>
            </div>

            {/* 2. Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: "Total Manuals", val: totalBlogs, bg: "bg-slate-50", text: "text-slate-800" },
                { label: "Published", val: publishedBlogs, bg: "bg-green-50/50", text: "text-green-700" },
                { label: "Drafts", val: draftBlogs, bg: "bg-amber-50/50", text: "text-amber-700" },
                { label: "Scheduled", val: scheduledBlogs, bg: "bg-blue-50/50", text: "text-blue-700" },
                { label: "AI Generated", val: aiGeneratedBlogs, bg: "bg-purple-50/50", text: "text-purple-700" },
                { label: "Organic Views", val: totalViews, bg: "bg-indigo-50/50", text: "text-indigo-700" }
              ].map((m, idx) => (
                <div key={idx} className={`${m.bg} p-3 rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs`}>
                  <span className="text-[10px] text-slate-400 font-medium">{m.label}</span>
                  <span className={`text-base font-extrabold ${m.text} mt-1`}>{m.val}</span>
                </div>
              ))}
            </div>

            {/* 3. Filter Toolbar */}
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search manuals..."
                  value={blogSearchQuery}
                  onChange={(e) => setBlogSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 shrink-0 font-medium">Category:</span>
                <select
                  value={blogCategoryFilter}
                  onChange={(e) => setBlogCategoryFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs"
                >
                  <option value="All">All Categories</option>
                  <option value="CRM & Sales">CRM & Sales</option>
                  <option value="B2B Strategy">B2B Strategy</option>
                  <option value="Cloud Telephony">Cloud Telephony</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 shrink-0 font-medium">Status:</span>
                <select
                  value={blogStatusFilter}
                  onChange={(e) => setBlogStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Drafts</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 shrink-0 font-medium">Sort:</span>
                <select
                  value={blogSortBy}
                  onChange={(e) => setBlogSortBy(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs"
                >
                  <option value="Latest">Latest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Most Viewed">Most Viewed</option>
                  <option value="Most Liked">Most Liked</option>
                </select>
              </div>
            </div>

            {/* 4. AI Blog Writer Panel */}
            {showAiBlogWriter && (
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-4 rounded-xl text-white border border-slate-800 space-y-4 shadow-md text-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#FFDF00] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Gemini Enterprise Sourcing Manual Planner
                  </h4>
                  <p className="text-[10px] text-slate-300">Prompt BANTConfirm's AI Copywriting agent to write qualified articles on SMEs.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1 font-semibold">Core Topic / Headline focus *</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. 5 Critical things to check before choosing Salesforce vs Odoo"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Keywords</label>
                    <input
                      type="text"
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder="CRM software, Odoo, SME"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Audience Focus</label>
                    <select
                      value={aiAudience}
                      onChange={(e) => setAiAudience(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option>SME Decision Makers</option>
                      <option>Enterprise IT Architects</option>
                      <option>Sourcing Officers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Tone of Voice</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option>Professional</option>
                      <option>Technical & Analytical</option>
                      <option>Conversational & Direct</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Focus SEO Keyword</label>
                    <input
                      type="text"
                      value={aiSeoKeyword}
                      onChange={(e) => setAiSeoKeyword(e.target.value)}
                      placeholder="e.g. Salesforce vs Odoo"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-300 mb-1 font-semibold">Call to Action (CTA)</label>
                    <input
                      type="text"
                      value={aiCta}
                      onChange={(e) => setAiCta(e.target.value)}
                      placeholder="e.g. Request a pre-qualified Odoo quote from BANTConfirm partners"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAiBlogWriter(false)}
                    className="px-3.5 py-1.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAiBlog}
                    disabled={isGeneratingBlog}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isGeneratingBlog ? (
                      <span className="inline-block animate-spin border-2 border-slate-950 border-t-transparent w-3 h-3 rounded-full"></span>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate with Gemini AI
                  </button>
                </div>
              </div>
            )}

            {/* 5. Manual & AI Editor Form */}
            {showBlogForm && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-4 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-700 text-xs flex items-center gap-1">
                    <FileText className="w-4 h-4 text-[#0066FF]" />
                    {editingBlogId ? "Edit Sourcing Manual" : "Draft New Sourcing Manual"}
                    {blogForm.isAiGenerated && (
                      <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ml-1">AI Generated</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {autoSaveStatus && (
                      <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200 animate-pulse">
                        {autoSaveStatus}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">Auto-saves drafts offline</span>
                  </div>
                </div>

                <form onSubmit={handleBlogSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Article Title *</label>
                      <input
                        type="text"
                        required
                        value={blogForm.title}
                        onChange={(e) => setBlogForm({...blogForm, title: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Category Focus</label>
                      <select
                        value={blogForm.category}
                        onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5"
                      >
                        <option>CRM & Sales</option>
                        <option>B2B Strategy</option>
                        <option>Cloud Telephony</option>
                        <option>Cyber Security</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">URL Slug *</label>
                      <input
                        type="text"
                        required
                        value={blogForm.slug}
                        onChange={(e) => setBlogForm({...blogForm, slug: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-[11px]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Short Description *</label>
                      <input
                        type="text"
                        required
                        value={blogForm.shortDescription}
                        onChange={(e) => setBlogForm({...blogForm, shortDescription: e.target.value})}
                        placeholder="Snippet summarizing key points for search listings (approx. 100-140 characters)"
                        className="w-full bg-white border border-slate-200 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={blogForm.tagsText}
                        onChange={(e) => setBlogForm({...blogForm, tagsText: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Author Name</label>
                      <input
                        type="text"
                        value={blogForm.author}
                        onChange={(e) => setBlogForm({...blogForm, author: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Header Image Cover (JPEG/PNG) *</label>
                      <div className="flex items-center gap-3 bg-white p-1 border rounded">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleBlogImageUpload}
                          className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0066FF] cursor-pointer"
                        />
                        {blogForm.image && (
                          <div className="relative w-8 h-8 rounded border overflow-hidden shrink-0">
                            <img src={blogForm.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Publish Status</label>
                      <select
                        value={blogForm.status}
                        onChange={(e) => setBlogForm({...blogForm, status: e.target.value as any})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 font-bold text-slate-700"
                      >
                        <option value="Published">Published (Live)</option>
                        <option value="Draft">Draft</option>
                        <option value="Scheduled">Scheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Publish Date</label>
                      <input
                        type="date"
                        value={blogForm.publishDate}
                        onChange={(e) => setBlogForm({...blogForm, publishDate: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-1.5"
                      />
                    </div>
                  </div>

                  {/* Twin Panel Content & Visual Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-slate-700 font-bold">Manual Content Body (Markdown Supported)</label>
                      </div>

                      {/* AI Copier Tweaker Bar */}
                      <div className="flex flex-wrap gap-1 bg-blue-50/50 p-1.5 border border-blue-100 rounded-lg mb-2 items-center">
                        <span className="text-[9px] text-[#0066FF] font-extrabold uppercase mr-1 flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-3 h-3" />
                          Gemini Tweaks:
                        </span>
                        {[
                          { action: "improve", label: "Flow" },
                          { action: "rewrite", label: "Rewrite" },
                          { action: "expand", label: "Expand" },
                          { action: "shorten", label: "Shorten" },
                          { action: "grammar", label: "Grammar" },
                          { action: "seo", label: "SEO Optimize" },
                          { action: "faq", label: "Add FAQs" }
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={isImprovingContent}
                            onClick={() => handleImproveBlog(btn.action)}
                            className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 hover:bg-blue-50 font-medium disabled:opacity-40"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={12}
                        required
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({...blogForm, content: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded p-2 font-mono text-[11px]"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-slate-700 font-bold mb-1">Live Visual Previewer</label>
                      <div className="flex-1 bg-white border border-slate-200 rounded p-3 overflow-y-auto max-h-[350px] shadow-inner text-left">
                        {blogForm.image && (
                          <div className="h-28 rounded-lg overflow-hidden mb-3">
                            <img src={blogForm.image} alt="Header Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <h1 className="text-sm font-extrabold text-slate-800 leading-tight mb-1">{blogForm.title || "Untitled Blog"}</h1>
                        <div className="flex gap-2 text-[10px] text-slate-400 mb-2 border-b pb-1">
                          <span>By {blogForm.author}</span>
                          <span>•</span>
                          <span>Category: {blogForm.category}</span>
                        </div>
                        <div 
                          className="prose text-slate-600 text-[11px] leading-relaxed" 
                          dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(blogForm.content) }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Copywriting Assets Generation Bar */}
                  <div className="bg-[#0066FF]/5 border border-[#0066FF]/10 p-3 rounded-xl space-y-2">
                    <span className="font-extrabold text-[#0066FF] text-[10px] uppercase block tracking-wide">Generate Marketing Assets with Gemini</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { action: "summary", label: "Executive Summary" },
                        { action: "social_caption", label: "Instagram Caption" },
                        { action: "linkedin", label: "LinkedIn Post" },
                        { action: "meta_desc", label: "Clickable Meta Description" }
                      ].map((asset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isImprovingContent}
                          onClick={() => handleImproveBlog(asset.action)}
                          className="bg-white border border-blue-200 text-blue-700 font-bold text-[10px] px-2.5 py-1 rounded hover:bg-blue-50/50 disabled:opacity-50 shrink-0"
                        >
                          {asset.label}
                        </button>
                      ))}
                    </div>

                    {isImprovingContent && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 py-1.5">
                        <span className="inline-block animate-spin border-2 border-blue-600 border-t-transparent w-3 h-3 rounded-full"></span>
                        Gemini is brainstorming. Please wait...
                      </div>
                    )}

                    {aiImprovementOutput && (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-left mt-2 shadow-xs">
                        <div className="flex justify-between items-center border-b pb-1 mb-1 text-[9px] font-extrabold text-[#0066FF] uppercase">
                          <span>Brainstormed Asset Output</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiImprovementOutput);
                              setAutoSaveStatus("Copied to Clipboard! 📋");
                              setTimeout(() => setAutoSaveStatus(""), 3000);
                            }}
                            className="bg-[#0066FF] text-white px-2 py-0.5 rounded text-[8px] cursor-pointer"
                          >
                            Copy Output
                          </button>
                        </div>
                        <pre className="font-sans text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                          {aiImprovementOutput}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Technical SEO Accordion Section */}
                  <div className="border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowSeoAccordion(!showSeoAccordion)}
                      className="flex items-center justify-between w-full bg-slate-100 hover:bg-slate-200/80 p-2 rounded-lg font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1">🔍 Technical SEO, Canonical Tags & JSON-LD Structured Data</span>
                      <span className="text-xs">{showSeoAccordion ? "Collapse ▲" : "Expand ▼"}</span>
                    </button>

                    {showSeoAccordion && (
                      <div className="mt-3 space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-left">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Focus Keyword</label>
                            <input
                              type="text"
                              value={blogForm.focusKeyword}
                              onChange={(e) => setBlogForm({...blogForm, focusKeyword: e.target.value})}
                              placeholder="e.g. ERP Sourcing"
                              className="w-full bg-white border border-slate-200 rounded p-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Canonical URL</label>
                            <input
                              type="text"
                              value={blogForm.canonicalUrl}
                              onChange={(e) => setBlogForm({...blogForm, canonicalUrl: e.target.value})}
                              placeholder="e.g. https://bantconfirm.com/blogs/erp-sourcing"
                              className="w-full bg-white border border-slate-200 rounded p-1.5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">SEO Title Tag (Meta Title)</label>
                          <input
                            type="text"
                            value={blogForm.metaTitle}
                            onChange={(e) => setBlogForm({...blogForm, metaTitle: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded p-1.5"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">SEO Meta Description Tag</label>
                          <textarea
                            rows={2}
                            value={blogForm.metaDescription}
                            onChange={(e) => setBlogForm({...blogForm, metaDescription: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded p-1.5"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">JSON-LD Structured Schema Markup</label>
                          <textarea
                            rows={4}
                            value={blogForm.schemaMarkup}
                            onChange={(e) => setBlogForm({...blogForm, schemaMarkup: e.target.value})}
                            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "BlogPosting",\n  "headline": "..."\n}`}
                            className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-[10px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3 border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlogForm(false);
                        setEditingBlogId(null);
                      }}
                      className="px-3.5 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 bg-[#0066FF] text-white font-extrabold rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      {editingBlogId ? "Save Changes" : "Publish Sourcing Manual"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. Directory listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBlogs.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs font-bold">No sourcing manuals found matching criteria.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Try resetting filters or prompt the AI above to draft a fresh manual.</p>
                </div>
              ) : (
                filteredBlogs.map((b) => (
                  <div key={b.id} className="border border-slate-200/80 rounded-xl bg-white p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] bg-blue-50 text-[#0066FF] px-2 py-0.5 rounded font-extrabold uppercase">{b.category}</span>
                          
                          {/* Status Badge */}
                          {(!b.status || b.status === "Published") && (
                            <span className="bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-green-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Live
                            </span>
                          )}
                          {b.status === "Draft" && (
                            <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Draft
                            </span>
                          )}
                          {b.status === "Scheduled" && (
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Scheduled
                            </span>
                          )}

                          {b.isAiGenerated && (
                            <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-purple-100">
                              <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                              AI Crafted
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              // Open editing form and populate
                              setEditingBlogId(b.id);
                              setBlogForm({
                                title: b.title,
                                content: b.content,
                                category: b.category,
                                image: b.image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop",
                                tagsText: Array.isArray(b.tags) ? b.tags.join(", ") : "",
                                author: b.author || "BANTConfirm Editorial",
                                metaTitle: b.metaTitle || "",
                                metaDescription: b.metaDescription || "",
                                metaKeywords: b.metaKeywords || "",
                                focusKeyword: b.focusKeyword || "",
                                schemaMarkup: b.schemaMarkup || "",
                                slug: b.slug || "",
                                status: b.status || "Published",
                                shortDescription: b.shortDescription || b.excerpt || "",
                                canonicalUrl: b.canonicalUrl || "",
                                publishDate: b.publishDate ? b.publishDate.split('T')[0] : new Date().toISOString().split('T')[0],
                                isAiGenerated: b.isAiGenerated || false,
                                views: b.views || 0
                              });
                              setShowBlogForm(true);
                              setShowAiBlogWriter(false);
                            }}
                            className="p-1 border rounded hover:bg-slate-50 text-slate-500 hover:text-slate-700 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBlog(b.id)}
                            className="p-1 border rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 leading-tight line-clamp-1">{b.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{b.shortDescription || b.content.replace(/[#*]/g, "")}</p>
                    </div>

                    <div className="border-t border-slate-100/80 pt-2.5 mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex gap-2">
                        <span>👁️ {b.views || 0} views</span>
                        <span>❤️ {b.likes || 0} likes</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        {(!b.status || b.status === "Published") ? (
                          <button
                            onClick={() => {
                              if (onUpdateBlog) {
                                onUpdateBlog(b.id, { ...b, status: "Draft" });
                              }
                            }}
                            className="text-slate-500 font-bold hover:underline"
                          >
                            Revert to draft
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (onUpdateBlog) {
                                onUpdateBlog(b.id, { ...b, status: "Published" });
                              }
                            }}
                            className="text-[#0066FF] font-bold hover:underline"
                          >
                            Publish instantly
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* 7. CMS PAGES & CORE COPY */}
      {activeTab === 'cms' && (
        <div className="bg-white border rounded-xl p-5 space-y-4 max-w-xl mx-auto text-xs text-slate-700">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Dynamic Corporate Page Editors (CMS)</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold">Update B2B footer link content and regulatory agreements in real-time.</p>
          </div>

          <div className="flex border-b border-slate-100 p-1 bg-slate-50 rounded">
            {["about", "terms", "privacy"].map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCmsPageEditing(page as any);
                  setCmsText(cmsPages[page] || "Initial page text");
                }}
                className={`flex-1 text-center py-2 font-bold rounded capitalize cursor-pointer ${
                  cmsPageEditing === page ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                {page} Page Content
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block text-slate-500 font-bold uppercase text-[10px]">HTML Page Copy Editor</label>
            <textarea
              rows={8}
              value={cmsText}
              onChange={(e) => setCmsText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-3 font-mono text-slate-800 leading-relaxed focus:outline-none focus:bg-white"
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleCmsSave}
                className="bg-[#0066FF] text-white font-bold py-2 px-5 rounded cursor-pointer"
              >
                Publish CMS Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. REGISTERED USERS MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl border border-slate-200 p-5 shadow-xs gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Registered Users Registry</h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitor and manage all user accounts registered on the platform, including buyers, vendors, and admins.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100">
                Total Registrations: {registeredUsers.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">User Directory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 select-none text-[10px] uppercase tracking-wider">
                    <th className="p-3">User Profile</th>
                    <th className="p-3">Contact Email</th>
                    <th className="p-3">Mobile Number</th>
                    <th className="p-3">Company Name</th>
                    <th className="p-3">Location (City)</th>
                    <th className="p-3">Platform Role</th>
                    <th className="p-3">Registration Date</th>
                    <th className="p-3">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    registeredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066FF] font-black text-xs flex items-center justify-center border border-blue-200">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">{u.name || "N/A"}</p>
                              <p className="text-[10px] text-slate-400 font-mono select-all">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {u.email}
                        </td>
                        <td className="p-3">
                          {u.mobile ? (
                            <span className="font-mono text-slate-700 font-bold">{u.mobile}</span>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[9px] uppercase">
                              Required / Missing
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {u.companyName ? (
                            <span className="font-semibold text-slate-700">{u.companyName}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 uppercase italic">
                              Not Provided (Optional)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {u.city ? (
                            <span className="font-semibold text-slate-700">{u.city}</span>
                          ) : (
                            <span className="text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[9px] uppercase">
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : u.role === 'vendor'
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {u.role || "buyer"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[10px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : "N/A"}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user registration for "${u.name}"?`)) {
                                if (onDeleteUser) onDeleteUser(u.id);
                              }
                            }}
                            title="Delete User Registration Record"
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded transition-colors cursor-pointer inline-flex items-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. CATEGORIES MANAGEMENT TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl border border-slate-200 p-5 shadow-xs gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Categories Manager</h3>
              <p className="text-xs text-slate-500 mt-1">
                Define the marketplace taxonomies, add new software categories, and prune unused ones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100">
                Active Categories: {categories.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Add New Category Form */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                Add New Category
              </h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem("catName") as HTMLInputElement).value;
                const description = (form.elements.namedItem("catDesc") as HTMLTextAreaElement).value;
                const icon = (form.elements.namedItem("catIcon") as HTMLInputElement).value || "Layers";
                
                if (!name) {
                  safeAlert("Category Name is required!");
                  return;
                }

                if (onAddCategory) {
                  onAddCategory({ name, description, icon });
                  form.reset();
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category Name *</label>
                  <input
                    type="text"
                    name="catName"
                    placeholder="e.g. ERP Systems"
                    required
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Icon Class Name</label>
                  <input
                    type="text"
                    name="catIcon"
                    placeholder="e.g. Layers, ShoppingBag, Database"
                    defaultValue="Layers"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Available Lucide icons list includes: Layers, ShoppingBag, Database, Users, Calendar, BarChart.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Short Description</label>
                  <textarea
                    name="catDesc"
                    rows={3}
                    placeholder="Brief overview of the category offerings..."
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Create Category
                </button>
              </form>
            </div>

            {/* Right: Category List */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Existing Taxonomies</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 select-none text-[10px] uppercase tracking-wider">
                      <th className="p-3">Category info</th>
                      <th className="p-3">Icon</th>
                      <th className="p-3">Products Count</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-8 text-slate-400">
                          No categories found. Create one on the left.
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-800 text-xs">{c.name}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.description || "No description provided."}</p>
                            <p className="text-[9px] text-slate-300 font-mono select-all">ID: {c.id}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded text-[10px]">
                              {c.icon}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {c.productsCount || 0}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the "${c.name}" category?`)) {
                                  if (onDeleteCategory) onDeleteCategory(c.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-900 font-bold text-[11px] p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. TRUSTED VENDORS MANAGEMENT TAB */}
      {activeTab === 'trusted-vendors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800">Trusted Vendors Showcase Management</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Add, edit, and organize system integrator and OEM logos displayed in the orbital carousel on ClientConfirm.com homepage.
              </p>
            </div>
            <button
              onClick={handleOpenAddTv}
              className="bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Vendor Logo
            </button>
          </div>

          {/* Form Modal / Panel */}
          {showTvForm && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl mx-auto transition-all animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <h4 className="font-bold text-sm text-slate-800">
                  {editingTv ? "Edit Trusted Vendor Logo" : "Add New Trusted Vendor Logo"}
                </h4>
                <button
                  onClick={() => setShowTvForm(false)}
                  className="text-slate-400 hover:text-slate-600 font-black text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveTv} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block uppercase text-[10px] tracking-wider text-slate-500">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cisco Systems, Microsoft BANT Partner"
                    value={tvForm.vendor_name}
                    onChange={(e) => setTvForm({ ...tvForm, vendor_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[10px] tracking-wider text-slate-500">Logo Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/logo.png"
                    value={tvForm.logo_url}
                    onChange={(e) => setTvForm({ ...tvForm, logo_url: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[10px] tracking-wider text-slate-500">Upload Logo File (JPEG, PNG)</label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingTvLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingTvLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingTvLogo(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleTvLogoProcess(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      document.getElementById("tv-logo-file-input")?.click();
                    }}
                    className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[42px] ${
                      isDraggingTvLogo 
                        ? "border-[#0066FF] bg-blue-50/40" 
                        : "border-slate-200 bg-white hover:border-[#0066FF]/60 hover:bg-slate-50/50"
                    }`}
                  >
                    <input 
                      type="file"
                      id="tv-logo-file-input"
                      accept="image/jpeg, image/png, image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleTvLogoProcess(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <UploadCloud className={`w-4 h-4 transition-colors ${isDraggingTvLogo ? "text-[#0066FF]" : "text-slate-400"}`} />
                      <p className="font-bold text-slate-700 text-[10px]">
                        {isDraggingTvLogo ? "Drop it!" : "Drag & drop file or browse"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[10px] tracking-wider text-slate-500">Logo Live Preview</label>
                  <div className="h-[42px] flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3">
                    {tvForm.logo_url ? (
                      <img
                        src={tvForm.logo_url}
                        alt="Preview"
                        className="h-7 w-auto object-contain max-w-[120px]"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/120x40/f1f5f9/94a3b8?text=Broken+Link";
                        }}
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400">Waiting for logo url...</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block uppercase text-[10px] tracking-wider text-slate-500">Website URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://www.cisco.com"
                    value={tvForm.website_url}
                    onChange={(e) => setTvForm({ ...tvForm, website_url: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block uppercase text-[10px] tracking-wider text-slate-500">Display Order</label>
                    <input
                      type="number"
                      min={0}
                      value={tvForm.display_order}
                      onChange={(e) => setTvForm({ ...tvForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block uppercase text-[10px] tracking-wider text-slate-500">Status</label>
                    <select
                      value={tvForm.is_active ? "true" : "false"}
                      onChange={(e) => setTvForm({ ...tvForm, is_active: e.target.value === "true" })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-[#0066FF]"
                    >
                      <option value="true">Active (Showcase on Home)</option>
                      <option value="false">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t mt-2">
                  <button
                    type="button"
                    onClick={() => setShowTvForm(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" /> Save Vendor Config
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Verified Logos Directory ({trustedVendors.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase border-b">
                    <th className="p-4 font-bold">Logo</th>
                    <th className="p-4 font-bold">Vendor Name</th>
                    <th className="p-4 font-bold">Website Destination</th>
                    <th className="p-4 font-bold text-center">Display Order</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTv ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <span className="animate-pulse">Loading verified vendor showcase directory...</span>
                      </td>
                    </tr>
                  ) : trustedVendors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No trusted vendors currently defined. Click "Add Vendor Logo" to bootstrap the directory.
                      </td>
                    </tr>
                  ) : (
                    trustedVendors.map((tv) => (
                      <tr key={tv.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4">
                          <div className="w-20 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center justify-center">
                            <img
                              src={tv.logo_url}
                              alt={tv.vendor_name}
                              className="max-h-full max-w-full object-contain filter"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/120x40/f1f5f9/94a3b8?text=No+Logo";
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-sm">{tv.vendor_name}</p>
                          <p className="text-[9px] text-slate-400 font-mono select-all mt-0.5">TV_ID: {tv.id}</p>
                        </td>
                        <td className="p-4">
                          {tv.website_url ? (
                            <a
                              href={tv.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>{tv.website_url}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">None provided</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-mono font-bold border">
                            {tv.display_order}
                          </span>
                        </td>
                        <td className="p-4">
                          {tv.is_active !== false ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                              Active (In Loop)
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 text-[10px] px-2.5 py-1 rounded-full border">
                              Inactive (Hidden)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditTv(tv)}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteTv(tv.id)}
                            className="text-rose-600 hover:text-rose-900 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marketing-banners' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Marketing Suite</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                Promotional Banners
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Design and schedule rich full-width promotional sliders on the homepage. Drag rows to reorder.
              </p>
            </div>
            
            {!showMbForm && (
              <button
                onClick={handleOpenAddMb}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Promotional Banner
              </button>
            )}
          </div>

          {/* Form */}
          {showMbForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-extrabold text-sm text-slate-800">
                  {editingMb ? "Edit Promotional Banner" : "New Promotional Banner"}
                </h4>
                <button
                  onClick={() => {
                    setShowMbForm(false);
                    setEditingMb(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold bg-transparent border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <form onSubmit={handleSaveMb} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Save 30% on Gold ERP Implementations"
                      value={mbForm.title}
                      onChange={(e) => setMbForm({ ...mbForm, title: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Button Text</label>
                      <input
                        type="text"
                        placeholder="Explore Now"
                        value={mbForm.button_text}
                        onChange={(e) => setMbForm({ ...mbForm, button_text: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Redirect URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://bantconfirm.com/deal"
                        value={mbForm.redirect_url}
                        onChange={(e) => setMbForm({ ...mbForm, redirect_url: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={mbForm.start_date}
                        onChange={(e) => setMbForm({ ...mbForm, start_date: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={mbForm.end_date}
                        onChange={(e) => setMbForm({ ...mbForm, end_date: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Order</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={mbForm.display_order}
                        onChange={(e) => setMbForm({ ...mbForm, display_order: parseInt(e.target.value || '1') })}
                        className="w-full border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setMbForm({ ...mbForm, is_active: !mbForm.is_active })}
                          className="text-blue-600 focus:outline-none shrink-0 border-0 bg-transparent p-0 cursor-pointer"
                        >
                          {mbForm.is_active ? (
                            <ToggleRight className="w-8 h-8 text-blue-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-slate-300" />
                          )}
                        </button>
                        <span className="text-xs text-slate-600">
                          {mbForm.is_active ? "Enabled (Visibly Active)" : "Disabled (Hidden)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Banner Image *</label>
                    
                    {/* Drag and drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setMbDragOver(true); }}
                      onDragLeave={() => setMbDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setMbDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleUploadMbImage(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        mbDragOver ? "border-blue-500 bg-blue-50/55" : "border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UploadCloud className={`w-8 h-8 ${mbUploading ? "text-blue-500 animate-bounce" : "text-slate-400"}`} />
                        {mbUploading ? (
                          <p className="text-xs font-bold text-blue-600">Uploading to Supabase Storage...</p>
                        ) : (
                          <>
                            <p className="text-xs text-slate-600 font-semibold">
                              Drag and drop your banner image, or <span className="text-blue-600 hover:underline cursor-pointer">browse file</span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Supported formats: JPG, JPEG, PNG, WEBP. Max 5 MB.
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadMbImage(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="mb-file-input"
                      />
                      <label htmlFor="mb-file-input" className="absolute inset-0 cursor-pointer opacity-0" />
                    </div>

                    {/* Manual input */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">or</span>
                      <input
                        type="text"
                        placeholder="Paste image URL directly (e.g. unsplash.com)"
                        value={mbForm.image_url}
                        onChange={(e) => setMbForm({ ...mbForm, image_url: e.target.value })}
                        className="flex-1 border rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMbForm(false);
                        setEditingMb(null);
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mbUploading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
                    >
                      {editingMb ? "Update Banner" : "Publish Banner"}
                    </button>
                  </div>
                </form>

                {/* Live Real-time Preview */}
                <div className="bg-slate-50 rounded-2xl p-6 border flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">
                      Live Dynamic Preview
                    </span>
                    
                    <div className="relative h-[200px] w-full rounded-xl overflow-hidden bg-gradient-to-r from-blue-950 to-indigo-950 text-white shadow-md border">
                      <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 z-10 bg-gradient-to-r from-blue-950 via-blue-950/85 to-transparent">
                        <span className="mb-1.5 inline-block rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-950 w-fit">
                          EXCLUSIVE DEAL
                        </span>
                        <h4 className="text-lg font-black tracking-tight text-white line-clamp-2">
                          {mbForm.title || "Your Promotional Title Here"}
                        </h4>
                        
                        <div className="mt-4">
                          <button
                            type="button"
                            className="inline-flex items-center space-x-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-blue-950 border-0"
                          >
                            <span>{mbForm.button_text || "Explore Now"}</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden h-full">
                        {mbForm.image_url ? (
                          <img
                            src={mbForm.image_url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-600 text-[10px]">
                            No image uploaded
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-transparent to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-[10px] text-slate-400 italic">
                      Note: Only active banners where today is between the Start Date and End Date are displayed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List Banners with Drag and Drop */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b bg-slate-50/60 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                Active Banners List
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {marketingBanners.length} Total
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 italic">
                💡 Drag and drop rows by holding and moving them to change display order in real-time.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider border-b">
                    <th className="p-4 w-12 text-center">Order</th>
                    <th className="p-4 w-28">Preview</th>
                    <th className="p-4">Title & Link</th>
                    <th className="p-4">Validity Range</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marketingBanners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No promotional banners found. Click "Add Promotional Banner" above to start.
                      </td>
                    </tr>
                  ) : (
                    [...marketingBanners]
                      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                      .map((mb, idx) => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        const start = mb.start_date || "2000-01-01";
                        const end = mb.end_date || "2100-01-01";
                        const isScheduledLive = mb.is_active && todayStr >= start && todayStr <= end;

                        return (
                          <tr
                            key={mb.id}
                            draggable
                            onDragStart={() => handleMbDragStart(idx)}
                            onDragOver={handleMbDragOver}
                            onDrop={() => handleMbDrop(idx)}
                            className="border-b hover:bg-slate-50/60 transition-colors cursor-grab active:cursor-grabbing group"
                          >
                            <td className="p-4 text-center">
                              <span className="bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs px-2.5 py-1 rounded-md font-mono font-bold border transition-colors">
                                {mb.display_order}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="h-14 w-24 rounded-lg overflow-hidden border bg-slate-100">
                                <img
                                  src={mb.image_url}
                                  alt={mb.title}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-800 block">{mb.title}</span>
                                {mb.redirect_url ? (
                                  <a
                                    href={mb.redirect_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#0066FF] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                                  >
                                    Button: "{mb.button_text || "Explore Now"}"
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No click link</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <span className="text-slate-700 font-semibold block">
                                  Start: {mb.start_date || "Anytime"}
                                </span>
                                <span className="text-slate-500 block">
                                  End: {mb.end_date || "Forever"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleMbActive(mb)}
                                  className="text-blue-600 focus:outline-none border-0 bg-transparent p-0 cursor-pointer"
                                  title={mb.is_active ? "Click to Disable" : "Click to Enable"}
                                >
                                  {mb.is_active ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-600" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                                  )}
                                </button>
                                {isScheduledLive ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                                    Live Now
                                  </span>
                                ) : (
                                  <span className="bg-slate-50 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider">
                                    {mb.is_active ? "Scheduled" : "Disabled"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => handleOpenEditMb(mb)}
                                className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline border-0 bg-transparent"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMb(mb.id)}
                                className="text-rose-600 hover:text-rose-900 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline border-0 bg-transparent"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resend-emails' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Email Delivery Engine</span>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mt-1">
                <Mail className="w-6 h-6 text-blue-600 animate-pulse" /> Resend.com Automation Panel
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Monitor live email telemetry, inspect responsive HTML template formats, and trigger manual verification handshakes.
              </p>
            </div>
            <button
              onClick={fetchResendLogs}
              disabled={isLogsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLogsLoading ? "animate-spin" : ""}`} />
              Refresh Logs
            </button>
          </div>

          {/* Quick Info Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Resend API Credential</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  The system reads <code>RESEND_API_KEY</code> from environment secrets. If absent, the engine falls back to high-fidelity console logging.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Sandbox Rules</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Under free Resend accounts, you must verify the destination email in your Resend Dashboard before sending. The app automatically catches sandbox limits.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Responsive Design</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  All transactional formats include pre-compiled CSS, clear typography matching, and mobile fluid responsive breakpoints.
                </p>
              </div>
            </div>
          </div>

          {/* Main Console Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Handshake Tool */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
                  <Send className="w-4 h-4 text-blue-600" /> API Handshake Dispatcher
                </h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Trigger custom email payloads to audit template structure, formatting, and delivery status instantly.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={testEmailInput}
                      onChange={(e) => setTestEmailInput(e.target.value)}
                      placeholder="e.g. buyer@domain.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Template Preset
                    </label>
                    <select
                      value={testEmailType}
                      onChange={(e: any) => setTestEmailType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold bg-white"
                    >
                      <option value="general_handshake">API Verification Handshake Preset</option>
                      <option value="welcome-buyer">Welcome Email (Buyer)</option>
                      <option value="welcome-vendor">Welcome Email (Vendor)</option>
                      <option value="new-enquiry">New Sourcing Enquiry (BANT Alert)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSendTestEmail}
                    disabled={isTestSending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {isTestSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Handshake...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Test Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: History Log */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">
                    Outbound Telemetry History ({resendLogs.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Last 100 dispatches</span>
                </div>

                <div className="overflow-x-auto font-sans">
                  {isLogsLoading ? (
                    <div className="p-12 text-center text-slate-500">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                      <p className="text-sm font-medium">Retrieving latest Resend logs...</p>
                    </div>
                  ) : resendLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">No emails sent yet</h4>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                        Trigger signups or post a requirement from the homepage to generate automated SMTP logs, or use the Handshake tool to send a test email.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="p-4">Recipient</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Timestamp</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resendLogs.map((log: any) => {
                          let badgeStyle = "bg-slate-50 text-slate-600 border-slate-200";
                          let label = "Simulated";
                          
                          if (log.status === "Success") {
                            badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                            label = "Sent via Resend";
                          } else if (log.status?.includes("Sandbox")) {
                            badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                            label = "Sandbox Bypass";
                          } else if (log.status?.includes("Simulation")) {
                            badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-100";
                            label = "Simulated Mode";
                          } else if (log.status === "Failed") {
                            badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                            label = "Failed";
                          }

                          return (
                            <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-semibold text-slate-800 text-xs">
                                {log.recipient}
                              </td>
                              <td className="p-4 text-xs text-slate-600 max-w-[200px] truncate">
                                {log.subject}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {label}
                                </span>
                              </td>
                              <td className="p-4 text-slate-500 text-[11px] font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="p-4 text-right space-x-1">
                                <button
                                  onClick={() => {
                                    setPreviewHtml(log.htmlContent);
                                    setIsPreviewOpen(true);
                                  }}
                                  className="text-slate-600 hover:text-slate-950 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline border-0 bg-transparent"
                                  title="View Formatted Email Layout"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRetryEmail(log)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline border-0 bg-transparent"
                                  title="Resend this email"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* HTML Preview Overlay Modal */}
          {isPreviewOpen && previewHtml && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm">Transactional HTML Layout Preview</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setPreviewHtml(null);
                    }}
                    className="text-slate-400 hover:text-white focus:outline-none cursor-pointer p-1 rounded-lg border-0 bg-transparent text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 bg-slate-100 p-4 relative overflow-hidden">
                  <iframe
                    title="Email Template Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full bg-white border border-slate-200 rounded-xl"
                    style={{ border: 'none' }}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium">Pre-rendered with Responsive Inline Styles</span>
                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      setPreviewHtml(null);
                    }}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
