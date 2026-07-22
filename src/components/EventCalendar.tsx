import { MOCK_EVENTS } from "#/mocks/data";
import { Calendar } from "lucide-react";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export default function EventCalendar() {

  const today = new Date();
  const firstOfTheMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const lastOfTheMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const calendarDays = [];

  for (let i = 0; i < 42; i++) {
    if(i < firstOfTheMonth) {
      calendarDays.push(<div className="p-2 flex items-center justify-center text-stone-600" key={i}>{new Date(today.getFullYear(), today.getMonth(), i - firstOfTheMonth + 1).getDate()}</div>)
    } else if (i <= lastOfTheMonth.getDate() + firstOfTheMonth - 1) {
      calendarDays.push(<div className="p-2 flex items-center justify-center" key={i}>{new Date(today.getFullYear(), today.getMonth(), i - firstOfTheMonth + 1).getDate()}</div>)
    } else {
      calendarDays.push(<div className="p-2 flex items-center justify-center text-stone-600" key={i}>{new Date(today.getFullYear(), today.getMonth() + 1, i - lastOfTheMonth.getDate() - firstOfTheMonth + 1).getDate()}</div>)
    }
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
            <div className="p-2 flex items-center justify-center font-bold text-stone-500" key={index}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays}
        </div>
      </div>
    </aside>
  );
}
