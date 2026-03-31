import Message from "tdesign-miniprogram/message/index";
import { MemoryStorage } from "../../utils/memory";
import CloudMemorySync from "../../utils/cloud-memory";
import {
  MemoryType,
  MEMORY_TYPE_COLORS,
  MEMORY_TYPE_LABELS,
  DatePickerMode,
} from "../../types/index";
import {
  solarToLunar,
  lunarToSolar,
  getLunarYearRange,
  getLunarMonths,
  getLunarDays,
  formatLunarDate,
  getDateDetail,
  LUNAR_DAY_NAMES,
} from "../../utils/lunar";

// 订阅消息模板ID
const REMINDER_TEMPLATE_ID = "ntchK9KrNfMPPikvRFz8xWDzv8WrSujxh0Ka0XCoGds";

Page({
  data: {
    memoryId: "", // 编辑模式下的纪念日 ID
    title: "",
    targetDate: "",
    description: "",
    minDate: "",
    maxDate: "",
    dateError: "",
    // 类型选择
    typeOptions: [
      {
        value: "anniversary" as MemoryType,
        label: MEMORY_TYPE_LABELS.anniversary,
        color: MEMORY_TYPE_COLORS.anniversary,
      },
      {
        value: "birthday" as MemoryType,
        label: MEMORY_TYPE_LABELS.birthday,
        color: MEMORY_TYPE_COLORS.birthday,
      },
      {
        value: "memory" as MemoryType,
        label: MEMORY_TYPE_LABELS.memory,
        color: MEMORY_TYPE_COLORS.memory,
      },
      {
        value: "holiday" as MemoryType,
        label: MEMORY_TYPE_LABELS.holiday,
        color: MEMORY_TYPE_COLORS.holiday,
      },
    ],
    currentType: "memory" as MemoryType,
    // 颜色选择
    colorOptions: [
      "#FF6B6B",
      "#FFD93D",
      "#4ECDC4",
      "#6BCB77",
      "#0052D9",
      "#9B59B6",
      "#E67E22",
      "#1ABC9C",
    ],
    currentColor: MEMORY_TYPE_COLORS.memory,
    // 特殊日期提醒开关
    enableSpecialDays: false,
    // 纪念日提醒开关
    enableReminder: true,
    // 农历相关
    dateMode: "solar" as DatePickerMode,
    lunarDateStr: "",
    festivalHint: "",
    // 农历选择器数据
    lunarYearOptions: [] as { value: number; label: string }[],
    lunarMonthOptions: [] as {
      value: number;
      label: string;
      isLeap: boolean;
    }[],
    lunarDayOptions: [] as { value: number; label: string }[],
    lunarYearIndex: 0,
    lunarMonthIndex: 0,
    lunarDayIndex: 0,
    // 当前选择的农历数据
    currentLunarYear: 2024,
    currentLunarMonth: 1,
    currentLunarDay: 1,
    currentIsLeap: false,
  },

  onLoad() {
    this.resetForm();
  },

  onShow() {
    // 检查是否有待编辑的纪念日数据
    const editMemory = wx.getStorageSync("editMemory");
    if (editMemory) {
      this.initEditForm(editMemory);
      wx.removeStorageSync("editMemory"); // 使用后清除
    } else {
      this.resetForm();
    }
  },

  initEditForm(memory: any) {
    this.initDateRange();

    // 初始化农历选择器数据
    const today = new Date();
    const years = getLunarYearRange(1900, 2100);
    const lunarYearOptions = years.map((y: number) => ({
      value: y,
      label: `${y}年`,
    }));

    // 设置基础数据
    const updates: any = {
      memoryId: memory.id,
      title: memory.title,
      description: memory.description || "",
      currentType: memory.type,
      currentColor: memory.color,
      enableSpecialDays: memory.enableSpecialDays || false,
      dateMode: memory.dateType || "solar",
      lunarYearOptions,
    };

    // 处理日期显示
    if (memory.dateType === "lunar" && memory.lunarDate) {
      // 农历模式
      updates.currentLunarYear = memory.lunarDate.year;
      updates.currentLunarMonth = memory.lunarDate.month;
      updates.currentLunarDay = memory.lunarDate.day;
      updates.currentIsLeap = memory.lunarDate.isLeap;

      // 设置农历选择器索引
      const yearIndex = lunarYearOptions.findIndex(
        (y: any) => y.value === memory.lunarDate.year,
      );
      updates.lunarYearIndex = yearIndex >= 0 ? yearIndex : 0;

      // 获取月份选项
      const monthOptions = getLunarMonths(memory.lunarDate.year);
      updates.lunarMonthOptions = monthOptions;
      const monthIndex = monthOptions.findIndex(
        (m: any) =>
          m.value === memory.lunarDate.month &&
          m.isLeap === memory.lunarDate.isLeap,
      );
      updates.lunarMonthIndex = monthIndex >= 0 ? monthIndex : 0;

      // 获取日期选项
      const dayOptions = getLunarDays(
        memory.lunarDate.year,
        memory.lunarDate.month,
        memory.lunarDate.isLeap,
      );
      const dayOptionsFormatted = dayOptions.map((d: number) => ({
        value: d,
        label: LUNAR_DAY_NAMES[d - 1],
      }));
      updates.lunarDayOptions = dayOptionsFormatted;
      const dayIndex = dayOptions.findIndex(
        (d: number) => d === memory.lunarDate.day,
      );
      updates.lunarDayIndex = dayIndex >= 0 ? dayIndex : 0;

      // 计算对应的公历日期用于显示
      const solar = lunarToSolar(
        memory.lunarDate.year,
        memory.lunarDate.month,
        memory.lunarDate.day,
        memory.lunarDate.isLeap,
      );
      updates.targetDate = this.formatDateForInput(
        new Date(solar.year, solar.month - 1, solar.day),
      );
    } else {
      // 公历模式
      updates.targetDate = memory.targetDate;
      // 同时初始化农历选择器为当前公历日期对应的农历，以便切换模式时显示正确
      const [year, month, day] = memory.targetDate.split("-").map(Number);
      const lunarDate = solarToLunar(year, month, day);

      updates.currentLunarYear = lunarDate.year;
      updates.currentLunarMonth = lunarDate.month;
      updates.currentLunarDay = lunarDate.day;
      updates.currentIsLeap = lunarDate.isLeap;

      const yearIndex = lunarYearOptions.findIndex(
        (y: any) => y.value === lunarDate.year,
      );
      updates.lunarYearIndex = yearIndex >= 0 ? yearIndex : 0;

      const monthOptions = getLunarMonths(lunarDate.year);
      updates.lunarMonthOptions = monthOptions;
      const monthIndex = monthOptions.findIndex(
        (m: any) =>
          m.value === lunarDate.month && m.isLeap === lunarDate.isLeap,
      );
      updates.lunarMonthIndex = monthIndex >= 0 ? monthIndex : 0;

      const dayOptions = getLunarDays(
        lunarDate.year,
        lunarDate.month,
        lunarDate.isLeap,
      );
      const dayOptionsFormatted = dayOptions.map((d: number) => ({
        value: d,
        label: LUNAR_DAY_NAMES[d - 1],
      }));
      updates.lunarDayOptions = dayOptionsFormatted;
      const dayIndex = dayOptions.findIndex((d: number) => d === lunarDate.day);
      updates.lunarDayIndex = dayIndex >= 0 ? dayIndex : 0;
    }

    this.setData(updates, () => {
      this.updateLunarDateStr();
    });
  },

  resetForm() {
    // 如果是从编辑模式退出（比如保存后），需要清除 memoryId
    const editMemory = wx.getStorageSync("editMemory");
    if (editMemory) {
      // 如果还有未处理的编辑数据，说明是切换tab导致的onShow，保持编辑状态
      return;
    }

    const today = new Date();
    const todayStr = this.formatDateForInput(today);

    // 获取今天的农历信息
    const lunarDate = solarToLunar(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );

    this.setData(
      {
        memoryId: "", // 重置 ID
        title: "",
        targetDate: todayStr,
        description: "",
        currentType: "memory" as MemoryType,
        currentColor: MEMORY_TYPE_COLORS.memory,
        enableSpecialDays: false,
        enableReminder: true,
        dateMode: "solar" as DatePickerMode,
        lunarDateStr: "",
        festivalHint: "",
        // 同时初始化农历状态为今天
        currentLunarYear: lunarDate.year,
        currentLunarMonth: lunarDate.month,
        currentLunarDay: lunarDate.day,
        currentIsLeap: lunarDate.isLeap,
      },
      () => {
        this.updateLunarDateStr();
        // 初始化范围和农历选择器选项，但不让它们覆盖已设置的 targetDate
        this.initDateRange();
        this.initLunarPickerWithDate(lunarDate);
      },
    );
  },

  // 新增：使用指定日期初始化农历选择器选项
  initLunarPickerWithDate(lunarDate: any) {
    const years = getLunarYearRange(1900, 2100);
    const lunarYearOptions = years.map((y: number) => ({
      value: y,
      label: `${y}年`,
    }));

    const yearIndex = lunarYearOptions.findIndex(
      (y) => y.value === lunarDate.year,
    );
    const monthOptions = getLunarMonths(lunarDate.year);
    const monthIndex = monthOptions.findIndex(
      (m) => m.value === lunarDate.month && m.isLeap === lunarDate.isLeap,
    );
    const days = getLunarDays(
      lunarDate.year,
      lunarDate.month,
      lunarDate.isLeap,
    );
    const dayOptions = days.map((d) => ({
      value: d,
      label: LUNAR_DAY_NAMES[d - 1],
    }));
    const dayIndex = lunarDate.day - 1;

    this.setData({
      lunarYearOptions,
      lunarYearIndex: yearIndex >= 0 ? yearIndex : 0,
      lunarMonthOptions: monthOptions,
      lunarMonthIndex: monthIndex >= 0 ? monthIndex : 0,
      lunarDayOptions: dayOptions,
      lunarDayIndex: dayIndex >= 0 ? dayIndex : 0,
    });
  },

  initDateRange() {
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100); // 允许选择100年前的日期
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 10); // 允许选择10年后的日期

    this.setData({
      minDate: this.formatDateForInput(minDate),
      maxDate: this.formatDateForInput(maxDate),
    });
  },

  // 初始化农历选择器
  initLunarPicker() {
    const today = new Date();
    const years = getLunarYearRange(1900, 2100);
    const lunarYearOptions = years.map((y: number) => ({
      value: y,
      label: `${y}年`,
    }));

    // 设置当前年份索引
    const currentYear = today.getFullYear();
    const yearIndex = lunarYearOptions.findIndex(
      (y) => y.value === currentYear,
    );

    this.setData({
      lunarYearOptions,
      lunarYearIndex: yearIndex >= 0 ? yearIndex : lunarYearOptions.length - 1,
      currentLunarYear: currentYear,
    });

    // 初始化月份和日期选项
    this.updateLunarMonthOptions(currentYear);
    this.updateLunarDayOptions(currentYear, 1, false);
  },

  // 更新农历月份选项
  updateLunarMonthOptions(year: number) {
    const months = getLunarMonths(year);
    this.setData({
      lunarMonthOptions: months,
      lunarMonthIndex: 0,
    });
  },

  // 更新农历日期选项
  updateLunarDayOptions(year: number, month: number, isLeap: boolean) {
    const days = getLunarDays(year, month, isLeap);
    const dayOptions = days.map((d) => ({
      value: d,
      label: LUNAR_DAY_NAMES[d - 1],
    }));

    this.setData({
      lunarDayOptions: dayOptions,
      lunarDayIndex: 0,
      currentLunarMonth: month,
      currentLunarDay: 1,
      currentIsLeap: isLeap,
    });

    // 更新对应的公历日期
    this.updateSolarDateFromLunar();
  },

  // 根据农历更新公历日期
  updateSolarDateFromLunar() {
    const {
      currentLunarYear,
      currentLunarMonth,
      currentLunarDay,
      currentIsLeap,
    } = this.data;

    try {
      const solar = lunarToSolar(
        currentLunarYear,
        currentLunarMonth,
        currentLunarDay,
        currentIsLeap,
      );
      const targetDate = this.formatDateForInput(
        new Date(solar.year, solar.month - 1, solar.day),
      );

      // 获取节日信息
      const detail = getDateDetail(solar.year, solar.month, solar.day);
      const festivalHint =
        detail.lunarFestival || detail.solarFestival || detail.solarTerm || "";

      this.setData({
        targetDate,
        festivalHint,
      });
    } catch (e) {
      console.error("农历转换失败", e);
    }
  },

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  onTitleInput(e: any) {
    this.setData({
      title: e.detail.value,
    });
  },

  // 公历/农历模式切换
  onDateModeSwitch(e: any) {
    const mode = e.currentTarget.dataset.mode as DatePickerMode;

    if (mode === this.data.dateMode) return;

    this.setData({ dateMode: mode });

    if (mode === "lunar") {
      // 切换到农历模式时，根据当前公历日期初始化农历选择
      if (this.data.targetDate) {
        const [year, month, day] = this.data.targetDate.split("-").map(Number);
        const lunarDate = solarToLunar(year, month, day);

        // 更新年份索引
        const yearIndex = this.data.lunarYearOptions.findIndex(
          (y: { value: number; label: string }) => y.value === lunarDate.year,
        );

        // 更新月份选项和索引
        const monthOptions = getLunarMonths(lunarDate.year);
        const monthIndex = monthOptions.findIndex(
          (m: { value: number; label: string; isLeap: boolean }) =>
            m.value === lunarDate.month && m.isLeap === lunarDate.isLeap,
        );

        // 更新日期选项和索引
        const dayOptions = getLunarDays(
          lunarDate.year,
          lunarDate.month,
          lunarDate.isLeap,
        );
        const dayOptionsFormatted = dayOptions.map((d: number) => ({
          value: d,
          label: LUNAR_DAY_NAMES[d - 1],
        }));
        const dayIndex = lunarDate.day - 1;

        this.setData({
          lunarYearIndex: yearIndex >= 0 ? yearIndex : 0,
          lunarMonthOptions: monthOptions,
          lunarMonthIndex: monthIndex >= 0 ? monthIndex : 0,
          lunarDayOptions: dayOptionsFormatted,
          lunarDayIndex: dayIndex >= 0 ? dayIndex : 0,
          currentLunarYear: lunarDate.year,
          currentLunarMonth: lunarDate.month,
          currentLunarDay: lunarDate.day,
          currentIsLeap: lunarDate.isLeap,
        });
      }
    } else {
      // 切换到公历模式时，更新农历显示
      this.updateLunarDateStr();
    }
  },

  // 更新公历对应的农历显示
  updateLunarDateStr() {
    if (!this.data.targetDate) {
      this.setData({ lunarDateStr: "" });
      return;
    }

    const [year, month, day] = this.data.targetDate.split("-").map(Number);
    const lunarDate = solarToLunar(year, month, day);
    const lunarStr = formatLunarDate(lunarDate);

    // 获取节日信息
    const detail = getDateDetail(year, month, day);
    const hints: string[] = [];
    if (detail.lunarFestival) hints.push(detail.lunarFestival);
    if (detail.solarFestival) hints.push(detail.solarFestival);
    if (detail.solarTerm) hints.push(detail.solarTerm);

    this.setData({
      lunarDateStr: lunarStr + (hints.length ? ` (${hints.join(" / ")})` : ""),
    });
  },

  onDateChange(e: any) {
    this.setData({
      targetDate: e.detail.value,
    });
    this.updateLunarDateStr();
  },

  // 农历年选择
  onLunarYearChange(e: any) {
    const index = parseInt(e.detail.value);
    const year = this.data.lunarYearOptions[index].value;

    this.setData({
      lunarYearIndex: index,
      currentLunarYear: year,
    });

    // 更新月份选项（不同年份可能有不同闰月）
    this.updateLunarMonthOptions(year);
    this.updateLunarDayOptions(year, 1, false);
  },

  // 农历月选择
  onLunarMonthChange(e: any) {
    const index = parseInt(e.detail.value);
    const monthOption = this.data.lunarMonthOptions[index];

    this.setData({
      lunarMonthIndex: index,
    });

    this.updateLunarDayOptions(
      this.data.currentLunarYear,
      monthOption.value,
      monthOption.isLeap,
    );
  },

  // 农历日选择
  onLunarDayChange(e: any) {
    const index = parseInt(e.detail.value);
    const day = this.data.lunarDayOptions[index].value;

    this.setData({
      lunarDayIndex: index,
      currentLunarDay: day,
    });

    this.updateSolarDateFromLunar();
  },

  onTypeSelect(e: any) {
    const type = e.currentTarget.dataset.value as MemoryType;
    const color = MEMORY_TYPE_COLORS[type];
    this.setData({
      currentType: type,
      currentColor: color,
      // 如果不是恋爱纪念日，关闭特殊日期提醒
      enableSpecialDays:
        type === "anniversary" ? this.data.enableSpecialDays : false,
    });
  },

  onSpecialDaysSwitch(e: any) {
    this.setData({
      enableSpecialDays: e.detail.value,
    });
  },

  onReminderSwitch(e: any) {
    this.setData({
      enableReminder: e.detail.value,
    });
  },

  onColorSelect(e: any) {
    this.setData({
      currentColor: e.currentTarget.dataset.color,
    });
  },

  onDescriptionInput(e: any) {
    this.setData({
      description: e.detail.value,
    });
  },

  validateForm(): boolean {
    if (!this.data.title.trim()) {
      Message.warning({
        context: this,
        offset: [96, 32],
        duration: 2000,
        content: "请输入纪念日标题",
      });
      return false;
    }

    if (!this.data.targetDate) {
      Message.warning({
        context: this,
        offset: [96, 32],
        duration: 2000,
        content: "请选择日期",
      });
      return false;
    }

    return true;
  },

  onSave() {
    if (!this.validateForm()) {
      return;
    }

    const memoryData: any = {
      id: this.data.memoryId || undefined, // 如果有 ID 则为编辑模式
      title: this.data.title.trim(),
      targetDate: this.data.targetDate,
      dateType: this.data.dateMode,
      type: this.data.currentType,
      color: this.data.currentColor,
      description: this.data.description.trim(),
      enableSpecialDays:
        this.data.currentType === "anniversary"
          ? this.data.enableSpecialDays
          : false,
    };

    // 如果是农历模式，保存农历原始数据
    if (this.data.dateMode === "lunar") {
      memoryData.lunarDate = {
        year: this.data.currentLunarYear,
        month: this.data.currentLunarMonth,
        day: this.data.currentLunarDay,
        isLeap: this.data.currentIsLeap,
      };
    }

    let result;
    if (this.data.memoryId) {
      // 更新逻辑
      result = MemoryStorage.updateMemory(memoryData);
    } else {
      // 新增逻辑
      result = MemoryStorage.saveMemory(memoryData);
    }

    if (result) {
      // 如果开启了提醒，请求订阅授权
      if (this.data.enableReminder) {
        this.requestSubscribeMessage(result.id);
      } else {
        this.showSuccessAndNavigate();
      }
    } else {
      Message.error({
        context: this,
        offset: [96, 32],
        duration: 2000,
        content: this.data.memoryId ? "更新失败，请重试" : "添加失败，请重试",
      });
    }
  },

  // 请求订阅消息授权
  requestSubscribeMessage(memoryId: string) {
    wx.requestSubscribeMessage({
      tmplIds: [REMINDER_TEMPLATE_ID],
      success: (res) => {
        console.log("订阅消息授权结果:", res);

        // 检查用户是否同意授权
        if (res[REMINDER_TEMPLATE_ID] === "accept") {
          // 保存订阅记录到云端
          this.saveSubscriptionToCloud(memoryId);
        } else if (res[REMINDER_TEMPLATE_ID] === "reject") {
          Message.warning({
            context: this,
            offset: [96, 32],
            duration: 2000,
            content: "您已拒绝订阅提醒",
          });
        }

        // 无论是否授权，都继续保存流程
        this.showSuccessAndNavigate();
      },
      fail: (err) => {
        console.error("订阅消息授权失败:", err);
        // 授权失败也继续保存流程
        this.showSuccessAndNavigate();
      },
    });
  },

  // 保存订阅记录到云端
  saveSubscriptionToCloud(memoryId: string) {
    wx.cloud
      .callFunction({
        name: "subscribe",
        data: {
          action: "saveSubscription",
          memoryId: memoryId,
          templateId: REMINDER_TEMPLATE_ID,
        },
      })
      .then((res: any) => {
        console.log("订阅记录保存成功:", res);
      })
      .catch((err: any) => {
        console.error("订阅记录保存失败:", err);
      });
  },

  // 显示成功消息并跳转
  showSuccessAndNavigate() {
    Message.success({
      context: this,
      offset: [96, 32],
      duration: 2000,
      content: this.data.memoryId ? "更新成功" : "添加成功",
    });

    setTimeout(() => {
      // 清除编辑状态
      this.setData({ memoryId: "" });

      wx.switchTab({
        url: "/pages/home/index",
      });

      // 触发自动同步
      setTimeout(() => {
        CloudMemorySync.autoSync();
      }, 2000);
    }, 1500);
  },

  onCancel() {
    wx.switchTab({
      url: "/pages/home/index",
    });
  },
});
