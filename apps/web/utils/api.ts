const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export type CurrentUser = { id: string; email: string };
export async function api<T>(path: string, options: RequestInit = {}) { const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } }); const data = await response.json().catch(() => ({})) as T & { error?: string }; if (!response.ok) throw new Error(data.error ?? "Request failed."); return data; }
export { apiUrl };
