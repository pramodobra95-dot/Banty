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

const CACHE_TTL_MS = 5 * 60 * 1000;
const BOT_UA = /(Googlebot|Google-InspectionTool|bingbot|BingPreview|LinkedInBot|facebookexternalhit|Twitterbot|Slackbot|Discordbot|WhatsApp)/i;

const getCacheTimestampKey = (cacheKey: string) => `${cacheKey}_fetched_at`;

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

  // Search/social crawlers should never execute expensive public Supabase reads.
  // The site's prerendered/static HTML and sitemap remain crawlable; this only stops
  // client-side hydration from generating unnecessary REST traffic for bots.
  if (BOT_UA.test(navigator.userAgent || "")) {
    return new Response("[]", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        "X-Banty-Bot-Guard": "1"
      }
    });
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
