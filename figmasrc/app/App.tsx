import React from "react";
import { CalendarApp } from "./components/CalendarApp";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Phone Frame */}
      <div
        className="relative bg-black rounded-[44px] shadow-2xl"
        style={{ width: 390, height: 844 }}
      >
        {/* Screen border */}
        <div
          className="absolute inset-[3px] rounded-[41px] overflow-hidden bg-white"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 bg-white">
            <span className="text-xs font-semibold text-gray-800">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 items-end">
                <div className="w-1 h-2 bg-gray-800 rounded-sm" />
                <div className="w-1 h-3 bg-gray-800 rounded-sm" />
                <div className="w-1 h-4 bg-gray-800 rounded-sm" />
                <div className="w-1 h-5 bg-gray-800 rounded-sm opacity-40" />
              </div>
              <svg width="15" height="11" viewBox="0 0 15 11" className="ml-0.5">
                <path d="M7.5 2.5C9.5 2.5 11.3 3.3 12.6 4.6L14 3.2C12.3 1.5 10 0.5 7.5 0.5S2.7 1.5 1 3.2L2.4 4.6C3.7 3.3 5.5 2.5 7.5 2.5Z" fill="#333" />
                <path d="M7.5 5.5C8.9 5.5 10.2 6.1 11.1 7L12.5 5.6C11.2 4.3 9.4 3.5 7.5 3.5S3.8 4.3 2.5 5.6L3.9 7C4.8 6.1 6.1 5.5 7.5 5.5Z" fill="#333" />
                <circle cx="7.5" cy="9.5" r="1.5" fill="#333" />
              </svg>
              <div className="flex items-center gap-0.5 ml-0.5">
                <div className="w-6 h-3 border border-gray-800 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-gray-800 rounded-sm" style={{ width: "75%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="bg-white flex items-center px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0052D9" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="white" strokeWidth="2"/>
                  <path d="M3 9h18" stroke="white" strokeWidth="2"/>
                  <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">纪念日日历</div>
                <div className="text-[10px] text-gray-400">记录每一个重要时刻</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-gray-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <div className="text-gray-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="19" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>

          {/* App Content */}
          <div className="overflow-hidden" style={{ height: "calc(100% - 90px)" }}>
            <CalendarApp />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center">
            <div className="w-32 h-1 bg-gray-800 rounded-full opacity-30" />
          </div>
        </div>

        {/* Dynamic Island */}
        <div
          className="absolute top-[14px] left-1/2 -translate-x-1/2 bg-black rounded-full z-10"
          style={{ width: 120, height: 34 }}
        />

        {/* Side buttons */}
        <div className="absolute left-[-3px] top-[120px] w-[3px] h-8 bg-gray-700 rounded-l-sm" />
        <div className="absolute left-[-3px] top-[166px] w-[3px] h-14 bg-gray-700 rounded-l-sm" />
        <div className="absolute left-[-3px] top-[226px] w-[3px] h-14 bg-gray-700 rounded-l-sm" />
        <div className="absolute right-[-3px] top-[180px] w-[3px] h-20 bg-gray-700 rounded-r-sm" />
      </div>

      {/* Label below phone */}
      <div className="absolute bottom-4 text-center text-gray-500 text-xs">
        纪念日日历 · 微信小程序
      </div>
    </div>
  );
}
