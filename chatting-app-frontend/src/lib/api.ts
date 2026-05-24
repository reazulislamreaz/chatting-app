function getApiBaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_API_URL || "/api").trim();
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url}`;
    }
    return url;
  }
  return url.replace(/\/$/, "");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export function getUploadUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base =
    process.env.NEXT_PUBLIC_UPLOADS_URL || "https://reaz8080.syedbipul.me";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    headers: customHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  const headers: HeadersInit = {
    ...(rest.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...customHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    const detail =
      err instanceof Error && err.name === "AbortError"
        ? "Request timed out"
        : err instanceof Error
          ? err.message
          : "Network error";
    throw new Error(
      process.env.NODE_ENV === "development"
        ? `Cannot reach API: ${detail}`
        : "Cannot reach the API server. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: { message?: string; success?: boolean };
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "Invalid response from server"
        : `Server error (${response.status}). Please try again later.`,
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}
