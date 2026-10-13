"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type User = { id: number; email: string; role: "user" | "admin" };

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  },  [pathname]);

    async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); 
    router.push("/events");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/events" className="text-lg font-bold text-indigo-700">
          Community Events
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {checked && user && (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="font-medium text-gray-700 hover:text-indigo-700">Admin</Link>
              )}
              <Link href="/feed" className="font-medium text-gray-700 hover:text-indigo-700">My Feed</Link>
              <Link href="/favourites" className="font-medium text-gray-700 hover:text-indigo-700">Favourites</Link>
              <span className="hidden text-gray-500 sm:inline">{user.email}</span>
              <button onClick={logout} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                Log out
              </button>
            </>
          )}
          {checked && !user && (
            <>
              <Link href="/login" className="font-medium text-gray-700 hover:text-indigo-700">Log in</Link>
              <Link href="/signup" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}