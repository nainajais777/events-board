import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
      <p className="mt-1 text-gray-600">
        Create events and control what visitors see. Events are never deleted; make them inactive instead.
      </p>
      <AdminDashboard />
    </main>
  );
}