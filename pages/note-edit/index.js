const Message = require('tdesign-miniprogram/message/index');
const NoteAPI = require('../../utils/note');

function formatDateToYMD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekDay(noteDate) {
  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const date = new Date(noteDate);
  return weekMap[date.getDay()];
}

function formatDateMeta(noteDate) {
  const date = new Date(noteDate);
  return `${date.getFullYear()}年${date.getMonth() + 1}月 ${formatWeekDay(noteDate)}`;
}

function formatDateFull(noteDate) {
  const date = new Date(noteDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${formatWeekDay(noteDate)}`;
}

Page({
  data: {
    noteId: '',
    title: '',
    content: '',
    noteDate: '',
    dateDay: '',
    dateMeta: '',
    dateFull: '',
    textareaAutosize: {
      minHeight: 220,
      maxHeight: 520,
    },
    loading: false,
  },

  onLoad(options) {
    const today = formatDateToYMD();
    this.setNoteDate(today);
    if (options.id) {
      this.setData({ noteId: options.id });
      this.fetchDetail(options.id);
    }
  },

  async fetchDetail(id) {
    this.setData({ loading: true });
    const res = await NoteAPI.getNoteDetail(id);
    this.setData({ loading: false });
    if (!res.success || !res.data) {
      wx.showToast({
        title: res.message || '加载失败',
        icon: 'none',
      });
      return;
    }
    const { title = '', content = '', noteDate = formatDateToYMD() } = res.data;
    this.setData({ title, content });
    this.setNoteDate(noteDate);
  },

  onTitleChange(e) {
    this.setData({ title: e.detail.value || '' });
  },

  onContentChange(e) {
    this.setData({ content: e.detail.value || '' });
  },

  onDateChange(e) {
    this.setNoteDate(e.detail.value);
  },

  setNoteDate(noteDate) {
    this.setData({
      noteDate,
      dateDay: String(Number(noteDate.slice(-2))),
      dateMeta: formatDateMeta(noteDate),
      dateFull: formatDateFull(noteDate),
    });
  },

  onCancel() {
    wx.navigateBack();
  },

  async onSave() {
    const { noteId, title, content, noteDate } = this.data;
    const trimTitle = (title || '').trim();
    const trimContent = (content || '').trim();
    if (!trimTitle && !trimContent) {
      Message.warning({
        context: this,
        offset: [96, 32],
        duration: 1800,
        content: '标题和内容至少填写一项',
      });
      return;
    }
    if (!noteDate) {
      Message.warning({
        context: this,
        offset: [96, 32],
        duration: 1800,
        content: '请选择日期',
      });
      return;
    }

    const payload = {
      title: trimTitle,
      content: trimContent,
      noteDate,
      source: 'manual',
      relatedMemoryIds: [],
      relatedConversationIds: [],
      linkMeta: {},
    };

    this.setData({ loading: true });
    const res = noteId ? await NoteAPI.updateNote(noteId, payload) : await NoteAPI.createNote(payload);
    this.setData({ loading: false });

    if (!res.success) {
      wx.showToast({
        title: res.message || '保存失败',
        icon: 'none',
      });
      return;
    }

    wx.showToast({
      title: noteId ? '更新成功' : '创建成功',
      icon: 'success',
    });
    setTimeout(() => {
      wx.navigateBack();
    }, 500);
  },
});
