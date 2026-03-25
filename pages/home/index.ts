import Message from 'tdesign-miniprogram/message/index';
import { MemoryStorage, calculateCountdown, formatCountdown, formatDateWithWeek, MEMORY_TYPE_LABELS, MEMORY_TYPE_COLORS } from '../../utils/memory';
import { getAllUpcomingSpecialDays, getUpcomingSpecialDays } from '../../utils/special-days';
import CloudMemorySync from '../../utils/cloud-memory';
import { getNextLunarOccurrence, formatLunarDateSimple } from '../../utils/lunar';

// 订阅消息模板ID
const REMINDER_TEMPLATE_ID = 'ntchK9KrNfMPPikvRFz8xWDzv8WrSujxh0Ka0XCoGds';

Page({
  data: {
    memories: [],
    upcomingMemories: [],
    groupedUpcoming: [],
    enable: false,
    syncStatus: null,
    activeTab: 'calendar',
    showLunar: false,  // 农历显示开关
    renewalReminders: [] as any[],  // 需要重新授权的纪念日
    showRenewalTip: false  // 是否显示续订提示
  },

  onLoad() {
    this.loadShowLunarSetting();  // 加载农历显示设置
    this.loadMemories();
    this.startTimer();
    this.initAutoSync();
  },

  onShow() {
    this.loadMemories();
    this.updateSyncStatus();
    this.checkRenewalReminders();  // 检查需要续订的提醒
  },

  // 加载农历显示设置
  loadShowLunarSetting() {
    const showLunar = wx.getStorageSync('showLunar') || false;
    this.setData({ showLunar });
  },

  // 切换农历显示
  onToggleLunar() {
    const showLunar = !this.data.showLunar;
    this.setData({ showLunar });
    wx.setStorageSync('showLunar', showLunar);
  },

  onUnload() {
    if ((this as any).timer) {
      clearInterval((this as any).timer);
    }
  },

  loadMemories() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const memories = MemoryStorage.getMemories().map(memory => {
      // 对于循环纪念日，计算倒计时
      const countdownResult = calculateCountdown(memory.targetDate);

      // 计算周年数
      let years: number | null = null;
      if (memory.repeatYearly && memory.targetDate) {
        const startYear = parseInt(memory.targetDate.split('-')[0]);
        years = today.getFullYear() - startYear;
      }

      // 根据日期类型格式化显示日期
      let formattedDate: string;
      if (memory.dateType === 'lunar' && memory.lunarDate) {
        // 农历纪念日：显示农历日期
        formattedDate = formatLunarDateSimple(memory.lunarDate, true);
      } else {
        // 公历纪念日：显示公历日期
        formattedDate = formatDateWithWeek(memory.targetDate);
      }

      return {
        ...memory,
        formattedDate,
        countdownText: formatCountdown(countdownResult, memory),
        years,
        typeLabel: MEMORY_TYPE_LABELS[memory.type] || '纪念日',
        typeIcon: this.getTypeIcon(memory.type)
      };
    });
    this.setData({ memories });
    this.updateUpcomingMemories(memories);
  },

  // 更新即将到来的纪念日列表
  updateUpcomingMemories(memories: any[]) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 计算普通纪念日的下一日期
    const upcomingMemories = memories
      .map((memory) => {
        let nextDate = memory.targetDate;
        
        // 如果是循环纪念日
        if (memory.repeatYearly) {
          // 判断是否是农历纪念日
          if (memory.dateType === 'lunar' && memory.lunarDate) {
            // 农历纪念日：每年动态计算对应公历日期
            try {
              nextDate = getNextLunarOccurrence(
                memory.lunarDate.month,
                memory.lunarDate.day,
                memory.lunarDate.isLeap
              );
            } catch (error) {
              console.error('农历日期计算失败:', error);
              // 失败时使用 targetDate
              nextDate = memory.targetDate;
            }
          } else {
            // 公历纪念日：使用原有逻辑
            const [y, m, d] = memory.targetDate.split('-').map(Number);
            const thisYear = today.getFullYear();
            let candidate = `${thisYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (candidate < todayStr) {
              candidate = `${thisYear + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
            nextDate = candidate;
          }
        }
        
        return { ...memory, nextDate, isSpecialDay: false };
      })
      .filter((memory) => memory.nextDate >= todayStr);

    // 计算特殊日期（未来3个月）
    const specialDays = getAllUpcomingSpecialDays(memories, 3).map(sd => ({
      id: `special-${sd.date}-${sd.days}`,
      title: `${sd.memoryTitle} - ${sd.label}`,
      targetDate: sd.date,
      nextDate: sd.date,
      type: 'anniversary' as const,
      color: sd.color,
      typeLabel: sd.label,
      typeIcon: sd.days === 1314 ? '💑' : (sd.days === 99 ? '💕' : '❤️'),
      isSpecialDay: true,
      specialDays: sd.days,
      memoryId: sd.memoryId,
      formattedDate: formatDateWithWeek(sd.date),
      daysText: this.getSpecialDaysText(sd.date, today),
      daysClass: this.getSpecialDaysClass(sd.date, today)
    }));

    // 合并并按日期排序
    const allUpcoming = [...upcomingMemories, ...specialDays]
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));

    // 按月份分组
    const grouped: any[] = [];
    const monthMap = new Map();

    allUpcoming.forEach((item) => {
      const [y, m] = item.nextDate.split('-');
      const monthKey = `${y}年${parseInt(m)}月`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey).push(item);
    });

    monthMap.forEach((items: any[], month: string) => {
      grouped.push({
        month,
        memories: items.map((item: any) => {
          // 特殊日期已经格式化好了
          if (item.isSpecialDay) {
            return item;
          }

          // 普通纪念日的格式化
          const daysDiff = Math.ceil((new Date(item.nextDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isToday = daysDiff === 0;
          const isTomorrow = daysDiff === 1;

          let daysText = `${daysDiff}天后`;
          let daysClass = 'days-normal';

          if (isToday) {
            daysText = '今天';
            daysClass = 'days-today';
          } else if (isTomorrow) {
            daysText = '明天';
            daysClass = 'days-tomorrow';
          } else if (daysDiff <= 7) {
            daysClass = 'days-soon';
          }

          let years: number | null = null;
          if (item.repeatYearly && item.targetDate) {
            const startYear = parseInt(item.targetDate.split('-')[0]);
            const nextYear = parseInt(item.nextDate.split('-')[0]);
            years = nextYear - startYear;
          }

          // 根据日期类型格式化显示日期
          let formattedDate: string;
          if (item.dateType === 'lunar' && item.lunarDate) {
            // 农历纪念日：显示农历日期（下次发生的年份）
            formattedDate = formatLunarDateSimple(
              { ...item.lunarDate, year: parseInt(item.nextDate.split('-')[0]) },
              true
            );
          } else {
            // 公历纪念日：显示公历日期
            formattedDate = formatDateWithWeek(item.nextDate);
          }

          return {
            ...item,
            formattedDate,
            daysText,
            daysClass,
            years,
            typeLabel: MEMORY_TYPE_LABELS[item.type] || '纪念日',
            typeIcon: this.getTypeIcon(item.type)
          };
        })
      });
    });

    this.setData({
      upcomingMemories: allUpcoming,
      groupedUpcoming: grouped
    });
  },

  // 获取特殊日期的天数文本
  getSpecialDaysText(dateStr: string, today: Date): string {
    const targetDate = new Date(dateStr);
    const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return '今天';
    if (daysDiff === 1) return '明天';
    return `${daysDiff}天后`;
  },

  // 获取特殊日期的样式类
  getSpecialDaysClass(dateStr: string, today: Date): string {
    const targetDate = new Date(dateStr);
    const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'days-today';
    if (daysDiff === 1) return 'days-tomorrow';
    if (daysDiff <= 7) return 'days-soon';
    return 'days-special';
  },

  getTypeIcon(type) {
    const icons = {
      anniversary: '❤️',
      birthday: '🎂',
      memory: '📝',
      holiday: '🎉'
    };
    return icons[type] || '📅';
  },

  startTimer() {
    (this as any).timer = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  },

  updateCountdowns() {
    const { memories } = this.data;
    const updatedMemories = memories.map((memory: any) => {
      const countdownResult = calculateCountdown(memory.targetDate);
      return {
        ...memory,
        countdownText: formatCountdown(countdownResult, memory)
      };
    });
    this.setData({ memories: updatedMemories });
  },

  onRefresh() {
    this.setData({ enable: true });
    setTimeout(() => {
      this.loadMemories();
      this.setData({ enable: false });
    }, 1000);
  },

  // Tab 切换
  onTabChange(e: any) {
    const { value } = e.detail;
    this.setData({ activeTab: value });
  },

  goAddMemory() {
    wx.switchTab({
      url: '/pages/add-memory/index'
    });
  },

  onEditMemory(e: any) {
    const { id } = e.currentTarget.dataset;
    const memory = this.data.memories.find((item: any) => item.id == id); // 使用宽松相等
    if (memory) {
      wx.setStorageSync('editMemory', memory);
      wx.switchTab({
        url: '/pages/add-memory/index'
      });
    } else {
        console.error('未找到纪念日数据', id);
    }
  },

  onDeleteMemory(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这个纪念日吗？',
      success: (res) => {
        if (res.confirm) {
          MemoryStorage.deleteMemory(id);
          this.loadMemories();
          Message.success({
            context: this,
            offset: [120, 32],
            duration: 2000,
            content: '删除成功',
          });
        }
      },
    });
  },

  // 初始化自动同步
  async initAutoSync() {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      // 执行自动同步
      await CloudMemorySync.autoSync();
      this.updateSyncStatus();
    }
  },

  // 更新同步状态
  updateSyncStatus() {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      this.setData({
        syncStatus: CloudMemorySync.getSyncStatus()
      });
    } else {
      this.setData({
        syncStatus: {
          status: 'offline',
          text: '未登录',
          color: '#999'
        }
      });
    }
  },

  // 手动同步
  async onManualSync() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '数据同步',
      content: '是否执行数据同步？这将同步您的纪念日数据到云端。',
      success: async (res) => {
        if (res.confirm) {
          const result = await CloudMemorySync.bidirectionalSync();
          if (result.success) {
            this.loadMemories();
            this.updateSyncStatus();
          }
        }
      }
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？退出后数据将保留在本地。',
      success: (res) => {
        if (res.confirm) {
          const AuthAPI = require('../../utils/auth').AuthAPI;
          AuthAPI.logout();
        }
      }
    });
  },

  // 日历选择日期
  onCalendarSelect(e: any) {
    const { date } = e.detail;
    // 可选：筛选显示选中日期的纪念日
    console.log('选中日期:', date);
  },

  // 检查需要续订的提醒
  async checkRenewalReminders() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    try {
      // 调用云函数获取即将到来的纪念日提醒
      const res = await wx.cloud.callFunction({
        name: 'subscribe',
        data: {
          action: 'getUpcomingReminders',
          days: 7  // 检查未来7天的纪念日
        }
      }) as any;

      if (res.result && res.result.success) {
        // 筛选出需要续订的纪念日
        const renewalReminders = res.result.data.filter((item: any) => item.needRenew);
        
        this.setData({
          renewalReminders,
          showRenewalTip: renewalReminders.length > 0
        });

        console.log('需要续订的提醒:', renewalReminders);
      }
    } catch (error) {
      console.error('检查续订提醒失败:', error);
    }
  },

  // 关闭续订提示
  onCloseRenewalTip() {
    this.setData({ showRenewalTip: false });
  },

  // 重新授权订阅
  onRenewSubscription(e: any) {
    const { memory } = e.currentTarget.dataset;
    const memoryId = memory._id || memory.id;

    wx.requestSubscribeMessage({
      tmplIds: [REMINDER_TEMPLATE_ID],
      success: (res) => {
        console.log('续订授权结果:', res);
        
        if (res[REMINDER_TEMPLATE_ID] === 'accept') {
          // 保存新的订阅记录
          this.saveRenewalSubscription(memoryId);
        } else if (res[REMINDER_TEMPLATE_ID] === 'reject') {
          Message.warning({
            context: this,
            offset: [120, 32],
            duration: 2000,
            content: '您已拒绝订阅提醒',
          });
        }
      },
      fail: (err) => {
        console.error('续订授权失败:', err);
      }
    });
  },

  // 保存续订记录
  async saveRenewalSubscription(memoryId: string) {
    try {
      await wx.cloud.callFunction({
        name: 'subscribe',
        data: {
          action: 'saveSubscription',
          memoryId: memoryId,
          templateId: REMINDER_TEMPLATE_ID
        }
      });

      Message.success({
        context: this,
        offset: [120, 32],
        duration: 2000,
        content: '续订成功',
      });

      // 重新检查续订提醒
      this.checkRenewalReminders();
    } catch (error) {
      console.error('保存续订记录失败:', error);
      Message.error({
        context: this,
        offset: [120, 32],
        duration: 2000,
        content: '续订失败，请重试',
      });
    }
  },

  // 一键续订所有提醒
  async onRenewAllSubscriptions() {
    const { renewalReminders } = this.data;
    
    wx.requestSubscribeMessage({
      tmplIds: [REMINDER_TEMPLATE_ID],
      success: async (res) => {
        console.log('批量续订授权结果:', res);
        
        if (res[REMINDER_TEMPLATE_ID] === 'accept') {
          // 显示加载提示
          wx.showLoading({ title: '保存中...', mask: true });

          // 批量保存订阅记录
          const promises = renewalReminders.map(async (item) => {
            const memoryId = item.memory._id || item.memory.id;
            try {
              await wx.cloud.callFunction({
                name: 'subscribe',
                data: {
                  action: 'saveSubscription',
                  memoryId: memoryId,
                  templateId: REMINDER_TEMPLATE_ID
                }
              });
              return { success: true, title: item.memory.title };
            } catch (error) {
              console.error('保存续订记录失败:', item.memory.title, error);
              return { success: false, title: item.memory.title, error };
            }
          });

          await Promise.all(promises);
          wx.hideLoading();

          Message.success({
            context: this,
            offset: [120, 32],
            duration: 2000,
            content: `已续订 ${renewalReminders.length} 个提醒`,
          });

          // 等待一小段时间让云数据库同步
          setTimeout(() => {
            this.checkRenewalReminders();
          }, 500);
        } else if (res[REMINDER_TEMPLATE_ID] === 'reject') {
          Message.warning({
            context: this,
            offset: [120, 32],
            duration: 2000,
            content: '您已拒绝订阅提醒',
          });
        }
      },
      fail: (err) => {
        console.error('批量续订授权失败:', err);
      }
    });
  }
});