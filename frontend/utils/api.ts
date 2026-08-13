// Remove any trailing slashes to prevent "//" in URLs
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_URL = rawApiUrl.replace(/\/+$/, "");

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("isiri_token") : null;

  const headers = new Headers();
  
  // Transfer existing headers if any
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If the body is FormData (for file uploads), let the browser set the boundary header
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const text = await response.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (response.status === 413) {
      data = { error: "File size too large. Please upload smaller images or contact support." };
    } else if (text && text.trim().startsWith("<")) {
      data = { error: `Server error (${response.status}). Please try again later.` };
    } else {
      data = { error: text || "Invalid JSON response from server" };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || "An API error occurred");
  }

  return data;
}

const BACKEND_URL = API_URL.replace(/\/api$/, "");

export function getImageUrl(path: string): string {
  if (!path) return "/prop-1.png";
  if (path.startsWith("/uploads/")) {
    return `${BACKEND_URL}${path}`;
  }
  return path;
}
