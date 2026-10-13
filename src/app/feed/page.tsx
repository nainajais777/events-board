import FeedList from "@/components/FeedList";

export default function FeedPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">My Feed</h1>
      <FeedList />
    </main>
  );
}