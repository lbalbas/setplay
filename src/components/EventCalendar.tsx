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
      <div className="w-72 flex flex-col bg-surface rounded-xl border border-line p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-copy-primary text-xl font-bold">
            Calendar{" "}
            <span className="text-copy-secondary/50 text-sm font-sans ml-2">
              {format(viewDate, "MMMM yyyy")}
            </span>
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setViewDate((prev) => addDays(startOfMonth(prev), -31))}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-copy-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setViewDate((prev) => addDays(startOfMonth(prev), 31))}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-copy-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-copy-secondary/60 text-xs font-bold uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 mb-6">
          {calendarDays.map(({ date, dateString, isCurrentMonth }) => (
            <button
              key={dateString}
              onClick={() => handleDayClick(dateString)}
              className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all
                ${!isCurrentMonth ? "text-copy-secondary/30" : "text-copy-primary"}
                ${dateString === selectedDay ? "bg-accent text-black font-bold" : ""}
                ${isSameDay(date, today) && dateString !== selectedDay ? "border border-accent/40 text-accent" : ""}
                ${!isCurrentMonth && dateString !== selectedDay ? "hover:bg-white/5" : "hover:bg-white/10"}
              `}
            >
              {format(date, "d")}
            </button>
          ))}
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="text-copy-secondary text-xs font-bold uppercase tracking-widest mb-3">
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
                      className={`w-2 h-2 rounded-full ${event.status === "live" ? "bg-accent animate-pulse" : "border border-copy-secondary/50"}`}
                    />
                    <span className="text-copy-primary font-bold text-sm group-hover:text-accent transition-colors">
                      {event.name}
                    </span>
                  </div>
                  <div className="pl-5 text-copy-secondary text-xs">
                    {format(parseISO(event.startDate.toISOString()), "MMM d, HH:mm")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-copy-secondary/40 text-xs italic py-2">No events scheduled</div>
            )}
          </div>

          <Link to="/" className="mt-4 inline-block text-accent text-xs font-bold hover:underline">
            Show more
          </Link>
        </div>
      </div>
    </aside>
  );
}
