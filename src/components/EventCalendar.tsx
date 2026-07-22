import { MOCK_EVENTS } from "#/mocks/data";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, eachDayOfInterval, parseISO } from "date-fns";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const today = new Date();

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  events: typeof MOCK_EVENTS;
}

export default function EventCalendar() {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(format(today, "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [events, setEvents] = useState(MOCK_EVENTS);
  const firstOfTheMonth = new Date(today.getFullYear(), selectedMonth, 1).getDay();
  const lastOfTheMonth = new Date(today.getFullYear(), selectedMonth + 1, 0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof MOCK_EVENTS>();

    events.forEach((event) => {
      const days = eachDayOfInterval({
        start: parseISO(event.startDate.toISOString()),
        end: parseISO(event.endDate.toISOString()),
      });

      days.forEach((day) => {
        const formattedDate = format(day, "yyyy-MM-dd");
        if (!map.has(formattedDate)) {
          map.set(formattedDate, []);
        }
        map.get(formattedDate)!.push(event);
      });
    });

    return map;
  }, [events]);

  useEffect(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      if (i < firstOfTheMonth) {
        let currentDate = new Date(today.getFullYear(), selectedMonth, i - firstOfTheMonth + 1);
        days.push({
          date: currentDate,
          dateString: format(currentDate, "yyyy-MM-dd"),
          isCurrentMonth: false,
          events: eventsByDate.get(format(currentDate, "yyyy-MM-dd")) || [],
        });
      } else if (i <= lastOfTheMonth.getDate() + firstOfTheMonth - 1) {
        let currentDate = new Date(today.getFullYear(), selectedMonth, i - firstOfTheMonth + 1);
        days.push({
          date: currentDate,
          dateString: format(currentDate, "yyyy-MM-dd"),
          isCurrentMonth: true,
          events: eventsByDate.get(format(currentDate, "yyyy-MM-dd")) || [],
        });
      } else {
        let currentDate = new Date(
          today.getFullYear(),
          selectedMonth + 1,
          i - lastOfTheMonth.getDate() - firstOfTheMonth + 1,
        );
        days.push({
          date: currentDate,
          dateString: format(currentDate, "yyyy-MM-dd"),
          isCurrentMonth: false,
          events: eventsByDate.get(format(currentDate, "yyyy-MM-dd")) || [],
        });
      }
    }
    setCalendarDays(days);
  }, [selectedMonth]);

  return (
    <aside>
      <div className="w-72 flex flex-col bg-elevated rounded-lg p-2">
        <div className="flex items-center justify-between gap-2 p-2">
          <div className="flex items-left gap-2">
            <Calendar />
            {format(new Date(today.getFullYear(), selectedMonth, 1), "MMMM yyyy")}
          </div>
          <div className="flex items-right gap-2">
            <ChevronLeft onClick={() => setSelectedMonth(selectedMonth - 1)} />
            <ChevronRight onClick={() => setSelectedMonth(selectedMonth + 1)} />
          </div>
        </div>
        <div className="grid grid-cols-7">
          {weekdays.map((day, index) => (
            <div
              className="p-2 flex text-lg items-center justify-center font-bold text-stone-500"
              key={index}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 pb-2">
          {calendarDays.map((day, index) => (
            <div
              onClick={() => {
                setSelectedDay(day.dateString);
              }}
              className={`p-2 cursor-pointer flex ${!day.isCurrentMonth ? "text-stone-600" : eventsByDate.get(format(day.date, "yyyy-MM-dd")) ? "font-bold" : "text-stone-400"} items-center justify-center ${day.dateString === selectedDay ? "bg-accent text-elevated rounded-full" : "rounded-lg"}`}
              key={index}
            >
              {day.date.getDate()}
            </div>
          ))}
        </div>
        {eventsByDate.get(selectedDay) && (
          <div className="border-t border-t-stone-700 py-2">
            <div className="flex flex-col items-center justify-between p-2">
              {eventsByDate.get(selectedDay)!.map((event, index) => (
                <div key={index} className="p-2">
                  {event.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
