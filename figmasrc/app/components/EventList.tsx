import React from "react";
import { CalendarEvent, EventType } from "./CalendarApp";
import { Lunar } from "lunar-typescript";
import {
  HeartIcon,
  CalendarIcon,
  TimeIcon,
  DeleteIcon,
  UserIcon,
} from "tdesign-icons-react";

interface EventListProps {
  date: string;
  events: CalendarEvent[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const TYPE_LABELS: Record<EventType, string> = {
  anniversary: "纪念日",
  schedule: "日程",
  birthday: "生日",
  holiday: "节日",
};

const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  anniversary: <HeartIcon size="16px" />,
  schedule: <TimeIcon size="16px" />,
  birthday: <UserIcon size="16px" />,
  holiday: <CalendarIcon size="16px" />,
};

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  try {
    const lunar = Lunar.fromDate(date);
    const lunarStr = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    return `${y}年${m}月${d}日 ${weekDays[date.getDay()]} ${lunarStr}`;
  } catch {
    return `${y}年${m}月${d}日 ${weekDays[date.getDay()]}`;
  }
}

function getAnniversaryYears(event: CalendarEvent): number | null {
  if (!event.repeatYearly || !event.startDate) return null;
  const [sy] = event.startDate.split("-").map(Number);
  const [ey] = event.date.split("-").map(Number);
  const currentYear = 2026;
  return currentYear - sy;
}

export function EventList({ date, events, onDelete, onAdd }: EventListProps) {
  const displayDate = formatDisplayDate(date);

  return (
    <div className="px-3 py-3">
      <div className="text-xs text-gray-400 mb-3 px-1">{displayDate}</div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <CalendarIcon size="48px" />
          <p className="mt-3 text-sm text-gray-400">暂无日程</p>
          <button
            onClick={onAdd}
            className="mt-3 text-sm text-[#0052D9] font-medium"
          >
            + 添加日程或纪念日
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const years = getAnniversaryYears(ev);
            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: ev.color + "20", color: ev.color }}
                >
                  {TYPE_ICONS[ev.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {ev.title}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color + "20", color: ev.color }}
                    >
                      {TYPE_LABELS[ev.type]}
                    </span>
                  </div>
                  {years !== null && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      🎉 已陪伴 <span className="text-[#FF6B6B] font-medium">{years}</span> 年
                    </div>
                  )}
                  {ev.note && (
                    <div className="text-xs text-gray-400 mt-1 truncate">{ev.note}</div>
                  )}
                </div>
                <button
                  onClick={() => onDelete(ev.id)}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 active:text-red-400 flex-shrink-0"
                >
                  <DeleteIcon size="16px" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
