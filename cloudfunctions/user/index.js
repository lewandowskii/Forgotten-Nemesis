// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 获取用户openid
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    switch (event.action) {
      case 'getUserInfo':
        return await getUserInfo(wxContext)

      case 'createUser':
        return await createUser(event.userInfo, wxContext)

      case 'updateUser':
        return await updateUser(event.userId, event.updateData, wxContext)

      case 'syncData':
        return await syncData(event.userId, event.data, wxContext)

      case 'getSyncData':
        return await getSyncData(event.userId, event.lastSyncTime, wxContext)

      case 'login':
        return await login(event.userInfo, wxContext)

      case 'phoneLogin':
        return await phoneLogin(event.code, wxContext)

      case 'bindPhone':
        return await bindPhone(event.userId, event.phoneNumber, wxContext)

      case 'uploadData':
        return await uploadData(event.collectionName, event.data, wxContext)

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

// 统一登录
async function login(userInfo, wxContext) {
  try {
    const now = new Date()

    // 查找用户
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    if (result.data.length > 0) {
      // 用户已存在，更新用户信息
      const user = result.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          ...userInfo,
          lastLoginTime: now,
          updateTime: now
        }
      })

      return {
        success: true,
        data: {
          ...user,
          ...userInfo,
          lastLoginTime: now
        },
        isNewUser: false
      }
    } else {
      // 新用户，创建用户记录
      const userRecord = {
        _openid: wxContext.OPENID,
        ...userInfo,
        createTime: now,
        updateTime: now,
        lastLoginTime: now
      }

      const createResult = await db.collection('users').add({
        data: userRecord
      })

      return {
        success: true,
        data: {
          _id: createResult._id,
          _openid: wxContext.OPENID,
          ...userRecord
        },
        isNewUser: true
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 手机号登录
async function phoneLogin(code, wxContext) {
  try {
    // 获取手机号
    const phoneResult = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    })

    if (!phoneResult || !phoneResult.phoneInfo) {
      return {
        success: false,
        message: '获取手机号失败'
      }
    }

    const phoneNumber = phoneResult.phoneInfo.phoneNumber
    const now = new Date()

    // 查找用户
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()

    if (result.data.length > 0) {
      // 用户已存在，绑定手机号
      const user = result.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          phoneNumber: phoneNumber,
          lastLoginTime: now,
          updateTime: now
        }
      })

      return {
        success: true,
        data: {
          ...user,
          phoneNumber: phoneNumber,
          lastLoginTime: now
        },
        isNewUser: false
      }
    } else {
      // 新用户，创建用户记录
      const userRecord = {
        _openid: wxContext.OPENID,
        phoneNumber: phoneNumber,
        createTime: now,
        updateTime: now,
        lastLoginTime: now
      }

      const createResult = await db.collection('users').add({
        data: userRecord
      })

      return {
        success: true,
        data: {
          _id: createResult._id,
          _openid: wxContext.OPENID,
          ...userRecord
        },
        isNewUser: true
      }
    }
  } catch (error) {
    console.error('手机号登录失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// 绑定手机号
async function bindPhone(userId, phoneNumber, wxContext) {
  try {
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID,
      _id: userId
    }).update({
      data: {
        phoneNumber: phoneNumber,
        updateTime: new Date()
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 上传数据
async function uploadData(collectionName, data, wxContext) {
  try {
    const collection = db.collection(collectionName)
    const record = {
      ...data,
      _openid: wxContext.OPENID,
      createTime: new Date()
    }

    const result = await collection.add({
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
    return {
      success: false,
      message: error.message
    }
  }
}

// 获取用户信息
async function getUserInfo(wxContext) {
  try {
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get()
    
    if (result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      }
    } else {
      return {
        success: false,
        message: '用户不存在'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 创建用户
async function createUser(userInfo, wxContext) {
  try {
    const now = new Date()
    const userRecord = {
      _openid: wxContext.OPENID,
      ...userInfo,
      createTime: now,
      updateTime: now,
      lastLoginTime: now
    }
    
    const result = await db.collection('users').add({
      data: userRecord
    })
    
    return {
      success: true,
      data: {
        _id: result._id,
        _openid: wxContext.OPENID,
        ...userRecord
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 更新用户信息
async function updateUser(userId, updateData, wxContext) {
  try {
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID,
      _id: userId
    }).update({
      data: {
        ...updateData,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 同步数据
async function syncData(userId, data, wxContext) {
  try {
    const collection = db.collection('user_data')
    const records = data.map(item => ({
      ...item,
      _openid: wxContext.OPENID,
      userId: userId,
      syncTime: new Date()
    }))
    
    // 批量插入数据
    const result = await collection.add({
      data: records
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 获取同步数据
async function getSyncData(userId, lastSyncTime, wxContext) {
  try {
    const collection = db.collection('user_data')
    let query = collection.where({
      _openid: wxContext.OPENID,
      userId: userId
    })
    
    if (lastSyncTime) {
      query = query.where({
        _openid: wxContext.OPENID,
        userId: userId,
        syncTime: _.gt(new Date(lastSyncTime))
      })
    }
    
    const result = await query.orderBy('syncTime', 'desc').limit(100).get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}