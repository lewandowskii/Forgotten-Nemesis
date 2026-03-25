/**
 * 农历日期转换工具
 * 支持公历与农历双向转换、节气计算、节日识别
 * 数据范围: 1900-2100年
 */

// 农历数据表 (1900-2100年)
// 每个数据包含: 
// - 前12位: 12个月大小月 (1=30天, 0=29天)
// - 后4位: 闰月月份 (0表示无闰月)
// - 闰月大小月在第13位 (需要额外计算)
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

// 农历月份名称
const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

// 农历日期名称
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 生肖
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 二十四节气数据
const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
];

// 节气计算表 (1900年小寒至2100年)
const SOLAR_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
];

// 传统节日
const LUNAR_FESTIVALS: { [key: string]: string } = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕节',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
  '12-23': '小年',
  '12-30': '除夕'
};

// 公历节日
const SOLAR_FESTIVALS: { [key: string]: string } = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '3-12': '植树节',
  '4-1': '愚人节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '12-25': '圣诞节'
};

// 农历日期接口
export interface LunarDate {
  year: number;      // 农历年
  month: number;     // 农历月 (1-12)
  day: number;       // 农历日 (1-30)
  isLeap: boolean;   // 是否闰月
  yearGanZhi: string; // 年干支
  monthGanZhi: string; // 月干支
  dayGanZhi: string; // 日干支
  shengxiao: string; // 生肖
  monthName: string; // 月份名称
  dayName: string;   // 日期名称
}

// 日期详情接口
export interface DateDetail {
  solarDate: string;       // 公历日期 YYYY-MM-DD
  lunarDate: LunarDate;    // 农历日期
  solarTerm?: string;      // 节气
  lunarFestival?: string;  // 农历节日
  solarFestival?: string;  // 公历节日
}

/**
 * 获取农历年的总天数
 */
function getLunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

/**
 * 获取闰月月份 (0表示无闰月)
 */
function getLeapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

/**
 * 获取闰月天数
 */
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

/**
 * 获取农历月份天数
 */
function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 公历转农历
 */
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  // 参数校验
  if (year < 1900 || year > 2100) {
    throw new Error('年份超出范围(1900-2100)');
  }
  
  // 计算与1900年1月31日的天数差
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(year, month - 1, day);
  let offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
  
  // 计算农历年
  let lunarYear = 1900;
  let yearDays = 0;
  while (lunarYear < 2101 && offset > 0) {
    yearDays = getLunarYearDays(lunarYear);
    offset -= yearDays;
    lunarYear++;
  }
  
  if (offset < 0) {
    offset += yearDays;
    lunarYear--;
  }
  
  // 计算农历月
  let lunarMonth = 1;
  let leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let monthDays = 0;
  
  while (lunarMonth < 13 && offset > 0) {
    // 闰月
    if (leapMonth > 0 && lunarMonth === (leapMonth + 1) && !isLeap) {
      lunarMonth--;
      isLeap = true;
      monthDays = getLeapMonthDays(lunarYear);
    } else {
      monthDays = getLunarMonthDays(lunarYear, lunarMonth);
    }
    
    if (isLeap && lunarMonth === (leapMonth + 1)) {
      isLeap = false;
    }
    
    offset -= monthDays;
    
    if (!isLeap) {
      lunarMonth++;
    }
  }
  
  if (offset < 0) {
    offset += monthDays;
    lunarMonth--;
  }
  
  // 处理闰月标记
  if (leapMonth > 0 && lunarMonth === leapMonth + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
    }
  }
  
  const lunarDay = offset + 1;
  
  // 计算干支
  const yearGanZhi = getYearGanZhi(lunarYear);
  const monthGanZhi = getMonthGanZhi(lunarYear, lunarMonth);
  const dayGanZhi = getDayGanZhi(year, month, day);
  const shengxiao = getShengXiao(lunarYear);
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeap,
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    shengxiao,
    monthName: (isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[lunarMonth - 1] + '月',
    dayName: LUNAR_DAY_NAMES[lunarDay - 1]
  };
}

/**
 * 农历转公历
 */
