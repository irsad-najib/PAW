/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://paw-be-weld.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
  );
}

async function apiRequest<T>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log(`🌐 API Request: ${opts.method || "GET"} ${API_BASE}${path}`);

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  console.log(`📡 Response Status: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API Error [${res.status}]:`, errorText);

    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorText || res.statusText);
    } catch {
      throw new Error(errorText || res.statusText);
    }
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  // @ts-expect-error
  return null;
}

export type AdminOrderQuery = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  deliveryTime?: string;
  deliveryType?: string;
  date?: string;
  page?: number;
  limit?: number;
};

export async function fetchAdminOrders(params: AdminOrderQuery = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val != null && val !== "") searchParams.set(key, String(val));
  });
  const qs = searchParams.toString();
  return apiRequest<{
    page: number;
    limit: number;
    total: number;
    items: any[];
  }>(`/orders/admin${qs ? `?${qs}` : ""}`);
}

export function updateOrderStatus(id: string, orderStatus: string) {
  return apiRequest(`/orders/${id}/status`, {
    method: "PATCH",
    body: { orderStatus },
  });
}

export function markOrderPaid(id: string) {
  return apiRequest(`/orders/${id}/payment`, {
    method: "PATCH",
    body: { action: "markPaid" },
  });
}

export function markGroupPaid(groupId: string) {
  return apiRequest(`/orders/group/${groupId}/payment`, {
    method: "PATCH",
    body: { action: "markPaid" },
  });
}

export function batchUpdateOrderStatus(
  orderIds: string[],
  orderStatus: string
) {
  return apiRequest(`/orders/batch/status`, {
    method: "PATCH",
    body: { orderIds, orderStatus },
  });
}

export function fetchOrderSummary(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest<{
    date: string;
    summary: {
      totalOrders: number;
      totalRevenue: number;
      byStatus: Record<string, number>;
      byPaymentStatus: Record<string, number>;
      byDeliveryTime: Record<string, number>;
    };
    orders: any[];
  }>(`/orders/admin/summary${qs}`);
}

// ============================================================
// MENU API
// ============================================================

export type AdminMenuPayload = {
  _id?: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  date?: string;
  isAvailable?: boolean;
  image?: File | string | null;
};

export async function fetchMenuByDate(date?: string) {
  const searchParams = new URLSearchParams();
  if (date) searchParams.set("date", date);
  searchParams.set("all", "true");
  const qs = searchParams.toString();
  return apiRequest<{
    page: number;
    limit: number;
    total: number;
    items: any[];
  }>(`/menu${qs ? `?${qs}` : ""}`);
}

export async function createMenu(payload: AdminMenuPayload) {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  if (payload.description) form.append("description", payload.description);
  if (payload.stock != null) form.append("stock", String(payload.stock));
  if (payload.date) form.append("date", payload.date);
  if (payload.isAvailable != null)
    form.append("isAvailable", String(payload.isAvailable));
  if (payload.image instanceof File) {
    form.append("image", payload.image);
  }

  const token = getToken();
  const res = await fetch(`${API_BASE}/menu`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Create menu error:", errorText);
    throw new Error(errorText);
  }
  return res.json();
}

export async function updateMenu(id: string, payload: AdminMenuPayload) {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  if (payload.description) form.append("description", payload.description);
  if (payload.stock != null) form.append("stock", String(payload.stock));
  if (payload.date) form.append("date", payload.date);
  if (payload.isAvailable != null)
    form.append("isAvailable", String(payload.isAvailable));
  if (payload.image instanceof File) {
    form.append("image", payload.image);
  } else if (typeof payload.image === "string") {
    form.append("image", payload.image);
  }

  const token = getToken();
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Update menu error:", errorText);
    throw new Error(errorText);
  }
  return res.json();
}

export function deleteMenu(id: string) {
  return apiRequest(`/menu/${id}`, { method: "DELETE" });
}

// ============================================================
// USER/AUTH API (jika diperlukan)
// ============================================================

export async function fetchUserProfile() {
  return apiRequest<any>(`/users/profile`);
}

export async function loginUser(credentials: {
  username: string;
  password: string;
}) {
  return apiRequest<{ token: string; user: any }>(`/auth/login`, {
    method: "POST",
    body: credentials,
  });
}

export async function registerUser(data: {
  username: string;
  password: string;
  name?: string;
  phone?: string;
}) {
  return apiRequest<{ token: string; user: any }>(`/auth/register`, {
    method: "POST",
    body: data,
  });
}
