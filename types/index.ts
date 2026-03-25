// 纪念日类型枚举
export type MemoryType = 'anniversary' | 'birthday' | 'memory' | 'holiday';

// 纪念日类型默认颜色配置
export const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  anniversary: '#FF6B6B',  // 恋爱纪念日 - 红色
  birthday: '#FFD93D',    // 生日 - 黄色
  memory: '#4ECDC4',     // 纪念日 - 青色
  holiday: '#6BCB77'      // 节日 - 绿色
};

// 纪念日类型标签配置
export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  anniversary: '恋爱纪念日',
  birthday: '生日',
  memory: '纪念日',
  holiday: '节日'
};

// 纪念日接口定义
export interface Memory {
  id: string;
  title: string;
  targetDate: string;           // 公历日期 (YYYY-MM-DD)
  dateType: 'solar' | 'lunar';  // 日期类型：公历/农历
  lunarDate?: {                 // 农历日期信息（当 dateType 为 lunar 时存储）
    year: number;               // 农历年份（首次设置年份）
    month: number;              // 农历月份 (1-12)
    day: number;                // 农历日 (1-30)
    isLeap: boolean;            // 是否闰月
  };
  type: MemoryType;             // 纪念日类型
  color: string;                // 自定义颜色
  description?: string;
  createTime?: string;
  formattedDate?: string;
  countdownText?: string;
  repeatYearly?: boolean;       // 是否每年重复
  enableSpecialDays?: boolean;  // 是否开启特殊日期提醒（仅恋爱纪念日）
}

// 特殊日期接口定义
export interface SpecialDay {
  date: string;               // 特殊日期 (YYYY-MM-DD)
  days: number;               // 第几天
  label: string;              // 标签描述 (如 "第99天"、"第100天")
  type: 'milestone' | 'hundred' | 'romantic'; // 特殊日期类型
  memoryId: string;           // 关联的纪念日ID
  memoryTitle: string;        // 纪念日标题
  color: string;              // 颜色
}

// 倒计时结果接口
export interface CountdownResult {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// 存储操作结果
export type StorageResult<T> = T | null;

// 页面数据接口
export interface HomePageData {
  memories: Memory[];
  enable: boolean;
}

export interface AddMemoryPageData {
  title: string;
  targetDate: string;
  description: string;
  minDate: string;
  maxDate: string;
}

// 农历日期选择器模式
export type DatePickerMode = 'solar' | 'lunar';

// 农历日期数据（用于选择器）
export interface LunarPickerData {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
}

// 农历年份选项
export interface LunarYearOption {
  value: number;
  label: string;
}

// 农历月份选项
export interface LunarMonthOption {
  value: number;
  label: string;
  isLeap: boolean;
}

// 农历日期选项
export interface LunarDayOption {
  value: number;
  label: string;
}