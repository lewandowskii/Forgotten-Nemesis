import React, { useState } from "react";
import { CalendarEvent, EventType } from "./CalendarApp";
import { CloseIcon, HeartIcon, TimeIcon, UserIcon, CalendarIcon } from "tdesign-icons-react";

interface AddEventDialogProps {
  defaultDate: string;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, "id">) => void;
  typeColors: Record<EventType, string>;
}

const TYPES: { value: EventType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "anniversary", label: "纪念日", icon: <HeartIcon size="20px" />, desc: "每年重复" },
  { value: "birthday", label: "生日", icon: <UserIcon size="20px" />, desc: "每年重复" },
  { value: "schedule", label: "日程", icon: <TimeIcon size="20px" />, desc: "一次性" },
  { value: "holiday", label: "节日", icon: <CalendarIcon size="20px" />, desc: "每年重复" },
];

const COLOR_OPTIONS = [
  "#FF6B6B", "#FF9F43", "#FFD93D", "#6BCB77",
  "#4ECDC4", "#0052D9", "#9B59B6", "#E91E8C",
];

export function AddEventDialog({ defaultDate, onClose, onAdd, typeColors }: AddEventDialogProps) {
  const [type, setType] = useState<EventType>("anniversary");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [color, setColor] = useState(typeColors["anniversary"]);
  const [startDate, setStartDate] = useState(defaultDate);

  const isRepeating = type === "anniversary" || type === "birthday" || type === "holiday";

  const handleTypeChange = (t: EventType) => {
    setType(t);
    setColor(typeColors[t]);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const event: Omit<CalendarEvent, "id"> = {
      title: title.trim(),
      date,
      type,
      color,
      note: note.trim() || undefined,
      repeatYearly: isRepeating,
      startDate: isRepeating ? startDate : undefined,
    };
    onAdd(event);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-3xl px-5 pt-5 pb-8 z-10 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />

        <div className="flex items-center justify-between mb-5 mt-1">
          <h2 className="text-base font-semibold text-gray-800">添加事件</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-full active:bg-gray-100"
          >
            <CloseIcon size="18px" />
          </button>
        </div>

        {/* Type Selection */}
        <div className="mb-5">
          <label className="text-xs text-gray-400 mb-2 block">事件类型</label>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                  type === t.value
                    ? "border-current"
                    : "border-transparent bg-gray-50"
                }`}
                style={
                  type === t.value
                    ? { borderColor: typeColors[t.value], backgroundColor: typeColors[t.value] + "15" }
                    : {}
                }
              >
                <span style={{ color: type === t.value ? typeColors[t.value] : "#9CA3AF" }}>
                  {t.icon}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: type === t.value ? typeColors[t.value] : "#9CA3AF" }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#0052D9] bg-gray-50"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">
            {isRepeating ? "开始日期（纪念日起始）" : "日期"}
          </label>
          <input
            type="date"
            value={isRepeating ? startDate : date}
            onChange={(e) => {
              if (isRepeating) {
                setStartDate(e.target.value);
                // Update the display date to current year's occurrence
                const [, m, d] = e.target.value.split("-");
                setDate(`2026-${m}-${d}`);
              } else {
                setDate(e.target.value);
              }
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#0052D9] bg-gray-50"
          />
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">颜色</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 mb-1.5 block">备注（可选）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加一些备注..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#0052D9] bg-gray-50 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{ backgroundColor: color }}
        >
          保存
        </button>
      </div>
    </div>
  );
}
