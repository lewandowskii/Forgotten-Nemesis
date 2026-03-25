import { SpecialDay, Memory } from '../types/index';

// 特殊日期配置
const MILESTONE_DAYS = [99, 1314]; // 里程碑日期
const ROMANTIC_DAYS = [1314, 520, 521]; // 浪漫数字日期

/**
 * 计算从起始日期开始，未来指定月份内的特殊日期
 * @param memory 纪念日对象
 * @param months 未来多少个月内（默认3个月）
 * @returns 特殊日期列表
 */
export function getUpcomingSpecialDays(memory: Memory, months: number = 3): SpecialDay[] {
  if (!memory.enableSpecialDays || memory.type !== 'anniversary') {
    return [];
  }

  const startDate = new Date(memory.targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + months);

  const specialDays: SpecialDay[] = [];

  // 计算从起始日期到今天已经过了多少天
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // 生成特殊日期
  // 1. 里程碑日期：99天、1314天
  MILESTONE_DAYS.forEach(days => {
    if (days > daysSinceStart) {
      const specialDate = new Date(startDate);
      specialDate.setDate(specialDate.getDate() + days);
      if (specialDate >= today && specialDate <= endDate) {
        specialDays.push(createSpecialDay(memory, days, specialDate, 'milestone'));
      }
    }
  });

  // 2. 每100天：100、200、300...直到超出范围
  let hundredDay = 100;
  while (true) {
    if (hundredDay > daysSinceStart) {
      const specialDate = new Date(startDate);
      specialDate.setDate(specialDate.getDate() + hundredDay);
      if (specialDate > endDate) break;
      if (specialDate >= today) {
        specialDays.push(createSpecialDay(memory, hundredDay, specialDate, 'hundred'));
      }
    }
    hundredDay += 100;
    // 安全限制：最多计算到10000天
    if (hundredDay > 10000) break;
  }

  // 3. 浪漫数字日期：520、521、1314天（如果还未添加）
  ROMANTIC_DAYS.forEach(days => {
    if (days > daysSinceStart && !MILESTONE_DAYS.includes(days)) {
      const specialDate = new Date(startDate);
      specialDate.setDate(specialDate.getDate() + days);
      if (specialDate >= today && specialDate <= endDate) {
        specialDays.push(createSpecialDay(memory, days, specialDate, 'romantic'));
      }
    }
  });

  // 按日期排序
  return specialDays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 获取所有纪念日的未来特殊日期（用于日历标记和即将到来列表）
 * @param memories 纪念日列表
 * @param months 未来多少个月内
 * @returns 特殊日期列表
 */
export function getAllUpcomingSpecialDays(memories: Memory[], months: number = 3): SpecialDay[] {
  const allSpecialDays: SpecialDay[] = [];

  memories.forEach(memory => {
    const specialDays = getUpcomingSpecialDays(memory, months);
    allSpecialDays.push(...specialDays);
  });

  // 按日期排序并去重
  return allSpecialDays.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 计算某个月份内的特殊日期（用于日历组件）
 * @param memories 纪念日列表
 * @param year 年份
 * @param month 月份（1-12）
 * @returns 特殊日期列表
 */
export function getSpecialDaysInMonth(memories: Memory[], year: number, month: number): SpecialDay[] {
  const allSpecialDays = getAllUpcomingSpecialDays(memories, 12); // 获取一年的数据

  return allSpecialDays.filter(sd => {
    const [y, m] = sd.date.split('-').map(Number);
    return y === year && m === month;
  });
}

/**
 * 创建特殊日期对象
 */
function createSpecialDay(
  memory: Memory,
  days: number,
  date: Date,
  type: 'milestone' | 'hundred' | 'romantic'
): SpecialDay {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let label = `第${days}天`;
  if (days === 99) label = '第99天 ❤️';
  else if (days === 520) label = '第520天 我爱你';
  else if (days === 521) label = '第521天 我愿意';
  else if (days === 1314) label = '第1314天 一生一世';

  return {
    date: `${year}-${month}-${day}`,
    days,
    label,
    type,
    memoryId: memory.id,
    memoryTitle: memory.title,
    color: memory.color
  };
}

/**
 * 计算从起始日期到今天已经过了多少天
 * @param targetDate 起始日期
 * @returns 天数
 */
export function getDaysSinceStart(targetDate: string): number {
  const startDate = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 判断某日期是否是特殊日期
 * @param dateStr 日期字符串 (YYYY-MM-DD)
 * @param specialDays 特殊日期列表
 * @returns 特殊日期对象或null
 */
export function findSpecialDay(dateStr: string, specialDays: SpecialDay[]): SpecialDay | null {
  return specialDays.find(sd => sd.date === dateStr) || null;
}
