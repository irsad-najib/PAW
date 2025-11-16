"use client";

import { useEffect, useState } from "react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

// --- DATA DUMMY (Simulasi Backend) ---
export const menuData: Record<string, MenuItem[]> = {
  "2025-11-15": [
    {
      id: "M-001",
      name: "Nasi Ayam Bakar",
      price: 20000,
      stock: 50,
      description: "Ayam bakar bumbu kecap, lalapan, sambal",
    },
    {
      id: "M-002",
      name: "Es Teh Manis",
      price: 5000,
      stock: 100,
      description: "Teh melati, gula pasir, es batu",
    },
  ],
  "2025-11-16": [
    {
      id: "M-003",
      name: "Soto Ayam Komplit",
      price: 17000,
      stock: 45,
      description: "Soto bening koya, telur, suwiran ayam",
    },
    {
      id: "M-004",
      name: "Gulai Ikan Patin",
      price: 22000,
      stock: 35,
      description: "Kuah santan kental dengan daun ruku-ruku",
    },
  ],
  "2025-11-17": [],
  "2025-11-18": [
    { id: "M-001", name: "Nasi Ayam Bakar", price: 21000, stock: 50 },
    { id: "M-005", name: "Nasi Pecel Lele", price: 16000, stock: 60 },
  ],
  "2025-11-24": [
    { id: "M-006", name: "Nasi Goreng Spesial", price: 18000, stock: 40 },
  ],
};

interface MenuDetailProps {
  selectedDate: string;
}

export default function MenuDetail({ selectedDate }: MenuDetailProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [showDelete, setShowDelete] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItem>({
    id: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
  });
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const masterMenus: MenuItem[] = Array.from(
    Object.values(menuData).flat().reduce((map, item) => {
      if (!map.has(item.id)) map.set(item.id, item);
      return map;
    }, new Map<string, MenuItem>())
  );

  useEffect(() => {
    setMenus(menuData[selectedDate] || []);
    setEditingMenu(null);
    setShowForm(false);
    setShowDelete(null);
  }, [selectedDate]);

  const resetForm = () =>
    setFormData({ id: "", name: "", description: "", price: 0, stock: 0, imageUrl: "" });

  const handleCopyExisting = (id: string) => {
    if (!id) return;
    const template = masterMenus.find((m) => m.id === id);
    if (!template) return;
    setFormData((prev) => ({
      ...prev,
      id: template.id,
      name: template.name,
      description: template.description,
      // Harga dan stok dibiarkan dari input sebelumnya jika perlu ditimpa manual
    }));
    if (template.imageUrl) {
      setFormImagePreview(template.imageUrl);
    }
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
    setFormImagePreview(menu.imageUrl || "");
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;
    const imageUrlToUse = formImagePreview || formData.imageUrl || "";
    if (editingMenu) {
      setMenus((prev) =>
        prev.map((m) =>
          m.id === editingMenu.id ? { ...formData, imageUrl: imageUrlToUse } : m
        )
      );
    } else {
      setMenus((prev) => [
        ...prev,
        { ...formData, imageUrl: imageUrlToUse, id: formData.id || `NEW-${Date.now()}` },
      ]);
    }
    setShowForm(false);
    setEditingMenu(null);
    resetForm();
    setFormImageFile(null);
    setFormImagePreview("");
  };

  const handleDelete = () => {
    if (!showDelete) return;
    setMenus((prev) => prev.filter((m) => m.id !== showDelete.id));
    setShowDelete(null);
  };

  const readableDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Detail Menu: {readableDate}
      </h3>

      {menus.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nama Menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Foto
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
                <tr key={menu.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {menu.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {menu.imageUrl ? (
                      <img
                        src={menu.imageUrl}
                        alt={menu.name}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {menu.description || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    Rp {menu.price.toLocaleString("id-ID")}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-800">
                    {menu.stock} Porsi
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold">
                    <button
                      onClick={() => handleOpenEdit(menu)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setShowDelete(menu)}
                      className="text-red-600 hover:text-red-800 font-semibold ml-4"
                    >
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

      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
      onClick={handleOpenAdd}
    >
      + Tambah Menu Baru
    </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                  {editingMenu ? "Edit Menu" : "Tambah Menu"}
                </p>
                <h4 className="text-xl font-extrabold text-gray-900">
                  {editingMenu ? "Perbarui Menu" : "Menu Baru"}
                </h4>
                <p className="text-sm text-gray-600">
                  {editingMenu
                    ? "Perbaharui data menu untuk tanggal ini."
                    : "Isi detail menu untuk tanggal ini."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMenu(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
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
              {!editingMenu && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Salin dari Menu Sebelumnya (opsional)
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    defaultValue=""
                    onChange={(e) => handleCopyExisting(e.target.value)}
                  >
                    <option value="">Pilih menu...</option>
                    {masterMenus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Memilih menu akan mengisi nama & deskripsi. Sesuaikan harga/stok untuk tanggal ini.
                  </p>
                </div>
              )}
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
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {editingMenu ? "Foto Menu (Opsional: ganti foto)" : "Foto Menu"}
                </label>
                <label className="flex items-center justify-between w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 text-gray-800">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">
                      {formImagePreview || formData.imageUrl
                        ? "Ganti / Upload Foto"
                        : "Upload Foto Menu"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Klik untuk memilih file (jpg/png). Jika edit, biarkan kosong untuk pakai foto lama.
                    </p>
                  </div>
                  <span className="text-lg">📤</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormImageFile(file);
                        setFormImagePreview(URL.createObjectURL(file));
                      } else {
                        setFormImageFile(null);
                        setFormImagePreview("");
                      }
                    }}
                  />
                </label>
                {(formImagePreview || formData.imageUrl) && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-700 mb-1 font-semibold">Pratinjau:</p>
                    <img
                      src={formImagePreview || formData.imageUrl}
                      alt={formData.name}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    {editingMenu && formData.imageUrl && !formImagePreview && (
                      <p className="text-xs text-gray-500 mt-1">
                        Menggunakan gambar lama. Unggah untuk mengganti.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Stok (Porsi)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMenu(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Hapus Menu?
            </h4>
            <p className="text-sm text-gray-700 mb-6">
              Anda akan menghapus menu "{showDelete.name}" dari tanggal ini.
              Tindakan ini tidak memengaruhi pesanan yang sudah ada.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
