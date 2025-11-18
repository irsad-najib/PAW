import { redirect } from "next/navigation";

// Halaman ini tidak akan pernah terlihat.
// Tugasnya hanya mengalihkan pengguna ke dashboard.

export default function AdminRootPage() {
  redirect("/admin/dashboard");

  // Anda tidak perlu me-return apapun
  // karena redirect() akan menghentikan render.
}
