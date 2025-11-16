"use client";

import { useEffect, useMemo, useState } from "react";
import MenuDetail, { menuData } from "@/components/admin/MenuDetail";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useCurrentDate } from "@/hooks/UseCurrentDate";

const getWeekDates = (offset: number): Date[] => {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);

  const currentDay = now.getDay();
  const daysToMonday = (currentDay - 1 + 7) % 7;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatISO = (d: Date) => d.toISOString().split("T")[0];
const formatDayID = (d: Date) => d.toLocaleDateString("id-ID", { weekday: "long" });
const formatDateShort = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const formatDateWithYear = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function MenuPage() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedMenuDate, setSelectedMenuDate] = useState(formatISO(new Date()));
  const currentDate = useCurrentDate();

  const weekData = useMemo(() => {
    const week = getWeekDates(currentWeekOffset);
    const weekStart = formatDateWithYear(week[0]);
    const weekEnd = formatDateWithYear(week[6]);

    const days = week.map((date) => {
      const iso = formatISO(date);
      const menus = menuData[iso] || [];
      return {
        name: formatDayID(date),
        date: iso,
        dateShort: formatDateShort(date),
        menuCount: menus.length,
      };
    });

    return { days, weekStart, weekEnd };
  }, [currentWeekOffset]);

  useEffect(() => {
    const exists = weekData.days.some((d) => d.date === selectedMenuDate);
    if (!exists && weekData.days.length > 0) {
      setSelectedMenuDate(weekData.days[0].date);
    }
  }, [weekData.days, selectedMenuDate]);

  const handleWeekChange = (offset: number) => {
    const nextOffset = currentWeekOffset + offset;
    setCurrentWeekOffset(nextOffset);
    const newWeek = getWeekDates(nextOffset);
    setSelectedMenuDate(formatISO(newWeek[0]));
  };

  return (
    <div>
      <AdminPageHeader
        title="Manajemen Menu"
        rightContent={
          <p className="text-base md:text-lg text-gray-600">
            Hari Ini:{" "}
            <span className="font-semibold text-gray-800">{currentDate}</span>
          </p>
        }
      />

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <button
            onClick={() => handleWeekChange(-1)}
            className="w-full md:w-auto bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-semibold hover:bg-gray-300"
          >
            &lt; Minggu Lalu
          </button>

          <h2 className="text-xl font-bold text-gray-900 text-center order-first md:order-none">
            Input Menu Mingguan
            <span className="block text-lg text-gray-800">
              {weekData.weekStart} - {weekData.weekEnd}
            </span>
          </h2>

          <button
            onClick={() => handleWeekChange(1)}
            className="w-full md:w-auto bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-semibold hover:bg-gray-300"
          >
            Minggu Depan &gt;
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Pilih hari untuk mengatur menu, harga, dan stok. Jika tidak ada menu,
          maka hari tersebut dianggap <span className="italic">libur</span> di halaman pelanggan.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weekData.days.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedMenuDate(day.date)}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                day.menuCount > 0
                  ? "border-primary bg-green-50 hover:bg-green-100 hover:border-green-600"
                  : "bg-gray-100 hover:bg-gray-200 border-transparent"
              } ${day.date === selectedMenuDate ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              <span className="font-bold text-lg text-gray-900">{day.name}</span>
              <span className="block text-sm text-gray-700">{day.dateShort}</span>
              <span
                className={`block text-xs mt-2 font-semibold ${
                  day.menuCount > 0 ? "text-green-700" : "text-gray-600"
                }`}
              >
                {day.menuCount > 0 ? `${day.menuCount} Menu` : "Kosong"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <MenuDetail selectedDate={selectedMenuDate} />
    </div>
  );
}
