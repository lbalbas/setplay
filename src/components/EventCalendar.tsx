import { MOCK_EVENTS } from "#/mocks/data";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: typeof MOCK_EVENTS;
}

export default function EventCalendar() {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const today = new Date();
  const firstOfTheMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const lastOfTheMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  useEffect(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      if (i < firstOfTheMonth) {
        let currentDate = new Date(today.getFullYear(), today.getMonth(), i - firstOfTheMonth + 1);
        days.push({
          date: currentDate,
          isCurrentMonth: false,
          isToday: false,
          events: getEventsForDate(currentDate),
        })
      } else if (i <= lastOfTheMonth.getDate() + firstOfTheMonth - 1) {
        let currentDate = new Date(today.getFullYear(), today.getMonth(), i - firstOfTheMonth + 1);
        days.push({
          date: currentDate,
          isCurrentMonth: true,
          isToday: currentDate.getDate() === today.getDate(),
          events: getEventsForDate(currentDate),
        })
      } else {
        let currentDate = new Date(today.getFullYear(), today.getMonth() + 1, i - lastOfTheMonth.getDate() - firstOfTheMonth + 1);
        days.push({
          date: currentDate,
          isCurrentMonth: false,
          isToday: false,
          events: getEventsForDate(currentDate),
        })
      }
    }
    setCalendarDays(days);
  }, [])

  const getEventsForDate = (date: Date) => {
    return [];
  }
  return (
    <aside>
      <div className="w-72 flex flex-col bg-elevated rounded-lg p-2">
        <div className="flex items-center justify-left gap-2 p-2">
          <Calendar />
          Calendar
        </div>
        <div className="grid grid-cols-7">
          {weekdays.map((day, index) => (
            <div className="p-2 flex text-lg items-center justify-center font-bold text-stone-500" key={index}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div className={`p-2 flex font-bold items-center justify-center ${day.isToday ? 'bg-accent text-elevated rounded-full' : 'rounded-lg'} ${!day.isCurrentMonth ? 'text-stone-600' : ''}`} key={index}>{day.date.getDate()}</div>
          ))}
        </div>
      </div>
    </aside>
  );
}
