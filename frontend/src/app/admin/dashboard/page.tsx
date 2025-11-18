"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/admin/StatCard";
import ProductionSummary from "@/components/admin/ProductionSummary";
import VerificationTable from "@/components/admin/VerificationTable";
import NotesModal from "@/components/admin/NotesModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useCurrentDate } from "@/hooks/UseCurrentDate";
import { fetchAdminOrders, fetchOrderSummary } from "@/lib/api";
import { Order, getMenuName } from "@/lib/types";
import { formatDateLongID } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const currentDate = useCurrentDate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stat, setStat] = useState({
    totalOrdersToday: 0,
    totalRevenue: 0,
    totalUnpaid: 0,
  });
  type MealItem = { name: string; portions: number; notes: string[]; stock?: number };
  type MealGroup = { mealTime: string; totalPortions: number; items: MealItem[]; orderIds?: string[] };
  const [todayMeal, setTodayMeal] = useState<MealGroup[]>([]);
  const [tomorrowMeal, setTomorrowMeal] = useState<MealGroup[]>([]);
  const [notesModal, setNotesModal] = useState<{
    title: string;
    notes: string[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (authLoading || !user) return () => { isMounted = false; };
    setLoadingOrders(true);
    const todayISO = new Date().toISOString().split("T")[0];
    // Fetch all recent orders and filter by orderDates client-side
    fetchAdminOrders({ limit: 200 })
      .then((res) => {
        if (!isMounted) return;
        // Filter orders that have today's date in their orderDates array
        const todayOrders = (res.items || []).filter((order: Order) => {
          return order.orderDates && order.orderDates.some(date => {
            const orderDate = date.split('T')[0];
            return orderDate === todayISO;
          });
        });
        setOrders(todayOrders);
      })
      .catch((err) => {
        console.warn("Gagal memuat pesanan dashboard:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    const todayISO = new Date().toISOString().split("T")[0];
    const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    fetchOrderSummary(todayISO)
      .then((res) => {
        if (!res) return;
        // Update stats from summary
        if (res.summary) {
          setStat({
            totalOrdersToday: res.summary.totalOrders ?? 0,
            totalRevenue: res.summary.totalRevenue ?? 0,
            totalUnpaid: 0, // Calculate from orders if needed
          });
        }
        // Process orders to create meal time summary
        if (res.orders && Array.isArray(res.orders) && res.orders.length) {
          const mealTimeMap = new Map<string, { 
            menuMap: Map<string, { portions: number; notes: string[] }>,
            orderIds: string[]
          }>();
          
          res.orders.forEach((order: any) => {
            const mealTime = order.deliveryTime || 'Unknown';
            if (!mealTimeMap.has(mealTime)) {
              mealTimeMap.set(mealTime, { menuMap: new Map(), orderIds: [] });
            }
            const mealData = mealTimeMap.get(mealTime)!;
            mealData.orderIds.push(order._id);
            
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const menuName = getMenuName(item.menuId);
                
                if (!mealData.menuMap.has(menuName)) {
                  mealData.menuMap.set(menuName, { portions: 0, notes: [] });
                }
                
                const menuData = mealData.menuMap.get(menuName)!;
                menuData.portions += item.quantity || 0;
                
                if (item.specialNotes && item.specialNotes.trim()) {
                  menuData.notes.push(item.specialNotes.trim());
                }
              });
            }
          });
          
          const mealGroups = Array.from(mealTimeMap.entries()).map(([mealTime, mealData]) => {
            const items = Array.from(mealData.menuMap.entries()).map(([name, data]) => ({
              name,
              portions: data.portions,
              notes: data.notes,
            }));
            const totalPortions = items.reduce((sum, item) => sum + item.portions, 0);
            return { mealTime, totalPortions, items, orderIds: mealData.orderIds };
          });
          
          setTodayMeal(mealGroups);
        }
      })
      .catch(() => {
        /* fallback dummy */
      });

    fetchOrderSummary(tomorrowISO)
      .then((res) => {
        if (!res || !res.orders || !Array.isArray(res.orders)) return;
        if (res.orders.length) {
          const mealTimeMap = new Map<string, Map<string, { portions: number; notes: string[] }>>();
          
          res.orders.forEach((order: any) => {
            const mealTime = order.deliveryTime || 'Unknown';
            if (!mealTimeMap.has(mealTime)) {
              mealTimeMap.set(mealTime, new Map());
            }
            const menuMap = mealTimeMap.get(mealTime)!;
            
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const menuName = getMenuName(item.menuId);
                
                if (!menuMap.has(menuName)) {
                  menuMap.set(menuName, { portions: 0, notes: [] });
                }
                
                const menuData = menuMap.get(menuName)!;
                menuData.portions += item.quantity || 0;
                
                if (item.specialNotes && item.specialNotes.trim()) {
                  menuData.notes.push(item.specialNotes.trim());
                }
              });
            }
          });
          
          const mealGroups = Array.from(mealTimeMap.entries()).map(([mealTime, menuMap]) => {
            const items = Array.from(menuMap.entries()).map(([name, data]) => ({
              name,
              portions: data.portions,
              notes: data.notes,
            }));
            const totalPortions = items.reduce((sum, item) => sum + item.portions, 0);
            return { mealTime, totalPortions, items };
          });
          
          setTomorrowMeal(mealGroups);
        }
      })
      .catch(() => {
        /* fallback dummy */
      });
  }, [authLoading, user, refreshTrigger]);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard Utama"
        rightContent={
          <p className="text-base md:text-lg text-gray-600">
            Hari Ini:{" "}
            <span className="font-semibold text-gray-800">{currentDate}</span>
          </p>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Pesanan Hari Ini"
          value={`${stat.totalOrdersToday} Pesanan`}
          borderColor="border-primary"
        />
        <StatCard
          title="Pendapatan Hari Ini"
          value={`Rp ${stat.totalRevenue.toLocaleString("id-ID")}`}
          borderColor="border-green-500"
        />
        <StatCard
          title="Belum Lunas (Cash)"
          value={`Rp ${stat.totalUnpaid.toLocaleString("id-ID")}`}
          borderColor="border-yellow-400"
        />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Ringkasan Pesanan Hari Ini ({formatDateLongID(new Date())})
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <ProductionSummary
            mealData={todayMeal}
            onOpenNotes={(label, notes) => setNotesModal({ title: label, notes })}
            onStatusUpdated={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Ringkasan Pesanan Besok ({formatDateLongID(new Date(Date.now() + 24 * 60 * 60 * 1000))})
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-600">
                <th className="py-3 px-4">Menu</th>
                <th className="py-3 px-4 text-center">Porsi</th>
                <th className="py-3 px-4 text-right">Catatan</th>
                <th className="py-3 px-4 text-center">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {tomorrowMeal.flatMap((meal) => meal.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-center font-semibold text-green-700">
                    {item.portions} Porsi
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.notes && item.notes.length > 0 ? (
                      <button
                        onClick={() =>
                          setNotesModal({
                            title: `Besok - ${item.name}`,
                            notes: Array.isArray(item.notes)
                              ? item.notes
                              : [item.notes],
                          })
                        }
                        className="inline-flex items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-xs font-semibold"
                      >
                        Lihat {Array.isArray(item.notes) ? item.notes.length : 1} Catatan
                      </button>
                    ) : (
                      <span className="text-gray-400">Tanpa Catatan</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {item.stock ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Aksi Cepat: Verifikasi Pesanan (Hari Ini)
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          {loadingOrders ? (
            <p className="text-gray-500">Memuat pesanan...</p>
          ) : (
            <VerificationTable orders={orders} />
          )}
        </div>
      </div>

      {notesModal && (
        <NotesModal
          title={notesModal.title}
          notes={notesModal.notes}
          onClose={() => setNotesModal(null)}
        />
      )}
    </div>
  );
}
