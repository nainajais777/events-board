import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
      <AuthForm mode="login" />
    </main>
  );
}