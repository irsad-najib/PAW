// Fungsi helper untuk format mata uang
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Fungsi helper untuk mendapatkan tanggal (misal: 7 hari ke depan)
export const getWeekDates = (offset = 0) => {
  const dates = [];
  const today = new Date();
  // Pindah ke minggu target
  today.setDate(today.getDate() + (offset * 7));
  // Mundur ke hari Senin
  const dayOfWeek = today.getDay(); // 0 = Minggu, 1 = Senin
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // jika Minggu, mundur 6 hari
  const monday = new Date(today.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export function formatDateID(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateLongID(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const monthName = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthName} ${year}`;
}
