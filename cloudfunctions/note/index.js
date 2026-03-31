const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION = 'notes';

function toYear(noteDate) {
  return Number(String(noteDate).slice(0, 4));
}

function getFilterWhere(filterType) {
  const currentYear = new Date().getFullYear();
  if (filterType === 'lastYear') {
    return { noteYear: currentYear - 1 };
  }
  if (filterType === 'prevYear') {
    return { noteYear: currentYear - 2 };
  }
  if (filterType === 'earlier') {
    return { noteYear: _.lte(currentYear - 3) };
  }
  return {};
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  try {
    switch (event.action) {
      case 'createNote':
        return await createNote(event.payload, wxContext);
      case 'updateNote':
        return await updateNote(event.noteId, event.payload, wxContext);
      case 'deleteNote':
        return await deleteNote(event.noteId, wxContext);
      case 'getNoteDetail':
        return await getNoteDetail(event.noteId, wxContext);
      case 'listNotes':
        return await listNotes(event, wxContext);
      default:
        return { success: false, message: '未知操作类型' };
    }
  } catch (error) {
    console.error('note 云函数执行失败:', error);
    return { success: false, message: error.message || '服务异常' };
  }
};

async function createNote(payload = {}, wxContext) {
  const title = (payload.title || '').trim();
  const content = (payload.content || '').trim();
  const noteDate = payload.noteDate;
  if (!noteDate) {
    return { success: false, message: 'noteDate 不能为空' };
  }
  if (!title && !content) {
    return { success: false, message: '标题和内容至少填写一项' };
  }

  const now = new Date();
  const record = {
    _openid: wxContext.OPENID,
    title,
    content,
    noteDate,
    noteYear: toYear(noteDate),
    isDeleted: false,
    source: payload.source || 'manual',
    relatedMemoryIds: payload.relatedMemoryIds || [],
    relatedConversationIds: payload.relatedConversationIds || [],
    linkMeta: payload.linkMeta || {},
    createdAt: now,
    updatedAt: now,
  };

  const res = await db.collection(COLLECTION).add({ data: record });
  return {
    success: true,
    data: { _id: res._id, ...record },
  };
}

async function updateNote(noteId, payload = {}, wxContext) {
  if (!noteId) return { success: false, message: 'noteId 不能为空' };
  const title = (payload.title || '').trim();
  const content = (payload.content || '').trim();
  const noteDate = payload.noteDate;
  if (!noteDate) return { success: false, message: 'noteDate 不能为空' };
  if (!title && !content) return { success: false, message: '标题和内容至少填写一项' };

  const updateData = {
    title,
    content,
    noteDate,
    noteYear: toYear(noteDate),
    source: payload.source || 'manual',
    relatedMemoryIds: payload.relatedMemoryIds || [],
    relatedConversationIds: payload.relatedConversationIds || [],
    linkMeta: payload.linkMeta || {},
    updatedAt: new Date(),
  };

  const res = await db
    .collection(COLLECTION)
    .where({ _id: noteId, _openid: wxContext.OPENID, isDeleted: false })
    .update({ data: updateData });

  if (!res.stats || res.stats.updated === 0) {
    return { success: false, message: '未找到可更新笔记' };
  }
  return { success: true, data: { noteId } };
}

async function deleteNote(noteId, wxContext) {
  if (!noteId) return { success: false, message: 'noteId 不能为空' };
  const res = await db
    .collection(COLLECTION)
    .where({ _id: noteId, _openid: wxContext.OPENID, isDeleted: false })
    .update({ data: { isDeleted: true, updatedAt: new Date() } });
  if (!res.stats || res.stats.updated === 0) {
    return { success: false, message: '未找到可删除笔记' };
  }
  return { success: true, data: { noteId } };
}

async function getNoteDetail(noteId, wxContext) {
  if (!noteId) return { success: false, message: 'noteId 不能为空' };
  const res = await db
    .collection(COLLECTION)
    .where({ _id: noteId, _openid: wxContext.OPENID, isDeleted: false })
    .limit(1)
    .get();
  if (!res.data.length) return { success: false, message: '笔记不存在' };
  return { success: true, data: res.data[0] };
}

async function listNotes(event, wxContext) {
  const filterType = event.filterType || 'all';
  const page = Number(event.page || 1);
  const size = Number(event.size || 20);
  const skip = (page - 1) * size;

  const baseWhere = {
    _openid: wxContext.OPENID,
    isDeleted: false,
    ...getFilterWhere(filterType),
  };

  const totalRes = await db.collection(COLLECTION).where(baseWhere).count();
  const listRes = await db
    .collection(COLLECTION)
    .where(baseWhere)
    .orderBy('noteDate', 'desc')
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(size)
    .get();

  return {
    success: true,
    data: {
      list: listRes.data || [],
      total: totalRes.total || 0,
      page,
      size,
    },
  };
}
