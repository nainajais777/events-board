import FavouritesPicker from "@/components/FavouritesPicker";

export default function FavouritesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Your favourite categories</h1>
      <p className="mt-1 text-gray-600">Pick what you love. My Feed will show upcoming events from these.</p>
      <FavouritesPicker />
    </main>
  );
}