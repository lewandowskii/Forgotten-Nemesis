import React, { useState, useCallback } from "react";
import { Lunar } from "lunar-typescript";
import { AddEventDialog } from "./AddEventDialog";
import { EventList } from "./EventList";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { UpcomingEvents } from "./UpcomingEvents";

export type EventType = "anniversary" | "schedule" | "birthday" | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  color: string;
  note?: string;
  repeatYearly?: boolean;
  startDate?: string; // original start date for anniversary counting
}

const TYPE_COLORS: Record<EventType, string> = {
  anniversary: "#FF6B6B",
  schedule: "#4ECDC4",
  birthday: "#FFD93D",
  holiday: "#6BCB77",
};

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "结婚纪念日",
    date: "2026-03-15",
    type: "anniversary",
    color: "#FF6B6B",
    note: "永远爱你",
    repeatYearly: true,
    startDate: "2020-03-15",
  },
  {
    id: "2",
    title: "妈妈生日",
    date: "2026-03-20",
    type: "birthday",
    color: "#FFD93D",
    repeatYearly: true,
    startDate: "1970-03-20",
  },
  {
    id: "3",
    title: "项目评审会议",
    date: "2026-03-10",
    type: "schedule",
    color: "#4ECDC4",
    note: "准备好PPT和数据报告",
  },
  {
    id: "4",
    title: "团队聚餐",
    date: "2026-03-18",
    type: "schedule",
    color: "#4ECDC4",
  },
  {
    id: "5",
    title: "恋爱纪念日",
    date: "2026-03-03",
    type: "anniversary",
    color: "#FF6B6B",
    repeatYearly: true,
    startDate: "2019-03-03",
    note: "七年之痒，依然爱你 ❤️",
  },
];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarApp() {
  const today = new Date(2026, 2, 3); // March 3, 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(3); // 1-based
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));
  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "upcoming">("calendar");

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getEventsForDate = useCallback(
    (dateStr: string) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return events.filter((ev) => {
        if (ev.repeatYearly) {
          const [, em, ed] = ev.date.split("-").map(Number);
          return em === m && ed === d;
        }
        return ev.date === dateStr;
      });
    },
    [events]
  );

  const selectedEvents = getEventsForDate(selectedDate);

  const handleAddEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowAddDialog(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Upcoming events sorted by date
  const upcomingEvents = [...events]
    .map((ev) => {
      const todayStr = formatDate(today);
      let nextDate = ev.date;
      if (ev.repeatYearly) {
        const [, m, d] = ev.date.split("-").map(Number);
        const thisYear = today.getFullYear();
        let candidate = `${thisYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (candidate < todayStr) {
          candidate = `${thisYear + 1}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
        nextDate = candidate;
      }
      return { ...ev, nextDate };
    })
    .filter((ev) => ev.nextDate >= formatDate(today))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Top Navigation */}
      <div className="flex bg-white border-b border-gray-100">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "calendar"
              ? "text-[#0052D9] border-b-2 border-[#0052D9]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("calendar")}
        >
          日历
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "upcoming"
              ? "text-[#0052D9] border-b-2 border-[#0052D9]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          即将到来
        </button>
      </div>

      {activeTab === "calendar" ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Calendar Section */}
          <div className="bg-white shadow-sm">
            <CalendarHeader
              year={currentYear}
              month={currentMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
            />
            <CalendarGrid
              year={currentYear}
              month={currentMonth}
              selectedDate={selectedDate}
              today={formatDate(today)}
              onSelectDate={setSelectedDate}
              getEventsForDate={getEventsForDate}
            />
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto">
            <EventList
              date={selectedDate}
              events={selectedEvents}
              onDelete={handleDeleteEvent}
              onAdd={() => setShowAddDialog(true)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <UpcomingEvents
            events={upcomingEvents}
            today={formatDate(today)}
            onDelete={handleDeleteEvent}
            onAdd={() => setShowAddDialog(true)}
          />
        </div>
      )}

      {/* FAB Add Button */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0052D9] rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-50 active:scale-95 transition-transform"
      >
        +
      </button>

      {showAddDialog && (
        <AddEventDialog
          defaultDate={selectedDate}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddEvent}
          typeColors={TYPE_COLORS}
        />
      )}
    </div>
  );
}