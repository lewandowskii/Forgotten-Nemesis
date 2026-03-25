import { Memory, CountdownResult, StorageResult, MemoryType } from '../types/index';

// 纪念日类型默认颜色配置
export const MEMORY_TYPE_COLORS = {
  anniversary: '#FF6B6B',  // 恋爱纪念日 - 红色
  birthday: '#FFD93D',    // 生日 - 黄色
  memory: '#4ECDC4',     // 纪念日 - 青色
  holiday: '#6BCB77'      // 节日 - 绿色
};

// 纪念日类型标签配置
export const MEMORY_TYPE_LABELS = {
  anniversary: '恋爱纪念日',
  birthday: '生日',
  memory: '纪念日',
  holiday: '节日'
};

const MEMORY_KEY = 'memories';

// 兼容旧数据的默认类型和颜色
const DEFAULT_MEMORY_TYPE = 'memory';
const DEFAULT_MEMORY_COLOR = MEMORY_TYPE_COLORS.memory;
const DEFAULT_REPEAT_YEARLY = true;

// 数据迁移：确保旧数据有type和color字段
function migrateMemory(memory: any): Memory {
  if (!memory.type) {
    memory.type = DEFAULT_MEMORY_TYPE;
  }
  if (!memory.color) {
    memory.color = MEMORY_TYPE_COLORS[memory.type] || DEFAULT_MEMORY_COLOR;
  }
  if (memory.repeatYearly === undefined) {
    memory.repeatYearly = DEFAULT_REPEAT_YEARLY;
  }
  // 新增：enableSpecialDays 字段迁移
  if (memory.enableSpecialDays === undefined) {
    memory.enableSpecialDays = false; // 默认不开启特殊日期提醒
  }
  // 新增：dateType 字段迁移
  if (!memory.dateType) {
    memory.dateType = 'solar'; // 旧数据默认为公历
  }
  // lunarDate 字段可选，不需要默认值
  
  return memory as Memory;
}

class MemoryStorage {
  static getMemories(): Memory[] {
    try {
      const memories = wx.getStorageSync(MEMORY_KEY);
      const parsed = memories ? JSON.parse(memories) : [];
      // 数据迁移：兼容旧数据
      return parsed.map(migrateMemory);
    } catch (e) {
      console.error('获取纪念日失败', e);
      return [];
    }
  }

  // 获取某日期的纪念日列表（用于日历显示）
  static getMemoriesForDate(dateStr: string): Memory[] {
    const memories = this.getMemories();
    const [year, month, day] = dateStr.split('-').map(Number);
    return memories.filter(memory => {
      const [m, d] = memory.targetDate.split('-').slice(1).map(Number);
      return m === month && d === day;
    });
  }

  static saveMemory(memory: Omit<Memory, 'id' | 'createTime'>): StorageResult<Memory> {
    try {
      const memories = this.getMemories();
      const newMemory: Memory = {
        ...memory,
        id: Date.now().toString(),
        createTime: new Date().toISOString()
      };
      memories.unshift(newMemory);
      wx.setStorageSync(MEMORY_KEY, JSON.stringify(memories));
      return newMemory;
    } catch (e) {
      console.error('保存纪念日失败', e);
      return null;
    }
  }

  static updateMemory(data: Partial<Memory> & { id: string }): StorageResult<Memory> {
    try {
      const memories = MemoryStorage.getMemories();
      const targetId = String(data.id);
      const index = memories.findIndex(item => String(item.id) === targetId);
      
      if (index !== -1) {
        // 保留原有的创建时间，更新其他字段
        memories[index] = { 
          ...memories[index], 
          ...data,
          // 确保 id 不会被覆盖（虽然理论上是一样的）
          id: data.id 
        };
        wx.setStorageSync('memories', JSON.stringify(memories));
        return memories[index];
      }
      console.error('更新失败：找不到ID', data.id, '当前列表ID:', memories.map(m => m.id));
      return null;
    } catch (e) {
      console.error('更新纪念日失败', e);
      return null;
    }
  }

  static deleteMemory(id: string): boolean {
    try {
      const memories = this.getMemories();
      const filteredMemories = memories.filter(item => item.id !== id);
      wx.setStorageSync(MEMORY_KEY, JSON.stringify(filteredMemories));
      return true;
    } catch (e) {
      console.error('删除纪念日失败', e);
      return false;
    }
  }

  static getMemory(id: string): StorageResult<Memory> {
    try {
      const memories = this.getMemories();
      return memories.find(item => item.id === id) || null;
    } catch (e) {
      console.error('获取纪念日详情失败', e);
      return null;
    }
  }
}

function calculateCountdown(targetDate: string): CountdownResult {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { expired: false, days, hours, minutes, seconds };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCountdown(countdown: CountdownResult, memory?: Memory): string {
  if (countdown.expired && memory?.repeatYearly) {
    // 对于循环纪念日，显示周年数
    const startDate = new Date(memory.targetDate);
    const now = new Date();
    const years = now.getFullYear() - startDate.getFullYear();
    if (years > 0) {
      return `第 ${years} 周年`;
    }
    return '已过期';
  }
  
  if (countdown.expired) {
    return '已过期';
  }
  
  if (countdown.days > 0) {
    return `还有 ${countdown.days} 天`;
  } else if (countdown.hours > 0) {
    return `还有 ${countdown.hours} 小时`;
  } else if (countdown.minutes > 0) {
    return `还有 ${countdown.minutes} 分钟`;
  } else {
    return '即将到来';
  }
}

function formatDateWithWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekDay}`;
}

export {
  MemoryStorage,
  calculateCountdown,
  formatDate,
  formatDateWithWeek,
  formatCountdown
};