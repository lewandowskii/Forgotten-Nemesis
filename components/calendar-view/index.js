const { getSpecialDaysInMonth } = require('../../utils/special-days');
const { solarToLunar, LUNAR_DAY_NAMES, getNextLunarOccurrence } = require('../../utils/lunar');

Component({
  properties: {
    memories: {
      type: Array,
      value: []
    },
    selectedDate: {
      type: String,
      value: ''
    },
    showLunar: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentYear: 2026,
    currentMonth: 3,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    today: '',
    inMonthMemoryDates: [], // 当月内的纪念日日期
    upcomingDates: [], // 30天内即将到来的纪念日日期
    specialDates: [] // 特殊日期列表
  },

  lifetimes: {
    attached() {
      this.initToday();
      this.generateCalendar();
    }
  },

  observers: {
    'memories, showLunar': function() {
      this.calculateInMonthMemoryDates();
      this.calculateUpcomingDates();
      this.calculateSpecialDates();
      this.generateCalendar();
    }
  },

  methods: {
    initToday() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      this.setData({
        currentYear: year,
        currentMonth: parseInt(month),
        today: todayStr,
        selectedDate: todayStr
      });
    },

    generateCalendar() {
      const { currentYear, currentMonth, today, inMonthMemoryDates, upcomingDates, specialDates, showLunar } = this.data;
      const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const days = [];
      // 填充空白
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }
      // 填充日期
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const specialDate = specialDates.find(sd => sd.date === dateStr);
        
        // 计算农历日期
        let lunarText = '';
        if (showLunar) {
          try {
            const lunarDate = solarToLunar(currentYear, currentMonth, d);
            // 只显示日期部分，简化显示（如"初一"、"十五"）
            lunarText = lunarDate.dayName;
            // 如果是初一，显示月份（如"正月"、"腊月"）
            if (lunarDate.day === 1) {
              lunarText = lunarDate.monthName;
            }
          } catch (e) {
            console.error('农历计算失败:', e);
          }
        }
        
        // 判断标记类型
        const isInMonthMemory = inMonthMemoryDates.includes(dateStr);
        const isUpcoming = upcomingDates.includes(dateStr);
        
        days.push({
          day: d,
          dateStr,
          isToday: dateStr === today,
          isSelected: dateStr === this.data.selectedDate,
          isInMonthMemory, // 当月内的纪念日
          isUpcoming, // 30天内即将到来的纪念日
          isSpecial: !!specialDate,
          specialInfo: specialDate,
          lunarText
        });
      }

      this.setData({ calendarDays: days });
    },

    onPrevMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
      } else {
        currentMonth--;
      }
      this.setData({ currentYear, currentMonth });
      this.calculateInMonthMemoryDates();
      this.calculateSpecialDates();
      this.generateCalendar();
    },

    onNextMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
      } else {
        currentMonth++;
      }
      this.setData({ currentYear, currentMonth });
      this.calculateInMonthMemoryDates();
      this.calculateSpecialDates();
      this.generateCalendar();
    },

    onSelectDate(e) {
      const dateStr = e.currentTarget.dataset.date;
      if (!dateStr) return;
      
      const calendarDays = this.data.calendarDays.map(day => {
        if (!day) return day;
        return {
          ...day,
          isSelected: day.dateStr === dateStr
        };
      });
      
      this.setData({ 
        selectedDate: dateStr,
        calendarDays 
      });
      
      this.triggerEvent('select', { date: dateStr });
    },

    // 获取某日期的纪念日
    getMemoriesForDate(dateStr) {
      const { memories } = this.data;
      if (!memories || !dateStr) return [];
      
      const [, month, day] = dateStr.split('-').map(Number);
      return memories.filter(memory => {
        const [, m, d] = memory.targetDate.split('-').slice(1).map(Number);
        return m === month && d === day;
      });
    },

    // 计算当月内的所有纪念日日期
    calculateInMonthMemoryDates() {
      const { memories, currentYear, currentMonth, today } = this.data;
      if (!memories || !today) return;

      const inMonthDateSet = new Set();

      memories.forEach(memory => {
        if (memory.dateType === 'lunar' && memory.lunarDate) {
          // 农历纪念日：计算当年该农历日期对应的公历日期
          try {
            const solarDate = getNextLunarOccurrence(
              memory.lunarDate.month,
              memory.lunarDate.day,
              memory.lunarDate.isLeap,
              new Date(currentYear, 0, 1) // 从年初开始计算
            );
            // 检查是否在当前月份
            const [y, m] = solarDate.split('-').map(Number);
            if (y === currentYear && m === currentMonth) {
              inMonthDateSet.add(solarDate);
            }
          } catch (error) {
            console.error('农历日期计算失败:', error);
          }
        } else {
          // 公历纪念日：检查是否在当前月份
          const [, m, d] = memory.targetDate.split('-').map(Number);
          // 当月内的纪念日（使用当前年份）
          const thisYearDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (m === currentMonth) {
            inMonthDateSet.add(thisYearDate);
          }
        }
      });

      this.setData({
        inMonthMemoryDates: Array.from(inMonthDateSet)
      });
    },

    // 计算即将到来的纪念日日期（30天内）
    calculateUpcomingDates() {
      const { memories, today } = this.data;
      if (!memories || !today) return;

      const todayDate = new Date(today);
      const upcomingDateSet = new Set();

      // 收集所有即将到来的日期（30天内）
      memories.forEach(memory => {
        let nextDate = memory.targetDate;

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
            const thisYear = todayDate.getFullYear();
            let candidate = `${thisYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (candidate < today) {
              candidate = `${thisYear + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
            nextDate = candidate;
          }
        }

        const diffDays = Math.ceil((new Date(nextDate).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
          upcomingDateSet.add(nextDate);
        }
      });

      this.setData({
        upcomingDates: Array.from(upcomingDateSet)
      });
    },

    // 计算当前月份的特殊日期
    calculateSpecialDates() {
      const { memories, currentYear, currentMonth } = this.data;
      if (!memories || memories.length === 0) return;

      const specialDates = getSpecialDaysInMonth(memories, currentYear, currentMonth);
      this.setData({ specialDates });
    }
  }
});
