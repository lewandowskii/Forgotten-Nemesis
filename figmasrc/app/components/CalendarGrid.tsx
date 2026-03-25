import React from "react";
import { Lunar } from "lunar-typescript";
import { CalendarEvent } from "./CalendarApp";

interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
}

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getLunarDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  try {
    const lunar = Lunar.fromDate(new Date(y, m - 1, d));
    const dayName = lunar.getDayInChinese();
    const monthName = lunar.getMonthInChinese();
    // If it's the first day of lunar month, show month name
    if (lunar.getDay() === 1) {
      return monthName + "月";
    }
    return dayName;
  } catch {
    return "";
  }
}

export function CalendarGrid({
  year,
  month,
  selectedDate,
  today,
  onSelectDate,
  getEventsForDate,
}: CalendarGridProps) {
  // Get first day of month (0=Sun)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-2 pb-3">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs py-1 font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="h-12" />;
          }

          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = idx % 7;
          const events = getEventsForDate(dateStr);
          const lunarDay = getLunarDay(dateStr);
          const dayNum = parseInt(dateStr.split("-")[2]);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-12 flex flex-col items-center justify-center rounded-lg relative transition-colors
                ${isSelected ? "bg-[#0052D9]" : isToday ? "bg-blue-50" : ""}
                ${!isSelected && !isToday ? "active:bg-gray-100" : ""}
              `}
            >
              <span
                className={`text-sm leading-none mb-0.5 ${
                  isSelected
                    ? "text-white font-semibold"
                    : isToday
                    ? "text-[#0052D9] font-semibold"
                    : dayOfWeek === 0
                    ? "text-red-400"
                    : dayOfWeek === 6
                    ? "text-blue-500"
                    : "text-gray-700"
                }`}
              >
                {dayNum}
              </span>
              <span
                className={`text-[9px] leading-none ${
                  isSelected ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {lunarDay}
              </span>
              {/* Event dots */}
              {events.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                  {events.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : ev.color,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
