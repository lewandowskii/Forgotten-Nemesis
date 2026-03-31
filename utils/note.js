class NoteAPI {
  static async call(action, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'note',
        data: {
          action,
          ...data,
        },
      });
      return result.result || { success: false, message: '返回结果为空' };
    } catch (error) {
      console.error('note 云函数调用失败:', error);
      return {
        success: false,
        message: error.message || '网络异常，请稍后重试',
      };
    }
  }

  static async createNote(payload) {
    return this.call('createNote', { payload });
  }

  static async updateNote(noteId, payload) {
    return this.call('updateNote', { noteId, payload });
  }

  static async deleteNote(noteId) {
    return this.call('deleteNote', { noteId });
  }

  static async getNoteDetail(noteId) {
    return this.call('getNoteDetail', { noteId });
  }

  static async listNotes(options = {}) {
    const { filterType = 'all', page = 1, size = 20 } = options;
    return this.call('listNotes', { filterType, page, size });
  }
}

module.exports = NoteAPI;
