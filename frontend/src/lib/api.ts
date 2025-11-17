const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3003";

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

async function apiRequest<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  // @ts-ignore
  return null;
}

// Orders
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
  return apiRequest<{ page: number; limit: number; total: number; items: any[] }>(
    `/api/orders/admin${qs ? `?${qs}` : ""}`
  );
}

export function updateOrderStatus(id: string, orderStatus: string) {
  return apiRequest(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: { orderStatus },
  });
}

export function markOrderPaid(id: string) {
  return apiRequest(`/api/orders/${id}/payment`, {
    method: "PATCH",
    body: { action: "markPaid" },
  });
}

export function markGroupPaid(groupId: string) {
  return apiRequest(`/api/orders/group/${groupId}/payment`, {
    method: "PATCH",
    body: { action: "markPaid" },
  });
}

export function fetchOrderSummary(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest<{
    date?: string;
    totalOrders: number;
    revenuePaid: number;
    totalUnpaidCash: number;
    byMealTime: {
      mealTime: string;
      totalPortions: number;
      items: { name: string; portions: number; notes: string[] }[];
    }[];
  }>(`/api/orders/admin/summary${qs}`);
}

// Menu
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
  }>(`/api/menu${qs ? `?${qs}` : ""}`);
}

export async function createMenu(payload: AdminMenuPayload) {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  if (payload.description) form.append("description", payload.description);
  if (payload.stock != null) form.append("stock", String(payload.stock));
  if (payload.date) form.append("date", payload.date);
  if (payload.isAvailable != null) form.append("isAvailable", String(payload.isAvailable));
  if (payload.image instanceof File) {
    form.append("image", payload.image);
  }

  const token = getToken();
  const res = await fetch(`${API_BASE}/api/menu`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMenu(id: string, payload: AdminMenuPayload) {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("price", String(payload.price));
  if (payload.description) form.append("description", payload.description);
  if (payload.stock != null) form.append("stock", String(payload.stock));
  if (payload.date) form.append("date", payload.date);
  if (payload.isAvailable != null) form.append("isAvailable", String(payload.isAvailable));
  if (payload.image instanceof File) {
    form.append("image", payload.image);
  } else if (typeof payload.image === "string") {
    form.append("image", payload.image);
  }

  const token = getToken();
  const res = await fetch(`${API_BASE}/api/menu/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function deleteMenu(id: string) {
  return apiRequest(`/api/menu/${id}`, { method: "DELETE" });
}