export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean = false): { year: number; month: number; day: number } {
  // 参数校验
  if (lunarYear < 1900 || lunarYear > 2100) {
    throw new Error('年份超出范围(1900-2100)');
  }
  
  const leapMonth = getLeapMonth(lunarYear);
  
  // 检查闰月是否有效
  if (isLeap && lunarMonth !== leapMonth) {
    isLeap = false;
  }
  
  // 计算距离1900年1月31日的天数
  let offset = 0;
  
  // 累加年份天数
  for (let i = 1900; i < lunarYear; i++) {
    offset += getLunarYearDays(i);
  }
  
  // 累加月份天数
  for (let i = 1; i < lunarMonth; i++) {
    offset += getLunarMonthDays(lunarYear, i);
    if (i === leapMonth) {
      offset += getLeapMonthDays(lunarYear);
    }
  }
  
  // 如果是闰月，还需加上正常月的天数
  if (isLeap) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }
  
  // 加上当月天数
  offset += lunarDay - 1;
  
  // 计算公历日期
  const baseDate = new Date(1900, 0, 31);
  baseDate.setDate(baseDate.getDate() + offset);
  
  return {
    year: baseDate.getFullYear(),
    month: baseDate.getMonth() + 1,
    day: baseDate.getDate()
  };
}

/**
 * 获取年干支
 */
function getYearGanZhi(year: number): string {
  const ganIndex = (year - 4) % 10;
  const zhiIndex = (year - 4) % 12;
  return TIAN_GAN[ganIndex >= 0 ? ganIndex : ganIndex + 10] + DI_ZHI[zhiIndex >= 0 ? zhiIndex : zhiIndex + 12];
}

/**
 * 获取月干支
 */
function getMonthGanZhi(year: number, month: number): string {
  const ganIndex = (year % 5 * 2 + month - 2) % 10;
  const zhiIndex = (month + 1) % 12;
  return TIAN_GAN[ganIndex >= 0 ? ganIndex : ganIndex + 10] + DI_ZHI[zhiIndex >= 0 ? zhiIndex : zhiIndex + 12];
}

/**
 * 获取日干支
 */
function getDayGanZhi(year: number, month: number, day: number): string {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000) + 10;
  
  const ganIndex = offset % 10;
  const zhiIndex = offset % 12;
  
  return TIAN_GAN[ganIndex >= 0 ? ganIndex : ganIndex + 10] + DI_ZHI[zhiIndex >= 0 ? zhiIndex : zhiIndex + 12];
}

/**
 * 获取生肖
 */
function getShengXiao(year: number): string {
  const index = (year - 4) % 12;
  return SHENG_XIAO[index >= 0 ? index : index + 12];
}

/**
 * 获取节气
 */
export function getSolarTerm(year: number, month: number, day: number): string | undefined {
  const baseDate = new Date(1900, 0, 6, 2, 5, 0);
  
  for (let i = (month - 1) * 2; i < month * 2; i++) {
    const termDate = new Date(baseDate.getTime() + SOLAR_TERM_INFO[i] * 60000);
    const termYear = termDate.getFullYear();
    
    if (termYear === year) {
      const termMonth = termDate.getMonth() + 1;
      const termDay = termDate.getDate();
      
      if (termMonth === month && termDay === day) {
        return SOLAR_TERMS[i];
      }
    }
  }
  
  return undefined;
}

/**
 * 获取农历节日
 */
export function getLunarFestival(lunarMonth: number, lunarDay: number): string | undefined {
  // 除夕特殊处理 (腊月最后一天)
  if (lunarMonth === 12) {
    const year = new Date().getFullYear();
    const lastDay = getLunarMonthDays(year, 12);
    if (lunarDay === lastDay) {
      return '除夕';
    }
  }
  
  return LUNAR_FESTIVALS[`${lunarMonth}-${lunarDay}`];
}

/**
 * 获取公历节日
 */
export function getSolarFestival(month: number, day: number): string | undefined {
  return SOLAR_FESTIVALS[`${month}-${day}`];
}

/**
 * 获取完整日期详情
 */
export function getDateDetail(year: number, month: number, day: number): DateDetail {
  const lunarDate = solarToLunar(year, month, day);
  const solarTerm = getSolarTerm(year, month, day);
  const lunarFestival = getLunarFestival(lunarDate.month, lunarDate.day);
  const solarFestival = getSolarFestival(month, day);
  
  return {
    solarDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    lunarDate,
    solarTerm,
    lunarFestival,
    solarFestival
  };
}

/**
 * 格式化农历日期显示
 */
export function formatLunarDate(lunarDate: LunarDate): string {
  const parts: string[] = [];
  
  parts.push(`${lunarDate.year}年`);
  parts.push(lunarDate.monthName);
  parts.push(lunarDate.dayName);
  
  return parts.join('');
}

/**
 * 格式化农历日期显示（简化版，用于纪念日显示）
 * @param lunarDate 农历日期信息
 * @param showYear 是否显示年份
 */
