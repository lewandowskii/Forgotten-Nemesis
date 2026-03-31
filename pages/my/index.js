import CloudAPI from '../../utils/cloud';
import AuthAPI from '../../utils/auth';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    userInfo: null,
    gridList: [
      {
        name: '全部发布',
        icon: 'root-list',
        type: 'all',
        url: '',
      },
      {
        name: '审核中',
        icon: 'search',
        type: 'progress',
        url: '',
      },
      {
        name: '已发布',
        icon: 'upload',
        type: 'published',
        url: '',
      },
      {
        name: '草稿箱',
        icon: 'file-copy',
        type: 'draft',
        url: '',
      },
      {
        name: '我的收藏',
        icon: 'heart',
        type: 'favorite',
        url: '',
      },
      {
        name: '浏览历史',
        icon: 'time',
        type: 'history',
        url: '',
      },
    ],

    settingList: [
      { name: '数据中心', icon: 'chart-bar', type: 'dataCenter', url: '/pages/dataCenter/index' },
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],

    stats: {
      publishedCount: 0,
      draftCount: 0,
      favoriteCount: 0
    }
  },

  onLoad() {
    this.checkLoginStatus();
  },

  async onShow() {
    await this.loadUserInfo();
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = AuthAPI.checkLoginStatus();
    if (isLoggedIn) {
      const app = getApp();
      this.setData({
        isLoad: true,
        userInfo: app.globalData.userInfo
      });
      this.loadUserStats();
    } else {
      this.setData({
        isLoad: false,
        userInfo: null
      });
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    const isLoggedIn = AuthAPI.checkLoginStatus();
    if (isLoggedIn) {
      const app = getApp();
      this.setData({
        isLoad: true,
        userInfo: app.globalData.userInfo
      });
      await this.loadUserStats();
    } else {
      this.setData({
        isLoad: false,
        userInfo: null
      });
    }
  },

  // 加载用户统计数据
  async loadUserStats() {
    if (!this.data.userInfo) return;

    try {
      const [published, drafts, favorites] = await Promise.all([
        CloudAPI.queryData('memos', { status: 'published' }, 1, 0),
        CloudAPI.queryData('memos', { status: 'draft' }, 1, 0),
        CloudAPI.queryData('favorites', {}, 1, 0)
      ]);

      this.setData({
        'stats.publishedCount': published.success ? published.total : 0,
        'stats.draftCount': drafts.success ? drafts.total : 0,
        'stats.favoriteCount': favorites.success ? favorites.total : 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 直接发起微信登录，不再经过登录页面
  async onLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      const result = await AuthAPI.wxLogin();
      if (!result.success) {
        wx.showToast({
          title: result.message || '登录失败',
          icon: 'none',
        });
        return;
      }

      const app = getApp();
      app.setLoginStatus(result.userInfo, `wx_token_${Date.now()}`);
      this.setData({
        isLoad: true,
        userInfo: result.userInfo,
      });
      await this.loadUserStats();
      wx.showToast({
        title: result.isNewUser ? '注册成功' : '登录成功',
        icon: 'success',
      });
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转个人资料编辑页
  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  // 菜单项点击
  onEleClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    const { name, type, url } = item;

    if (url) {
      wx.navigateTo({ url });
      return;
    }

    if (type === 'favorite' || type === 'history') {
      this.onShowToast('#t-toast', name);
    } else {
      this.onShowToast('#t-toast', name);
    }
  },

  // 数据中心点击
  onDataCenterClick() {
    wx.navigateTo({
      url: '/pages/dataCenter/index'
    });
  },

  // 清理缓存
  onClearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理缓存吗？这将删除临时文件和数据。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' });
          try {
            wx.clearStorageSync();
            wx.hideLoading();
            wx.showToast({ title: '缓存已清理', icon: 'success' });
          } catch (error) {
            wx.hideLoading();
            wx.showToast({ title: '清理失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          AuthAPI.logout();
        }
      }
    });
  },

  // 同步数据
  onSyncData() {
    const lastSyncTime = wx.getStorageSync('lastSyncTime');
    wx.showModal({
      title: '数据同步',
      content: lastSyncTime ? `上次同步时间: ${new Date(lastSyncTime).toLocaleString()}\n是否现在同步数据？` : '确定要同步数据吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '同步中...' });
          const result = await AuthAPI.syncData({});
          wx.hideLoading();
          if (result.success) {
            wx.showToast({ title: '同步成功', icon: 'success' });
          } else {
            wx.showToast({ title: result.message || '同步失败', icon: 'none' });
          }
        }
      }
    });
  }
});
