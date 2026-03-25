// 订阅管理云函数
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
      case 'saveSubscription':
        return await saveSubscription(event.memoryId, event.templateId, wxContext)

      case 'getSubscription':
        return await getSubscription(event.memoryId, wxContext)

      case 'getSubscriptionsByUser':
        return await getSubscriptionsByUser(wxContext)

      case 'updateSendStatus':
        return await updateSendStatus(event.subscriptionId, event.status, event.sendTime, wxContext)

      case 'getPendingSubscriptions':
        return await getPendingSubscriptions(event.date, wxContext)

      case 'deleteSubscription':
        return await deleteSubscription(event.memoryId, wxContext)

      case 'checkAndRenewSubscription':
        return await checkAndRenewSubscription(event.memoryId, event.templateId, wxContext)

      case 'getUpcomingReminders':
        return await getUpcomingReminders(event.days, wxContext)

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

/**
 * 保存订阅记录
 * @param {string} memoryId - 纪念日ID
 * @param {string} templateId - 订阅消息模板ID
 */
async function saveSubscription(memoryId, templateId, wxContext) {
  try {
    const now = new Date()
    
    // 检查是否已存在待发送的订阅记录
    const existing = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        memoryId: memoryId,
        status: 'pending'
      })
      .get()

    if (existing.data.length > 0) {
      // 更新现有记录
      await db.collection('subscription_logs').doc(existing.data[0]._id).update({
        data: {
          templateId: templateId,
          subscribeTime: now,
          updateTime: now,
          status: 'pending'
        }
      })
      
      return {
        success: true,
        data: existing.data[0],
        message: '订阅记录已更新'
      }
    }

    // 创建新订阅记录
    const subscriptionRecord = {
      _openid: wxContext.OPENID,
      memoryId: memoryId,
      templateId: templateId,
      status: 'pending', // pending: 待发送, sent: 已发送, failed: 发送失败
      subscribeTime: now,
      updateTime: now,
      sendTime: null,
      sentYear: null, // 记录发送年份
      errorMsg: null
    }

    const result = await db.collection('subscription_logs').add({
      data: subscriptionRecord
    })

    return {
      success: true,
      data: {
        _id: result._id,
        ...subscriptionRecord
      },
      message: '订阅成功'
    }
  } catch (error) {
    console.error('保存订阅记录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 检查并续订订阅（用于每年重新授权）
 * @param {string} memoryId - 纪念日ID
 * @param {string} templateId - 模板ID
 */
async function checkAndRenewSubscription(memoryId, templateId, wxContext) {
  try {
    const currentYear = new Date().getFullYear()
    
    // 查询该纪念日的订阅记录
    const result = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        memoryId: memoryId
      })
      .orderBy('subscribeTime', 'desc')
      .limit(1)
      .get()

    if (result.data.length === 0) {
      // 没有订阅记录，需要新建
      return {
        success: true,
        needRenew: true,
        reason: 'no_subscription'
      }
    }

    const subscription = result.data[0]
    
    // 如果今年已发送，需要重新授权
    if (subscription.sentYear === currentYear) {
      return {
        success: true,
        needRenew: true,
        reason: 'already_sent_this_year',
        lastSentYear: subscription.sentYear
      }
    }

    // 如果状态是 pending 且今年未发送，可以直接使用
    if (subscription.status === 'pending') {
      return {
        success: true,
        needRenew: false,
        subscription: subscription
      }
    }

    // 其他情况需要重新授权
    return {
      success: true,
      needRenew: true,
      reason: subscription.status,
      subscription: subscription
    }
  } catch (error) {
    console.error('检查订阅状态失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取即将到来的纪念日提醒（用于前端提示用户授权）
 * @param {number} days - 提前天数
 */
async function getUpcomingReminders(days, wxContext) {
  try {
    const today = new Date()
    const currentYear = today.getFullYear()
    
    // 计算未来N天的日期范围
    const upcomingDates = []
    for (let i = 0; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      upcomingDates.push(`-${month}-${day}`)
    }

    // 查询即将到来的纪念日
    const memoriesResult = await db.collection('user_data')
      .where({
        _openid: wxContext.OPENID,
        targetDate: db.RegExp({
          regexp: `(${upcomingDates.join('|')})$`,
          options: 'i'
        })
      })
      .get()

    // 查询这些纪念日的订阅状态
    const memoryIds = memoriesResult.data.map(m => m._id || m.id)
    const subscriptionsResult = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        memoryId: _.in(memoryIds)
      })
      .get()

    // 组装结果
    const reminders = memoriesResult.data.map(memory => {
      const subscription = subscriptionsResult.data.find(s => s.memoryId === (memory._id || memory.id))
      const needRenew = !subscription || 
                        subscription.status !== 'pending' || 
                        subscription.sentYear === currentYear

      return {
        memory: {
          _id: memory._id || memory.id,
          title: memory.title,
          targetDate: memory.targetDate,
          type: memory.type
        },
        subscription: subscription || null,
        needRenew: needRenew
      }
    })

    return {
      success: true,
      data: reminders,
      total: reminders.length
    }
  } catch (error) {
    console.error('获取即将到来的提醒失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取单个订阅记录
 */
async function getSubscription(memoryId, wxContext) {
  try {
    const result = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        memoryId: memoryId
      })
      .orderBy('subscribeTime', 'desc')
      .limit(1)
      .get()

    if (result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      }
    } else {
      return {
        success: true,
        data: null
      }
    }
  } catch (error) {
    console.error('获取订阅记录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取用户所有订阅记录
 */
async function getSubscriptionsByUser(wxContext) {
  try {
    const result = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID
      })
      .orderBy('subscribeTime', 'desc')
      .limit(100)
      .get()

    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('获取用户订阅记录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 更新发送状态
 */
async function updateSendStatus(subscriptionId, status, sendTime, wxContext) {
  try {
    const updateData = {
      status: status,
      updateTime: new Date()
    }

    if (sendTime) {
      updateData.sendTime = new Date(sendTime)
    }

    const result = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        _id: subscriptionId
      })
      .update({
        data: updateData
      })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('更新发送状态失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取待发送的订阅记录（供定时任务调用）
 * @param {string} date - 日期 YYYY-MM-DD
 */
async function getPendingSubscriptions(date, wxContext) {
  try {
    // 此接口仅供定时任务调用，不需要验证 openid
    const result = await db.collection('subscription_logs')
      .where({
        status: 'pending'
      })
      .limit(1000)
      .get()

    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('获取待发送订阅记录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 删除订阅记录
 */
async function deleteSubscription(memoryId, wxContext) {
  try {
    const result = await db.collection('subscription_logs')
      .where({
        _openid: wxContext.OPENID,
        memoryId: memoryId
      })
      .remove()

    return {
      success: true,
      data: result,
      message: '订阅记录已删除'
    }
  } catch (error) {
    console.error('删除订阅记录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}