export function formatLunarDateSimple(
  lunarDate: { month: number; day: number; isLeap: boolean; year?: number },
  showYear: boolean = false
): string {
  const parts: string[] = [];
  
  if (showYear && lunarDate.year) {
    parts.push(`${lunarDate.year}年`);
  }
  
  // 月份名称
  const monthName = (lunarDate.isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[lunarDate.month - 1] + '月';
  parts.push(monthName);
  
  // 日期名称
  const dayName = LUNAR_DAY_NAMES[lunarDate.day - 1];
  parts.push(dayName);
  
  return parts.join('');
}

/**
 * 获取农历年份列表
 */
export function getLunarYearRange(startYear: number = 1900, endYear: number = 2100): number[] {
  const years: number[] = [];
  for (let i = startYear; i <= endYear; i++) {
    years.push(i);
  }
  return years;
}

/**
 * 获取农历月份列表
 */
export function getLunarMonths(year: number, isLeap: boolean = false): { value: number; label: string; isLeap: boolean }[] {
  const months: { value: number; label: string; isLeap: boolean }[] = [];
  const leapMonth = getLeapMonth(year);
  
  for (let i = 1; i <= 12; i++) {
    months.push({
      value: i,
      label: LUNAR_MONTH_NAMES[i - 1] + '月',
      isLeap: false
    });
    
    // 如果是闰月年，在对应月份后添加闰月选项
    if (leapMonth > 0 && i === leapMonth) {
      months.push({
        value: i,
        label: '闰' + LUNAR_MONTH_NAMES[i - 1] + '月',
        isLeap: true
      });
    }
  }
  
  return months;
}

/**
 * 获取农历日期列表
 */
export function getLunarDays(year: number, month: number, isLeap: boolean = false): number[] {
  const days: number[] = [];
  let dayCount: number;
  
  if (isLeap) {
    dayCount = getLeapMonthDays(year);
  } else {
    dayCount = getLunarMonthDays(year, month);
  }
  
  for (let i = 1; i <= dayCount; i++) {
    days.push(i);
  }
  
  return days;
}

/**
 * 验证农历日期是否有效
 */
export function isValidLunarDate(year: number, month: number, day: number, isLeap: boolean = false): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  
  const leapMonth = getLeapMonth(year);
  if (isLeap && month !== leapMonth) return false;
  
  const maxDay = isLeap ? getLeapMonthDays(year) : getLunarMonthDays(year, month);
  if (day > maxDay) return false;
  
  return true;
}

/**
 * 获取农历日期的下一次出现对应的公历日期
 * 用于农历纪念日的循环提醒计算
 * 
 * @param lunarMonth 农历月份 (1-12)
 * @param lunarDay 农历日 (1-30)
 * @param isLeap 是否闰月
 * @param fromDate 起始日期（可选，默认为今天）
 * @returns 公历日期字符串 (YYYY-MM-DD)
 */
export function getNextLunarOccurrence(
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean = false,
  fromDate?: Date
): string {
  const today = fromDate || new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentYear = today.getFullYear();
  
  // 尝试今年
  let solarDate = tryConvertLunarToSolar(currentYear, lunarMonth, lunarDay, isLeap);
  
  if (solarDate) {
    const solarDateObj = new Date(solarDate.year, solarDate.month - 1, solarDate.day);
    
    // 如果今年的日期还没到，返回今年的
    if (solarDateObj >= today) {
      return formatSolarDate(solarDate.year, solarDate.month, solarDate.day);
    }
  }
  
  // 如果今年已经过了或转换失败，尝试明年
  const nextYear = currentYear + 1;
  solarDate = tryConvertLunarToSolar(nextYear, lunarMonth, lunarDay, isLeap);
  
  if (solarDate) {
    return formatSolarDate(solarDate.year, solarDate.month, solarDate.day);
  }
  
  // 如果明年也转换失败（可能闰月不存在），尝试后年
  const yearAfterNext = currentYear + 2;
  solarDate = tryConvertLunarToSolar(yearAfterNext, lunarMonth, lunarDay, false);
  
  if (solarDate) {
    return formatSolarDate(solarDate.year, solarDate.month, solarDate.day);
  }
  
  // 理论上不应该到达这里
  throw new Error('无法计算农历日期的下一次出现');
}

/**
 * 尝试将农历日期转换为公历日期
 * 如果闰月不存在，则尝试非闰月
 */
function tryConvertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeap: boolean
): { year: number; month: number; day: number } | null {
  try {
    // 检查是否是有效的闰月
    if (isLeap) {
      const leapMonth = getLeapMonth(year);
      if (month !== leapMonth) {
        // 该年没有这个闰月，尝试非闰月
        return lunarToSolar(year, month, day, false);
      }
    }
    
    return lunarToSolar(year, month, day, isLeap);
  } catch (error) {
    return null;
  }
}

/**
 * 格式化公历日期为字符串
 */
function formatSolarDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 导出格式化函数
export { LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES, TIAN_GAN, DI_ZHI, SHENG_XIAO };
