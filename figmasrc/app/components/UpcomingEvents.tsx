import React from "react";
import { CalendarEvent, EventType } from "./CalendarApp";
import { HeartIcon, TimeIcon, UserIcon, CalendarIcon, DeleteIcon } from "tdesign-icons-react";

interface UpcomingEventsProps {
  events: (CalendarEvent & { nextDate: string })[];
  today: string;
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
  anniversary: <HeartIcon size="18px" />,
  schedule: <TimeIcon size="18px" />,
  birthday: <UserIcon size="18px" />,
  holiday: <CalendarIcon size="18px" />,
};

function daysUntil(dateStr: string, today: string): number {
  const d1 = new Date(dateStr);
  const d2 = new Date(today);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export function UpcomingEvents({ events, today, onDelete, onAdd }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <CalendarIcon size="56px" />
        <p className="mt-4 text-sm text-gray-400">暂无即将到来的事件</p>
        <button onClick={onAdd} className="mt-3 text-sm text-[#0052D9] font-medium">
          + 添加日程或纪念日
        </button>
      </div>
    );
  }

  // Group by month
  const grouped: Record<string, (CalendarEvent & { nextDate: string })[]> = {};
  events.forEach((ev) => {
    const [y, m] = ev.nextDate.split("-");
    const key = `${y}年${parseInt(m)}月`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div className="px-3 py-4 space-y-4">
      {Object.entries(grouped).map(([month, evs]) => (
        <div key={month}>
          <div className="text-xs font-semibold text-gray-400 px-1 mb-2">{month}</div>
          <div className="space-y-2">
            {evs.map((ev) => {
              const days = daysUntil(ev.nextDate, today);
              const isToday = days === 0;
              const isTomorrow = days === 1;
              const years =
                ev.repeatYearly && ev.startDate
                  ? new Date(ev.nextDate).getFullYear() - parseInt(ev.startDate.split("-")[0])
                  : null;

              return (
                <div
                  key={ev.id + ev.nextDate}
                  className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ev.color + "20", color: ev.color }}
                  >
                    {TYPE_ICONS[ev.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 truncate">{ev.title}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ev.color + "20", color: ev.color }}
                      >
                        {TYPE_LABELS[ev.type]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatShortDate(ev.nextDate)}</div>
                    {years !== null && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        第 <span className="text-[#FF6B6B] font-medium">{years}</span> 周年
                      </div>
                    )}
                    {ev.note && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{ev.note}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isToday
                          ? "bg-red-50 text-red-500"
                          : isTomorrow
                          ? "bg-orange-50 text-orange-500"
                          : days <= 7
                          ? "bg-blue-50 text-blue-500"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {isToday ? "今天" : isTomorrow ? "明天" : `${days}天后`}
                    </div>
                    <button
                      onClick={() => onDelete(ev.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-300 active:text-red-400"
                    >
                      <DeleteIcon size="14px" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
