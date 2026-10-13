import { Suspense } from "react";
import EventDetail from "@/components/EventDetail";

async function EventContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // request-specific data, so it lives inside <Suspense>
  return <EventDetail eventId={id} />;
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-gray-200" />}>
        <EventContent params={params} />
      </Suspense>
    </main>
  );
}