import EventsBrowser from "@/components/EventsBrowser";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Upcoming events</h1>
      <p className="mt-1 text-gray-600">Music nights, workshops, food fairs and more near you.</p>
      <EventsBrowser />
    </main>
  );
}