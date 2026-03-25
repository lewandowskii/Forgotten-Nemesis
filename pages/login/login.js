// 登录页面
import AuthAPI from '../../utils/auth'

Page({
  data: {
    loading: false,
    hasUserInfo: false,
    userInfo: null,
    canIUseGetUserProfile: false,
    isLogining: false
  },

  onLoad() {
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 检查是否已登录
    if (AuthAPI.checkLoginStatus()) {
      wx.switchTab({
        url: '/pages/home/index'
      })
    }
  },

  // 微信登录
  async onWxLogin() {
    if (this.data.isLogining) {
      return
    }

    this.setData({ 
      isLogining: true,
      loading: true 
    })

    try {
      const result = await AuthAPI.wxLogin()
      
      if (result.success) {
        // 设置登录状态
        const app = getApp()
        app.setLoginStatus(result.userInfo, 'wx_token_' + Date.now())
        
        wx.showToast({
          title: result.isNewUser ? '注册成功' : '登录成功',
          icon: 'success',
          duration: 2000
        })
        
        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('登录过程出错:', error)
      wx.showToast({
        title: '登录出错，请重试',
        icon: 'error',
        duration: 2000
      })
    } finally {
      this.setData({ 
        isLogining: false,
        loading: false 
      })
    }
  },

  // 获取用户信息
  async getUserInfo(e) {
    this.setData({
      hasUserInfo: true,
      userInfo: e.detail.userInfo,
    })
  },

  // 用户信息授权失败
  onUserInfoFail() {
    wx.showModal({
      title: '提示',
      content: '需要获取您的用户信息才能正常使用小程序功能',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          this.openSetting()
        }
      }
    })
  },

  // 打开设置页面
  openSetting() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.showToast({
            title: '授权成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到手机号登录
  goToPhoneLogin() {
    wx.navigateTo({
      url: '/pages/loginCode/loginCode'
    })
  }
})