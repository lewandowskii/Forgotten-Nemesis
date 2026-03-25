// 用户认证工具类
import CloudAPI from './cloud'

class AuthAPI {
  // 微信登录
  static async wxLogin() {
    try {
      // 获取用户信息
      const userProfile = await this.getUserProfile()
      if (!userProfile) {
        return {
          success: false,
          message: '用户取消授权'
        }
      }

      // 获取登录凭证
      const loginResult = await wx.login()
      if (!loginResult.code) {
        return {
          success: false,
          message: '登录失败'
        }
      }

      // 调用云函数统一登录接口
      const result = await CloudAPI.login({
        nickName: userProfile.nickName,
        avatarUrl: userProfile.avatarUrl,
        gender: userProfile.gender,
        city: userProfile.city,
        province: userProfile.province,
        country: userProfile.country,
        language: userProfile.language
      })

      return {
        success: result.success,
        userInfo: result.data,
        isNewUser: result.isNewUser,
        message: result.message
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      return {
        success: false,
        message: error.message || '登录失败'
      }
    }
  }

  // 获取用户信息
  static async getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          resolve(res.userInfo)
        },
        fail: (error) => {
          console.log('用户取消授权或获取信息失败:', error)
          resolve(null)
        }
      })
    })
  }

  // 检查登录状态
  static checkLoginStatus() {
    const app = getApp()
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('access_token')

    if (userInfo && token) {
      app.globalData.isLoggedIn = true
      app.globalData.userInfo = userInfo
      return true
    } else {
      app.globalData.isLoggedIn = false
      app.globalData.userInfo = null
      return false
    }
  }

  // 退出登录
  static logout() {
    const app = getApp()

    // 清除本地存储
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('access_token')
    wx.removeStorageSync('lastSyncTime')

    // 清除全局状态
    app.globalData.isLoggedIn = false
    app.globalData.userInfo = null

    // 清除云数据缓存
    if (wx.cloud) {
      try {
        wx.cloud.callFunction({
          name: 'user',
          data: { action: 'logout' }
        }).catch(err => {
          console.log('退出登录云调用失败:', err)
        })
      } catch (e) {
        console.log('云函数调用异常:', e)
      }
    }

    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 2000
    })

    // 跳转到登录页
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }, 1500)
  }

  // 数据同步
  static async syncData(data) {
    try {
      const app = getApp()
      if (!app.globalData.isLoggedIn) {
        return {
          success: false,
          message: '用户未登录'
        }
      }

      const userId = app.globalData.userInfo._id
      const result = await CloudAPI.syncData(userId, data)

      if (result.success) {
        // 记录同步时间
        wx.setStorageSync('lastSyncTime', new Date().toISOString())
        return {
          success: true,
          message: '数据同步成功'
        }
      } else {
        return {
          success: false,
          message: result.message || '数据同步失败'
        }
      }
    } catch (error) {
      console.error('数据同步失败:', error)
      return {
        success: false,
        message: error.message || '数据同步失败'
      }
    }
  }

  // 获取云端数据
  static async getCloudData() {
    try {
      const app = getApp()
      if (!app.globalData.isLoggedIn) {
        return {
          success: false,
          message: '用户未登录'
        }
      }

      const userId = app.globalData.userInfo._id
      const lastSyncTime = wx.getStorageSync('lastSyncTime')

      const result = await CloudAPI.getSyncData(userId, lastSyncTime)

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '数据获取成功'
        }
      } else {
        return {
          success: false,
          message: result.message || '数据获取失败'
        }
      }
    } catch (error) {
      console.error('获取云端数据失败:', error)
      return {
        success: false,
        message: error.message || '数据获取失败'
      }
    }
  }

  // 绑定手机号
  static async bindPhone(code) {
    try {
      const app = getApp()
      if (!app.globalData.isLoggedIn || !app.globalData.userInfo) {
        return {
          success: false,
          message: '用户未登录'
        }
      }

      const userId = app.globalData.userInfo._id
      const result = await CloudAPI.phoneLogin(code)

      if (result.success) {
        app.globalData.userInfo.phoneNumber = result.data.phoneNumber
        wx.setStorageSync('userInfo', app.globalData.userInfo)
        return {
          success: true,
          message: '绑定成功'
        }
      } else {
        return {
          success: false,
          message: result.message || '绑定失败'
        }
      }
    } catch (error) {
      console.error('绑定手机号失败:', error)
      return {
        success: false,
        message: error.message || '绑定失败'
      }
    }
  }
}

module.exports = AuthAPI