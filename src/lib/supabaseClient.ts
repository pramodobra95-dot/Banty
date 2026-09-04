import { createClient } from "@supabase/supabase-js";

// Check if environment variables are configured
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Use a safe placeholder URL/Key to prevent initialization crash when not configured yet
const finalUrl = supabaseUrl || "https://placeholder-project.supabase.co";
const finalKey = supabaseAnonKey || "placeholder-anon-key";

// Keep the last known-good public data available during transient Supabase/RLS/network failures.
// App.tsx already maintains these cache_* keys after successful loads; this wrapper prevents
// a refresh from replacing valid cached data with an empty/error response.
const CACHE_KEY_BY_TABLE: Record<string, string> = {
  categories: "cache_categories",
  products: "cache_products",
  vendors: "cache_vendors",
  trusted_vendors: "cache_trusted_vendors",
  marketing_banners: "cache_marketing_banners",
  blogs: "cache_blogs",
  testimonials: "cache_testimonials",
  reviews: "cache_reviews"
};

const cachedSupabaseFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const tableMatch = url.pathname.match(/\/rest\/v1\/([^/]+)$/);
  const table = tableMatch?.[1];
  const cacheKey = table ? CACHE_KEY_BY_TABLE[decodeURIComponent(table)] : undefined;

  // Never interfere with writes, auth, storage, or non-table endpoints.
  if (request.method !== "GET" || !cacheKey || typeof window === "undefined") {
    return fetch(input, init);
  }

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    const raw = window.localStorage.getItem(cacheKey);
    if (raw) {
      return new Response(raw, {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Banty-Cache-Fallback": "network-error" }
      });
    }
    throw error;
  }

  const cachedRaw = window.localStorage.getItem(cacheKey);
  if (!cachedRaw) return response;

  // Preserve cached data on failed REST calls.
  if (!response.ok) {
    return new Response(cachedRaw, {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Banty-Cache-Fallback": "http-error" }
    });
  }

  // RLS or transient backend problems can surface as a successful empty array.
  // Do not discard a known-good non-empty cache in that case.
  try {
    const payload = await response.clone().json();
    const cachedPayload = JSON.parse(cachedRaw);
    if (Array.isArray(payload) && payload.length === 0 && Array.isArray(cachedPayload) && cachedPayload.length > 0) {
      return new Response(cachedRaw, {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Banty-Cache-Fallback": "empty-response" }
      });
    }
  } catch {
    // Let Supabase handle non-JSON responses normally.
  }

  return response;
};

export const supabase = createClient(finalUrl, finalKey, {
  global: {
    fetch: cachedSupabaseFetch
  }
});

/**
 * Utility functions for syncing/performing actions.
 * If Supabase is configured, we can do direct calls, otherwise we can log a warning or route to standard REST API fallbacks.
 */
