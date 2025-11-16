'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function OrderFilters() {
  // State untuk filter bisa ditambahkan di sini
  // const [searchTerm, setSearchTerm] = useState('');
  // const [filterDate, setFilterDate] = useState('');
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      {/* Search Bar */}
      <div className="relative w-full md:w-1/2 lg:w-1/3">
        <input
          type="text"
          placeholder="Cari ID, nama pelanggan..."
          className="w-full p-3 pl-10 border rounded-lg text-gray-900 placeholder:text-gray-400"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Filter Dropdowns - Dibuat stack di mobile */}
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <input 
          type="date"
          className="p-3 border rounded-lg w-full sm:w-auto text-gray-900"
        />
        <select className="p-3 border rounded-lg w-full sm:w-auto text-gray-900">
          <option value="">Semua Status</option>
          {/* --- PERBAIKAN --- */}
          {/* Nilai value="" disesuaikan dengan Mongoose/types.ts */}
          {/* Typo </Canceled> diperbaiki menjadi </option> */}
          <option value="accepted">Order Masuk</option>
          <option value="processing">Diproses</option>
          <option value="ready">Siap Diambil/Kirim</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
          {/* --- AKHIR PERBAIKAN --- */}
        </select>
      </div>
    </div>
  );
}