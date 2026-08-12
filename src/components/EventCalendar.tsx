import { MOCK_EVENTS } from "#/mocks/data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  format,
  eachDayOfInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { Link } from "@tanstack/react-router";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();

export default function EventCalendar() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end = addDays(start, 41);

    return eachDayOfInterval({ start, end }).map((date) => ({
      date,
      dateString: format(date, "yyyy-MM-dd"),
      isCurrentMonth: isSameMonth(date, viewDate),
    }));
  }, [viewDate]);

  const filteredEvents = useMemo(() => {
    if (selectedDay) {
      return MOCK_EVENTS.filter((event) => {
        const start = parseISO(event.startDate.toISOString());
        const end = parseISO(event.endDate.toISOString());
        const target = parseISO(selectedDay);
        return (
          isSameDay(target, start) ||
          isSameDay(target, end) ||
          (isAfter(target, start) && isBefore(target, end))
        );
      });
    }

    return MOCK_EVENTS.filter((event) => {
      const start = parseISO(event.startDate.toISOString());
      return isAfter(start, today) || isSameDay(start, today);
    }).sort(
      (a, b) =>
        parseISO(a.startDate.toISOString()).getTime() -
        parseISO(b.startDate.toISOString()).getTime(),
    );
  }, [selectedDay]);

  const handleDayClick = (dateString: string) => {
    setSelectedDay((prev) => (prev === dateString ? null : dateString));
  };

  return (
    <aside>
      <div className="flex w-72 flex-col rounded-xl border border-line bg-surface p-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-copy-primary">
            Calendar{" "}
            <span className="ml-2 font-sans text-sm text-copy-secondary/50">
              {format(viewDate, "MMMM yyyy")}
            </span>
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setViewDate((prev) => addDays(startOfMonth(prev), -31))}
              className="rounded-md p-1 text-copy-secondary transition-colors hover:bg-white/5"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewDate((prev) => addDays(startOfMonth(prev), 31))}
              className="rounded-md p-1 text-copy-secondary transition-colors hover:bg-white/5"
              aria-label="Next month"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold tracking-wider text-copy-secondary/60 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div role="grid" aria-label="Calendar days" className="mb-6 grid grid-cols-7 gap-y-1">
          {calendarDays.map(({ date, dateString, isCurrentMonth }) => (
            <button
              key={dateString}
              onClick={() => handleDayClick(dateString)}
              aria-label={format(date, "MMMM d, yyyy")}
              aria-pressed={dateString === selectedDay}
              aria-current={isSameDay(date, today) ? "date" : undefined}
              className={`
                flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all
                ${!isCurrentMonth ? "text-copy-secondary/30" : "text-copy-primary"}
                ${dateString === selectedDay ? "bg-accent font-bold text-black!" : ""}
                ${isSameDay(date, today) && dateString !== selectedDay ? "border border-accent/40 text-accent" : ""}
                ${!isCurrentMonth && dateString !== selectedDay ? "hover:bg-white/5" : "hover:bg-white/10"}
              `}
            >
              {format(date, "d")}
            </button>
          ))}
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-copy-secondary uppercase">
            {selectedDay
              ? `Events on ${format(parseISO(selectedDay), "MMM d")}`
              : "Upcoming Events"}
          </h3>

          <div className="flex flex-col gap-3">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${event.status === "live" ? "animate-pulse bg-accent" : "border border-copy-secondary/50"}`}
                    />
                    <span className="text-sm font-bold text-copy-primary transition-colors group-hover:text-accent">
                      {event.name}
                    </span>
                  </div>
                  <div className="pl-5 text-xs text-copy-secondary">
                    {format(parseISO(event.startDate.toISOString()), "MMM d, HH:mm")}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-xs text-copy-secondary/40 italic">No events scheduled</div>
            )}
          </div>

          <Link to="/" className="mt-4 inline-block text-xs font-bold text-accent hover:underline">
            Show more
          </Link>
        </div>
      </div>
    </aside>
  );
}
