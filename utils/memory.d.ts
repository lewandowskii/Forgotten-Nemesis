export { MemoryStorage, calculateCountdown, formatDate, formatDateWithWeek, formatCountdown } from './memory';

// 类型定义
export interface Memory {
  id: string;
  title: string;
  targetDate: string;
  description?: string;
  createTime?: string;
  formattedDate?: string;
  countdownText?: string;
}

export interface CountdownResult {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type StorageResult<T> = T | null;