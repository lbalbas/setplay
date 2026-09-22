import { createFileRoute } from "@tanstack/react-router";
import StreamGrid from "#/components/StreamGrid";
import FeaturedHero from "#/components/FeaturedHero";
import EventCalendar from "#/components/EventCalendar";
import { getEvents } from "#/server/events";

export const Route = createFileRoute("/")({
  loader: async () => {
    const events = await getEvents();
    return { events };
  },
  component: App,
});

function App() {
  const { events } = Route.useLoaderData();

  return (
    <main className="mx-auto flex w-11/12 max-w-screen-2xl flex-col gap-8 py-8">
      <FeaturedHero />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1fr]">
        <div>
          <StreamGrid />
        </div>
        <div>
          <EventCalendar events={events} />
        </div>
      </div>
    </main>
  );
}
