import Link from "next/link";
import { ShoppingBag, Clock, MapPin, Star } from "lucide-react";

export default function Home() {
  const featuredMenus = [
    {
      id: 1,
      name: "Nasi Gudeg Yogya",
      price: 25000,
      description: "Gudeg dengan ayam kampung, telur, dan sambal krecek",
      image: "/placeholder-food.jpg",
      rating: 4.8,
      available: true
    },
    {
      id: 2,
      name: "Ayam Bakar Bumbu Rujak",
      price: 30000,
      description: "Ayam bakar dengan bumbu rujak khas bu Lala",
      image: "/placeholder-food.jpg",
      rating: 4.9,
      available: true
    },
    {
      id: 3,
      name: "Rendang Daging Sapi",
      price: 35000,
      description: "Rendang daging sapi empuk dengan bumbu tradisional",
      image: "/placeholder-food.jpg",
      rating: 4.7,
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Bu Lala Katering</h1>
              <p className="text-gray-600">Masakan Rumahan Berkualitas</p>
            </div>
            <Link
              href="/checkout"
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Checkout Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pesan Katering Mudah & Praktis
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Nikmati masakan rumahan berkualitas dengan sistem pemesanan yang mudah dan terintegrasi WhatsApp
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              Pesanan Multi-Hari
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4" />
              Delivery & Pickup
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <ShoppingBag className="w-4 h-4" />
              Konfirmasi WhatsApp
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-dark text-center mb-12">
            Mengapa Pilih Bu Lala Katering?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-dark mb-2">Menu Harian</h4>
              <p className="text-gray-600">
                Menu baru setiap hari dengan harga yang berbeda sesuai bahan terbaik
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-dark mb-2">Fleksibel</h4>
              <p className="text-gray-600">
                Pesan untuk satu hari atau beberapa hari sekaligus dengan mudah
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-dark mb-2">Praktis</h4>
              <p className="text-gray-600">
                Konfirmasi otomatis via WhatsApp, tidak perlu repot menunggu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-dark text-center mb-12">
            Menu Favorit Pelanggan
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredMenus.map((menu) => (
              <div key={menu.id} className="bg-light rounded-2xl shadow-sm overflow-hidden">
                <div className="h-48 bg-secondary flex items-center justify-center">
                  <span className="text-gray-500">Foto Menu</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-dark">{menu.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-current" />
                      <span className="text-sm text-gray-600">{menu.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{menu.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      menu.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {menu.available ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-dark mb-4">
            Siap untuk Memesan?
          </h3>
          <p className="text-lg text-gray-700 mb-8">
            Lihat demo halaman checkout yang kami buat khusus untuk memudahkan pelanggan Bu Lala
          </p>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all hover:shadow-lg transform hover:-translate-y-1"
          >
            <ShoppingBag className="w-5 h-5" />
            Coba Halaman Checkout
          </Link>
          <div className="mt-6 text-sm text-gray-600">
            *Ini adalah demo untuk menunjukkan fitur checkout yang user-friendly
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xl font-bold text-primary mb-4">Bu Lala Katering</h4>
              <p className="text-gray-300 mb-4">
                Menyediakan masakan rumahan berkualitas dengan sistem pemesanan modern yang mudah digunakan.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Kontak</h5>
              <div className="space-y-2 text-gray-300">
                <p>WhatsApp: 081234567890</p>
                <p>Email: info@bulalakatering.com</p>
                <p>Alamat: Jl. Contoh No. 123, Yogyakarta</p>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Jam Operasional</h5>
              <div className="space-y-2 text-gray-300">
                <p>Senin - Jumat: 06:00 - 18:00</p>
                <p>Sabtu: 06:00 - 15:00</p>
                <p>Minggu: Libur</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bu Lala Katering. Website demo untuk Projek PAW.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}