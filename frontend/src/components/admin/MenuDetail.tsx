/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu } from "@/lib/types";
import { createMenu, deleteMenu, fetchMenuByDate, updateMenu } from "@/lib/api";
import { formatDateLongID } from "@/lib/utils";

type MenuItem = Menu & { imageUrl?: string };

interface MenuDetailProps {
  selectedDate: string;
  onDataChanged?: () => void;
}

export default function MenuDetail({ selectedDate, onDataChanged }: MenuDetailProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [catalog, setCatalog] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [showDelete, setShowDelete] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItem>({
    _id: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    date: selectedDate,
    isAvailable: true,
    createdAt: "",
    updatedAt: "",
  });
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [searchTemplate, setSearchTemplate] = useState("");

  const readableDate = formatDateLongID(selectedDate + "T00:00:00");

  const refreshMenus = () => {
    setLoading(true);
    setError(null);
    fetchMenuByDate(selectedDate)
      .then((res) => {
        setMenus((res.items || []) as MenuItem[]);
      })
      .catch((err) => {
        console.warn("Gagal memuat menu:", err.message);
        setError("Gagal memuat menu untuk tanggal ini.");
        setMenus([]);
      })
      .finally(() => setLoading(false));
  };

  // Load catalog (semua menu available) sekali
  useEffect(() => {
    fetchMenuByDate(undefined)
      .then((res) => setCatalog((res.items || []) as MenuItem[]))
      .catch((err) => console.warn("Gagal memuat katalog menu:", err.message));
  }, []);

  useEffect(() => {
    refreshMenus();
    setEditingMenu(null);
    setShowForm(false);
    setShowDelete(null);
  }, [selectedDate]);

  const resetForm = () =>
    setFormData({
      _id: "",
      name: "",
      description: "",
      price: 0,
      stock: 0,
      date: selectedDate,
      isAvailable: true,
      createdAt: "",
      updatedAt: "",
    } as MenuItem);

  const handleCopyTemplate = (id: string) => {
    const template = catalog.find((m) => m._id === id);
    if (!template) return;
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
    }));
    if (template.image) setFormImagePreview(template.image);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingMenu(null);
    setShowForm(true);
    setFormImageFile(null);
    setFormImagePreview("");
  };

  const handleOpenEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData(menu);
    setShowForm(true);
    setFormImageFile(null);
    setFormImagePreview(menu.imageUrl || (menu as any).image || "");
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;
    const duplicate =
      !editingMenu &&
      menus.some(
        (m) =>
          m.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );
    if (duplicate) {
      setError("Nama menu sudah ada untuk tanggal ini.");
      return;
    }

    const imageUrlToUse = formImagePreview || (formData as any).image || "";
    const payload = {
      name: formData.name,
      price: Number(formData.price) || 0,
      description: formData.description,
      stock: Number(formData.stock) || 0,
      date: selectedDate,
      isAvailable: true,
      image: formImageFile ? formImageFile : imageUrlToUse || null,
    };

    try {
      if (editingMenu?._id) {
        await updateMenu(editingMenu._id, payload);
      } else {
        await createMenu(payload);
      }
      refreshMenus();
      onDataChanged?.();
      setError(null);
    } catch (e: any) {
      console.warn("Simpan menu gagal:", e.message);
      setError("Gagal menyimpan menu, coba lagi.");
    }

    setShowForm(false);
    setEditingMenu(null);
    resetForm();
    setFormImageFile(null);
    setFormImagePreview("");
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      if (showDelete._id) {
        await deleteMenu(showDelete._id);
      }
      refreshMenus();
      onDataChanged?.();
    } catch (e: any) {
      console.warn("Hapus menu gagal:", e.message);
      setError("Gagal menghapus menu, coba lagi.");
    }
    setShowDelete(null);
  };

  const uniqueCatalog = useMemo(() => {
    const seen = new Set<string>();
    return catalog.filter((m) => {
      const key = m.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [catalog]);

  const filteredTemplates = useMemo(() => {
    const q = searchTemplate.trim().toLowerCase();
    if (!q) return uniqueCatalog;
    return uniqueCatalog.filter((m) => m.name.toLowerCase().includes(q));
  }, [uniqueCatalog, searchTemplate]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <p className="text-xs uppercase text-gray-500 tracking-wide text-primary font-semibold">
            Atur Menu
          </p>
          <h3 className="text-xl font-bold text-gray-800">
            Tanggal {readableDate}
          </h3>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          onClick={handleOpenAdd}>
          <span className="text-lg">＋</span>
          <span>Tambah Menu</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Memuat menu...</p>
      ) : menus.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nama Menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menus.map((menu) => (
                <tr key={menu._id || menu.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {menu.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    {menu.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    Rp {menu.price.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    {menu.stock} Porsi
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold">
                    <button
                      onClick={() => handleOpenEdit(menu)}
                      className="text-blue-600 hover:text-blue-800 font-semibold">
                      Edit
                    </button>

                    <button
                      onClick={() => setShowDelete(menu)}
                      className="text-red-600 hover:text-red-800 font-semibold ml-4">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">
          Tidak ada menu yang diinput untuk tanggal ini.
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                  {editingMenu ? "Edit Menu" : "Tambah Menu"}
                </p>
                <h4 className="text-xl font-extrabold text-gray-900">
                  {editingMenu ? "Perbarui Menu" : "Menu Baru"}
                </h4>
                <p className="text-sm text-gray-600">
                  {editingMenu
                    ? "Perbaharui data menu untuk tanggal ini."
                    : "Isi detail menu untuk tanggal ini atau gunakan menu yang sudah ada."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMenu(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {!editingMenu && (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Gunakan Menu yang Sudah Ada
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      placeholder="Cari nama menu..."
                      className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder:text-gray-400"
                      value={searchTemplate}
                      onChange={(e) => setSearchTemplate(e.target.value)}
                    />
                    <select
                      className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                      value=""
                      onChange={(e) => handleCopyTemplate(e.target.value)}>
                      <option value="">Pilih menu untuk disalin...</option>
                      {filteredTemplates.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nama sama di tanggal ini akan ditolak untuk menghindari
                    duplikasi. Data yang disalin: nama, deskripsi, dan gambar.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder:text-gray-400"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price:
                          Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Stok Porsi
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock:
                          Number(e.target.value.replace(/[^0-9]/g, "")) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 placeholder:text-gray-400"
                    rows={2}
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Ayam bakar bumbu kecap, lalapan, sambal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Upload Foto Menu
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-lg text-gray-700 hover:border-primary hover:text-primary transition">
                    <span className="text-lg">⬆</span>
                    <span className="font-semibold text-sm">
                      {formImageFile ? formImageFile.name : "Pilih file"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setFormImageFile(file || null);
                        if (file) {
                          setFormImagePreview(URL.createObjectURL(file));
                        } else {
                          setFormImagePreview("");
                        }
                      }}
                    />
                  </label>
                  {formImagePreview && (
                    <img
                      src={formImagePreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                  )}
                </div>
                {!formImagePreview &&
                  editingMenu &&
                  (editingMenu as any).image && (
                    <p className="text-xs text-gray-500 mt-1">
                      Gambar tersimpan akan dipakai jika tidak upload baru.
                    </p>
                  )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMenu(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-3">
              Konfirmasi Hapus
            </h4>
            <p className="text-sm text-gray-700 mb-6">
              Hapus menu{" "}
              <span className="font-semibold">{showDelete.name}</span> untuk
              tanggal ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
