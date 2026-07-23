import { createFileRoute } from "@tanstack/react-router";
import StreamGrid from "#/components/StreamGrid";
import FeaturedHero from "#/components/FeaturedHero";
import EventCalendar from "#/components/EventCalendar";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="mx-auto w-11/12 max-w-screen-2xl flex flex-col gap-8 py-8">
      <FeaturedHero />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1fr]">
        <div>
          <StreamGrid />
        </div>
        <div>
          <EventCalendar />
        </div>
      </div>
    </main>
  );
}
