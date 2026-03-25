// 数据同步云函数
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    switch (event.action) {
      case 'upload':
        return await upload(event.collectionName, event.data, wxContext)

      case 'batchUpload':
        return await batchUpload(event.collectionName, event.dataArray, wxContext)

      case 'update':
        return await update(event.collectionName, event.where, event.data, wxContext)

      case 'delete':
        return await deleteRecord(event.collectionName, event.where, wxContext)

      case 'query':
        return await query(event.collectionName, event.where, event.limit, event.skip, event.orderBy, wxContext)

      case 'getById':
        return await getById(event.collectionName, event.id, wxContext)

      case 'sync':
        return await sync(event.collectionName, event.lastSyncTime, wxContext)

      case 'count':
        return await count(event.collectionName, event.where, wxContext)

      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 上传单条数据
async function upload(collectionName, data, wxContext) {
  try {
    const record = {
      ...data,
      _openid: wxContext.OPENID,
      createTime: new Date(),
      updateTime: new Date()
    }

    const result = await db.collection(collectionName).add({
      data: record
    })

    return {
      success: true,
      data: {
        _id: result._id,
        ...record
      }
    }
  } catch (error) {
    console.error('上传数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 批量上传数据
async function batchUpload(collectionName, dataArray, wxContext) {
  try {
    const now = new Date()
    const records = dataArray.map(item => ({
      ...item,
      _openid: wxContext.OPENID,
      createTime: now,
      updateTime: now
    }))

    const results = []
    for (const record of records) {
      const result = await db.collection(collectionName).add({
        data: record
      })
      results.push({
        _id: result._id,
        ...record
      })
    }

    return {
      success: true,
      data: results,
      total: results.length
    }
  } catch (error) {
    console.error('批量上传数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 更新数据
async function update(collectionName, where, data, wxContext) {
  try {
    const updateData = {
      ...data,
      updateTime: new Date()
    }

    const result = await db.collection(collectionName)
      .where({
        _openid: wxContext.OPENID,
        ...where
      })
      .update({
        data: updateData
      })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('更新数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 删除数据
async function deleteRecord(collectionName, where, wxContext) {
  try {
    const result = await db.collection(collectionName)
      .where({
        _openid: wxContext.OPENID,
        ...where
      })
      .remove()

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('删除数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 查询数据
async function query(collectionName, where, limit, skip, orderBy, wxContext) {
  try {
    const query = db.collection(collectionName)
      .where({
        _openid: wxContext.OPENID,
        ...(where || {})
      })

    if (orderBy && orderBy.field && orderBy.order) {
      query.orderBy(orderBy.field, orderBy.order)
    } else {
      query.orderBy('createTime', 'desc')
    }

    if (limit) {
      query.limit(limit)
    } else {
      query.limit(20)
    }

    if (skip) {
      query.skip(skip)
    }

    const result = await query.get()

    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('查询数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 根据ID获取数据
async function getById(collectionName, id, wxContext) {
  try {
    const result = await db.collection(collectionName).doc(id).get()

    // 检查数据归属
    if (result.data && result.data._openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '无权访问该数据'
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 同步数据（增量同步）
async function sync(collectionName, lastSyncTime, wxContext) {
  try {
    const query = db.collection(collectionName)
      .where({
        _openid: wxContext.OPENID
      })
      .orderBy('updateTime', 'desc')
      .limit(100)

    if (lastSyncTime) {
      query.where({
        _openid: wxContext.OPENID,
        updateTime: _.gt(new Date(lastSyncTime))
      })
    }

    const result = await query.get()

    return {
      success: true,
      data: result.data,
      lastSyncTime: new Date().toISOString()
    }
  } catch (error) {
    console.error('同步数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 统计数量
async function count(collectionName, where, wxContext) {
  try {
    const result = await db.collection(collectionName)
      .where({
        _openid: wxContext.OPENID,
        ...(where || {})
      })
      .count()

    return {
      success: true,
      data: {
        total: result.total
      }
    }
  } catch (error) {
    console.error('统计数据失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
