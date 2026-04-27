const Message = require('tdesign-miniprogram/message/index');
const NoteAPI = require('../../utils/note');
const { buildMarkdownPreview } = require('../../utils/markdown');

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
    mode: 'edit',
    previewContent: '',
    detailLoading: false,
    saving: false,
  },

  onLoad(options) {
    const today = formatDateToYMD();
    this.setNoteDate(today);
    this.updatePreviewContent('');
    if (options.id) {
      this.setData({ noteId: options.id });
      this.fetchDetail(options.id);
    }
  },

  async fetchDetail(id) {
    this.setData({ detailLoading: true });
    let res;
    try {
      res = await NoteAPI.getNoteDetail(id);
    } catch (error) {
      console.error('获取笔记详情失败:', error);
    } finally {
      this.setData({ detailLoading: false });
    }
    if (!res || !res.success || !res.data) {
      wx.showToast({
        title: (res && res.message) || '加载失败',
        icon: 'none',
      });
      return;
    }
    const { title = '', content = '', noteDate = formatDateToYMD() } = res.data;
    this.setData({ title, content });
    this.updatePreviewContent(content);
    this.setNoteDate(noteDate);
  },

  onTitleChange(e) {
    if (this.data.detailLoading) return;
    this.setData({ title: e.detail.value || '' });
  },

  onContentChange(e) {
    if (this.data.detailLoading) return;
    const content = e.detail.value || '';
    this.setData({
      content,
      previewContent: buildMarkdownPreview(content, {
        maxBlocks: 24,
        maxCodeLines: 80,
      }),
    });
  },

  onDateChange(e) {
    if (this.data.detailLoading) return;
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

  onModeChange(e) {
    const { mode } = e.currentTarget.dataset;
    if (!mode || mode === this.data.mode) return;
    this.setData({ mode });
  },

  updatePreviewContent(content = '') {
    this.setData({
      previewContent: buildMarkdownPreview(content, {
        maxBlocks: 24,
        maxCodeLines: 80,
      }),
    });
  },

  onCancel() {
    wx.navigateBack();
  },

  async onSave() {
    const { noteId, title, content, noteDate, detailLoading, saving } = this.data;
    if (detailLoading || saving) return;

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

    this.setData({ saving: true });
    let res;
    try {
      res = noteId ? await NoteAPI.updateNote(noteId, payload) : await NoteAPI.createNote(payload);
    } catch (error) {
      console.error('保存笔记失败:', error);
    } finally {
      this.setData({ saving: false });
    }

    if (!res || !res.success) {
      wx.showToast({
        title: (res && res.message) || '保存失败',
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
