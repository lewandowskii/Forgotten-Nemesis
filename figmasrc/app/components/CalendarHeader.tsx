import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "tdesign-icons-react";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarHeader({ year, month, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
      >
        <ChevronLeftIcon size="20px" />
      </button>
      <div className="text-center">
        <span className="text-base font-semibold text-gray-800">
          {year}年{month}月
        </span>
      </div>
      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
      >
        <ChevronRightIcon size="20px" />
      </button>
    </div>
  );
}
