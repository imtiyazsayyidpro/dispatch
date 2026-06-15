const TOKEN_KEY = "dispatch_token";

/** Backend envelope — every response is `{ status, message, data }`. */
interface ApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    /** The error envelope's `data` payload, when the server sent one. */
    public readonly data: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 0);
  }

  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the server. Is it running?", 0);
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON body falls through to the generic error below
  }

  if (!response.ok || !envelope?.status) {
    throw new ApiError(
      envelope?.message ?? `Request failed (${response.status})`,
      response.status,
      envelope?.data ?? null
    );
  }

  return envelope.data;
}

export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export function del<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("DELETE", path, body);
}
