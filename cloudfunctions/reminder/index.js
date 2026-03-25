// 纪念日提醒定时任务云函数
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 微信小程序配置 - 需要在云函数环境变量中设置
const APPID = process.env.APPID || process.env.WX_APPID
const APPSECRET = process.env.APPSECRET || process.env.WX_APPSECRET

// 订阅消息模板ID
const TEMPLATE_ID = process.env.TEMPLATE_ID || 'ntchK9KrNfMPPikvRFz8xWDzv8WrSujxh0Ka0XCoGds'

// access_token 缓存（内存缓存，单次云函数调用期间有效）
let cachedAccessToken = null
let tokenExpireTime = 0

// 微信 API 基础地址
const WX_API_BASE = 'https://api.weixin.qq.com'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  // 测试接口：直接发送一条测试消息
  if (event.action === 'test') {
    return await testSendMessage(event.openid || wxContext.OPENID, event.memoryData)
  }
  
  console.log('纪念日提醒定时任务开始执行:', new Date().toISOString())
  
  try {
    // 获取今天的日期
    const today = new Date()
    const todayStr = formatDate(today)
    const currentYear = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDate()
    // 构建月日匹配字符串（格式：-MM-DD）
    const monthDayStr = `-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    console.log('今天日期:', todayStr, '月:', month, '日:', day, '月日匹配:', monthDayStr, '年份:', currentYear)

    // 1. 查询所有用户的纪念日数据（匹配月日，因为纪念日每年同一天都要提醒）
    const memoriesResult = await db.collection('user_data')
      .where({
        targetDate: db.RegExp({ // 使用 db.RegExp 进行正则匹配
          regexp: `${monthDayStr}$`, // 匹配以 -MM-DD 结尾的日期
          options: 'i'
        })
      })
      .limit(1000)
      .get()

    console.log('找到今天需要提醒的纪念日数量:', memoriesResult.data.length)

    if (memoriesResult.data.length === 0) {
      return {
        success: true,
        message: '今天没有需要提醒的纪念日',
        sentCount: 0,
        failedCount: 0
      }
    }

    // 2. 获取所有待发送的订阅记录（status=pending 且今年未发送）
    const subscriptionsResult = await db.collection('subscription_logs')
      .where({
        status: 'pending'
      })
      .limit(1000)
      .get()

    console.log('待发送订阅记录数量:', subscriptionsResult.data.length)

    // 3. 按用户分组纪念日数据
    const userMemoriesMap = new Map()
    for (const memory of memoriesResult.data) {
      const openid = memory._openid
      if (!userMemoriesMap.has(openid)) {
        userMemoriesMap.set(openid, [])
      }
      userMemoriesMap.get(openid).push(memory)
    }

    // 4. 按用户分组订阅记录
    const userSubscriptionsMap = new Map()
    for (const sub of subscriptionsResult.data) {
      const openid = sub._openid
      if (!userSubscriptionsMap.has(openid)) {
        userSubscriptionsMap.set(openid, [])
      }
      userSubscriptionsMap.get(openid).push(sub)
    }

    let sentCount = 0
    let failedCount = 0
    const results = []

    // 5. 遍历每个用户，发送提醒
    for (const [openid, memories] of userMemoriesMap) {
      const subscriptions = userSubscriptionsMap.get(openid) || []
      
      for (const memory of memories) {
        // 查找该纪念日的订阅记录
        // 云端数据同时有 _id（云端生成）和 id（本地生成），订阅记录使用本地 id
        const memoryId = memory.id || memory._id
        const subscription = subscriptions.find(s => s.memoryId === memoryId)
        
        if (!subscription) {
          console.log('用户未订阅该纪念日:', memory.title, openid, 'memoryId:', memoryId)
          continue
        }
        
        // 检查今年是否已发送
        if (subscription.sentYear === currentYear) {
          console.log('今年已发送过提醒:', memory.title, openid, '年份:', currentYear)
          continue
        }

        try {
          // 发送订阅消息
          const sendResult = await sendSubscribeMessage(openid, subscription.templateId || TEMPLATE_ID, memory)
          
          if (sendResult.success) {
            // 更新订阅记录：状态改为 sent，记录发送年份
            await db.collection('subscription_logs').doc(subscription._id).update({
              data: {
                status: 'sent',
                sentYear: currentYear, // 记录发送年份
                sendTime: new Date(),
                updateTime: new Date()
              }
            })
            sentCount++
            results.push({
              openid,
              memoryId: memoryId,
              title: memory.title,
              status: 'sent',
              year: currentYear
            })
            console.log('发送成功:', memory.title, openid, '年份:', currentYear)
          } else {
            // 发送失败：保持 pending 状态，记录错误信息，下次可重试
            await db.collection('subscription_logs').doc(subscription._id).update({
              data: {
                status: 'pending', // 保持 pending 状态，允许重试
                errorMsg: sendResult.message,
                retryCount: (subscription.retryCount || 0) + 1, // 记录重试次数
                lastRetryTime: new Date(),
                updateTime: new Date()
              }
            })
            failedCount++
            results.push({
              openid,
              memoryId: memoryId,
              title: memory.title,
              status: 'pending', // 状态保持 pending
              error: sendResult.message,
              retryCount: (subscription.retryCount || 0) + 1
            })
            console.error('发送失败（将重试）:', memory.title, openid, sendResult.message)
          }
        } catch (error) {
          console.error('发送订阅消息异常:', error)
          failedCount++
          
          // 发送异常：保持 pending 状态，记录错误信息，下次可重试
          await db.collection('subscription_logs').doc(subscription._id).update({
            data: {
              status: 'pending', // 保持 pending 状态，允许重试
              errorMsg: error.message,
              retryCount: (subscription.retryCount || 0) + 1, // 记录重试次数
              lastRetryTime: new Date(),
              updateTime: new Date()
            }
          })
        }
      }
    }

    console.log('纪念日提醒定时任务执行完成:', { sentCount, failedCount })

    return {
      success: true,
      message: `成功发送 ${sentCount} 条，失败 ${failedCount} 条`,
      sentCount,
      failedCount,
      results,
      date: todayStr,
      year: currentYear
    }
  } catch (error) {
    console.error('定时任务执行错误:', error)
    return {
      success: false,
      message: error.message,
      sentCount: 0,
      failedCount: 0
    }
  }
}

/**
 * 获取 access_token
 * 优先从数据库缓存获取，过期则重新请求
 */
async function getAccessToken() {
  // 检查内存缓存
  if (cachedAccessToken && Date.now() < tokenExpireTime) {
    console.log('使用内存缓存的 access_token')
    return cachedAccessToken
  }

  // 检查数据库缓存
  try {
    const cacheResult = await db.collection('access_tokens')
      .where({
        appid: APPID
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()

    if (cacheResult.data.length > 0) {
      const cache = cacheResult.data[0]
      // 提前 5 分钟刷新
      if (cache.expireTime && new Date(cache.expireTime).getTime() > Date.now() + 5 * 60 * 1000) {
        console.log('使用数据库缓存的 access_token')
        cachedAccessToken = cache.accessToken
        tokenExpireTime = new Date(cache.expireTime).getTime()
        return cache.accessToken
      }
    }
  } catch (e) {
    console.log('查询缓存失败，将重新获取 access_token:', e.message)
  }

  // 重新获取 access_token
  console.log('重新获取 access_token')
  
  if (!APPID || !APPSECRET) {
    throw new Error('缺少 APPID 或 APPSECRET 环境变量配置')
  }

  const url = `${WX_API_BASE}/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
  
  const response = await axios.get(url)
  const data = response.data

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg} (errcode: ${data.errcode})`)
  }

  const accessToken = data.access_token
  const expiresIn = data.expires_in || 7200 // 默认 2 小时
  
  // 更新内存缓存
  cachedAccessToken = accessToken
  tokenExpireTime = Date.now() + expiresIn * 1000

  // 保存到数据库缓存
  try {
    await db.collection('access_tokens').add({
      data: {
        appid: APPID,
        accessToken: accessToken,
        expireTime: new Date(Date.now() + expiresIn * 1000),
        createTime: new Date()
      }
    })
    console.log('access_token 已缓存到数据库')
  } catch (e) {
    console.log('缓存 access_token 失败:', e.message)
  }

  return accessToken
}

/**
 * 发送订阅消息（HTTPS 方式）
 * @param {string} openid - 用户openid
 * @param {string} templateId - 模板ID
 * @param {object} memory - 纪念日数据
 */
async function sendSubscribeMessage(openid, templateId, memory) {
  try {
    // 获取 access_token
    const accessToken = await getAccessToken()
    
    // 计算已过天数
    const targetDate = new Date(memory.targetDate)
    const today = new Date()
    const days = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24)) + 1
    
    // 构建订阅消息数据
    // 模板字段：类型(thing1)、日期(date7)、纪念日期(thing9)、天数(thing8)、温馨提示(thing5)
    const sendData = {
      touser: openid,
      template_id: templateId,
      page: 'pages/home/index', // 点击消息跳转的页面
      data: {
        thing1: { value: getTypeLabel(memory.type) }, // 类型
        date7: { value: formatDateCN(new Date(memory.targetDate)) }, // 日期（纪念日当天）
        thing9: { value: memory.title.substring(0, 20) }, // 纪念日期（纪念日名称）
        thing8: { value: `第${days}天` }, // 天数
        thing5: { value: memory.description ? memory.description.substring(0, 20) : '记得庆祝哦~' } // 温馨提示
      },
      miniprogram_state: 'developer', // formal: 正式版, developer: 开发版, trial: 体验版
      lang: 'zh_CN'
    }

    console.log('发送订阅消息:', JSON.stringify(sendData))

    // 调用微信接口发送订阅消息
    const url = `${WX_API_BASE}/cgi-bin/message/subscribe/send?access_token=${accessToken}`
    const response = await axios.post(url, sendData)
    const result = response.data
    
    console.log('发送结果:', JSON.stringify(result))

    if (result.errcode === 0) {
      return {
        success: true,
        data: result
      }
    } else {
      return {
        success: false,
        message: result.errmsg || '发送失败',
        errcode: result.errcode
      }
    }
  } catch (error) {
    console.error('发送订阅消息异常:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为中文格式
 */
function formatDateCN(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

/**
 * 获取纪念日类型标签
 */
function getTypeLabel(type) {
  const typeMap = {
    'anniversary': '恋爱纪念日',
    'birthday': '生日',
    'memory': '纪念日',
    'holiday': '节日'
  }
  return typeMap[type] || '纪念日'
}

/**
 * 测试发送订阅消息
 * @param {string} openid - 接收消息的用户openid
 * @param {object} memoryData - 模拟的纪念日数据（可选）
 */
async function testSendMessage(openid, memoryData) {
  console.log('测试发送订阅消息, openid:', openid)
  
  // 默认测试数据
  const mockMemory = memoryData || {
    title: '测试纪念日',
    targetDate: formatDate(new Date()),
    type: 'anniversary',
    description: '这是一条测试消息'
  }
  
  try {
    const result = await sendSubscribeMessage(openid, TEMPLATE_ID, mockMemory)
    
    return {
      success: result.success,
      message: result.success ? '测试消息发送成功' : '测试消息发送失败',
      openid: openid,
      templateId: TEMPLATE_ID,
      memoryData: mockMemory,
      result: result
    }
  } catch (error) {
    console.error('测试发送失败:', error)
    return {
      success: false,
      message: error.message,
      openid: openid,
      templateId: TEMPLATE_ID
    }
  }
}
