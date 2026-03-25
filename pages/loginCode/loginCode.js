// 手机号登录页面
import AuthAPI from '../../utils/auth'
import CloudAPI from '../../utils/cloud'

Page({
  data: {
    loading: false,
    code: '',
    isLogining: false
  },

  // 微信手机号授权登录
  async onGetPhoneNumber(e) {
    if (this.data.isLogining) {
      return
    }

    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '取消授权',
        icon: 'none'
      })
      return
    }

    this.setData({
      isLogining: true,
      loading: true,
      code: e.detail.code
    })

    try {
      const result = await CloudAPI.phoneLogin(e.detail.code)

      if (result.success) {
        const app = getApp()
        app.setLoginStatus(result.data, 'phone_token_' + Date.now())

        wx.showToast({
          title: result.isNewUser ? '注册成功' : '登录成功',
          icon: 'success',
          duration: 2000
        })

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
      console.error('手机号登录出错:', error)
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

  // 返回微信登录
  goBackToWxLogin() {
    wx.navigateBack()
  }
})
