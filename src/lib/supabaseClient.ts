import { createClient } from "@supabase/supabase-js";

// Check if environment variables are configured
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Use a safe placeholder URL/Key to prevent initialization crash when not configured yet
const finalUrl = supabaseUrl || "https://placeholder-project.supabase.co";
const finalKey = supabaseAnonKey || "placeholder-anon-key";

// Public/read-only tables that are safe to cache in the browser.
// User-specific tables such as leads, notifications and profiles are deliberately excluded.
const CACHE_KEY_BY_TABLE: Record<string, string> = {
  categories: "cache_categories",
  products: "cache_products",
  vendors: "cache_vendors",
  trusted_vendors: "cache_trusted_vendors",
  marketing_banners: "cache_marketing_banners",
  blogs: "cache_blogs",
  testimonials: "cache_testimonials",
  banners: "cache_banners",
  settings: "cache_settings"
};

// These tables must never be fetched by automated crawlers. They are intentionally
// not part of the browser cache because they can contain user/business data.
const BOT_BLOCKED_TABLES = new Set([
  "categories",
  "products",
  "vendors",
  "trusted_vendors",
  "marketing_banners",
  "blogs",
  "testimonials",
  "banners",
  "settings",
  "leads",
  "notifications",
  "profiles"
]);

const CACHE_TTL_MS = 5 * 60 * 1000;
// Include common search/social crawlers plus headless browser agents used by
// automated rendering/indexing systems. Normal Chrome/Android users are unaffected.
const BOT_UA = /(Googlebot|Google-InspectionTool|GoogleOther|bingbot|BingPreview|LinkedInBot|facebookexternalhit|Twitterbot|Slackbot|Discordbot|WhatsApp|HeadlessChrome)/i;

const getCacheTimestampKey = (cacheKey: string) => `${cacheKey}_fetched_at`;

const cachedSupabaseFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const tableMatch = url.pathname.match(/\/rest\/v1\/([^/]+)$/);
  const table = tableMatch?.[1] ? decodeURIComponent(tableMatch[1]) : undefined;
  const cacheKey = table ? CACHE_KEY_BY_TABLE[table] : undefined;
  const isBot = typeof window !== "undefined" && BOT_UA.test(navigator.userAgent || "");

  // Never interfere with writes, auth, storage, or non-table endpoints.
  if (request.method !== "GET" || typeof window === "undefined") {
    return fetch(input, init);
  }

  // Search/social crawlers and headless renderers should not execute expensive
  // Supabase REST reads. Return an empty successful payload locally instead.
  // This also protects private tables (leads/notifications/profiles) without caching them.
  if (isBot && table && BOT_BLOCKED_TABLES.has(table)) {
    return new Response("[]", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Banty-Bot-Guard": "1"
      }
    });
  }

  // Search/social crawlers should not execute expensive public Supabase reads.
  if (isBot && cacheKey) {
    return new Response("[]", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        "X-Banty-Bot-Guard": "1"
      }
    });
  }

  // Only public/read-only tables participate in the cache.
  if (!cacheKey) {
    return fetch(input, init);
  }

  const cachedRaw = window.localStorage.getItem(cacheKey);
  const fetchedAtRaw = window.localStorage.getItem(getCacheTimestampKey(cacheKey));
  const fetchedAt = fetchedAtRaw ? Number(fetchedAtRaw) : 0;

  // Serve a recent successful public response locally and avoid another Supabase egress request.
  // This is intentionally limited to unfiltered public table URLs; filtered requests still go upstream.
  const isUnfilteredTableRead = !url.searchParams.has("id") && !url.searchParams.has("slug") && !url.searchParams.has("eq") && !url.searchParams.has("or");
  if (cachedRaw && isUnfilteredTableRead && fetchedAt > 0 && Date.now() - fetchedAt < CACHE_TTL_MS) {
    return new Response(cachedRaw, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Banty-Cache": "hit"
      }
    });
  }

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (cachedRaw) {
      return new Response(cachedRaw, {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Banty-Cache-Fallback": "network-error" }
      });
    }
    throw error;
  }

  if (!response.ok) {
    if (cachedRaw) {
      return new Response(cachedRaw, {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Banty-Cache-Fallback": "http-error" }
      });
    }
    return response;
  }

  // Store only successful unfiltered public responses. Keep the existing cache contract used by App.tsx.
  if (isUnfilteredTableRead) {
    try {
      const payload = await response.clone().json();
      if (Array.isArray(payload) && payload.length > 0) {
        window.localStorage.setItem(cacheKey, JSON.stringify(payload));
        window.localStorage.setItem(getCacheTimestampKey(cacheKey), String(Date.now()));
      }
    } catch {
      // Let Supabase handle non-JSON responses normally.
    }
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
