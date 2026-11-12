export interface AuthUser {
  id: string;
  maskedPhone: string;
  maskedEmail: string | null;
  fullName: string | null;
  isPhoneVerified: boolean;
}

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_API_URL. Please set it in frontend/.env.local."
    );
  }
  return url;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; data: T }> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = (await response.json()) as T;
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

