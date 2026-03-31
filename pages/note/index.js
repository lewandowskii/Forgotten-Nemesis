const NoteAPI = require('../../utils/note');

function formatDateToYMD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(noteDate) {
  const date = new Date(noteDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

Page({
  data: {
    filterType: 'all',
    filters: [
      { label: '全部', value: 'all' },
      { label: '去年', value: 'lastYear' },
      { label: '前年', value: 'prevYear' },
      { label: '更早', value: 'earlier' },
      { label: '日历视图', value: 'calendar' },
    ],
    notes: [],
    groupedNotes: [],
    page: 1,
    size: 20,
    hasMore: true,
    loading: false,
    refreshing: false,
  },

  onShow() {
    this.fetchNotes(true);
  },

  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    await this.fetchNotes(true);
    this.setData({ refreshing: false });
  },

  async onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    await this.fetchNotes(false);
  },

  onFilterTap(e) {
    const { value } = e.currentTarget.dataset;
    if (value === 'calendar') {
      wx.showToast({
        title: '日历视图即将上线',
        icon: 'none',
      });
      return;
    }
    if (value === this.data.filterType) return;
    this.setData({
      filterType: value,
      page: 1,
      hasMore: true,
    });
    this.fetchNotes(true);
  },

  async fetchNotes(reset = false) {
    const nextPage = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    const res = await NoteAPI.listNotes({
      filterType: this.data.filterType,
      page: nextPage,
      size: this.data.size,
    });
    this.setData({ loading: false });
    if (!res.success) {
      wx.showToast({
        title: res.message || '加载失败',
        icon: 'none',
      });
      return;
    }

    const incoming = (res.data && res.data.list) || [];
    const notes = reset ? incoming : [...this.data.notes, ...incoming];
    this.setData({
      notes,
      groupedNotes: this.groupNotesByDate(notes),
      page: nextPage + 1,
      hasMore: incoming.length >= this.data.size,
    });
  },

  groupNotesByDate(notes) {
    const today = formatDateToYMD();
    const groupMap = {};
    notes.forEach((item) => {
      const key = item.noteDate || formatDateToYMD(new Date(item.createdAt));
      if (!groupMap[key]) {
        groupMap[key] = {
          dateKey: key,
          dateLabel: key === today ? '今天' : formatDisplayDate(key),
          list: [],
        };
      }
      groupMap[key].list.push(item);
    });

    return Object.keys(groupMap)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((key) => groupMap[key]);
  },

  goCreateNote() {
    wx.navigateTo({
      url: '/pages/note-edit/index',
    });
  },

  goEditNote(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/note-edit/index?id=${id}`,
    });
  },

  onNoteAction(e) {
    const { id } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) {
          this.goEditNote({ currentTarget: { dataset: { id } } });
          return;
        }
        this.confirmDelete(id);
      },
    });
  },

  confirmDelete(id) {
    wx.showModal({
      title: '删除确认',
      content: '确定删除这条笔记吗？',
      success: async (res) => {
        if (!res.confirm) return;
        const result = await NoteAPI.deleteNote(id);
        if (!result.success) {
          wx.showToast({
            title: result.message || '删除失败',
            icon: 'none',
          });
          return;
        }
        wx.showToast({
          title: '删除成功',
          icon: 'success',
        });
        this.fetchNotes(true);
      },
    });
  },
});
