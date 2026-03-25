/**
 * 微信小程序云开发 - 用户登录和数据上传使用指南
 * 云环境ID: cloud1-8gdruqpk94bbec4e
 */

// ==================== 一、用户登录 ====================

// 1. 微信快速登录
import AuthAPI from '../../utils/auth'

async function wxQuickLogin() {
  const result = await AuthAPI.wxLogin()
  if (result.success) {
    console.log('登录成功:', result.userInfo)
    console.log('是否新用户:', result.isNewUser)
  }
}

// 2. 手机号登录
import CloudAPI from '../../utils/cloud'

async function phoneLogin(code) {
  const result = await CloudAPI.phoneLogin(code)
  if (result.success) {
    console.log('手机号登录成功:', result.data)
  }
}

// 在页面中使用:
// <button open-type="getPhoneNumber" bindgetphonenumber="onGetPhoneNumber">
//   授权手机号登录
// </button>

// 3. 检查登录状态
function checkLogin() {
  const isLoggedIn = AuthAPI.checkLoginStatus()
  if (isLoggedIn) {
    const app = getApp()
    console.log('当前用户:', app.globalData.userInfo)
  }
}

// 4. 退出登录
function logout() {
  AuthAPI.logout()
}

// ==================== 二、数据上传 ====================

// 1. 上传单条数据
async function uploadSingleData() {
  const result = await CloudAPI.uploadData('collection_name', {
    title: '备忘录标题',
    content: '备忘录内容',
    tags: ['工作', '重要']
  })
  if (result.success) {
    console.log('上传成功，ID:', result.data._id)
  }
}

// 2. 批量上传数据
async function batchUpload() {
  const dataArray = [
    { title: '标题1', content: '内容1' },
    { title: '标题2', content: '内容2' }
  ]
  const result = await CloudAPI.batchUploadData('collection_name', dataArray)
  if (result.success) {
    console.log('批量上传成功:', result.total)
  }
}

// 3. 更新数据
async function updateData(recordId) {
  const result = await CloudAPI.updateData(
    'collection_name',
    { _id: recordId },
    { title: '新标题', content: '新内容' }
  )
  if (result.success) {
    console.log('更新成功')
  }
}

// 4. 删除数据
async function deleteData(recordId) {
  const result = await CloudAPI.deleteData('collection_name', { _id: recordId })
  if (result.success) {
    console.log('删除成功')
  }
}

// ==================== 三、数据查询 ====================

// 1. 查询数据列表
async function queryDataList() {
  const result = await CloudAPI.queryData(
    'collection_name',
    { status: 'active' },  // 查询条件
    20,                      // 每页数量
    0,                       // 跳过数量
    { field: 'createTime', order: 'desc' }  // 排序
  )
  if (result.success) {
    console.log('查询结果:', result.data)
  }
}

// 2. 根据ID获取单条数据
async function getDataById(recordId) {
  const result = await CloudAPI.getDataById('collection_name', recordId)
  if (result.success) {
    console.log('数据详情:', result.data)
  }
}

// 3. 统计数据数量
async function countData() {
  const result = await CloudAPI.countData('collection_name', { status: 'active' })
  if (result.success) {
    console.log('总数:', result.data.total)
  }
}

// ==================== 四、数据同步 ====================

// 1. 增量同步（获取上次同步后的新数据）
async function syncData() {
  const lastSyncTime = wx.getStorageSync('lastSyncTime')
  const result = await CloudAPI.syncCollection('collection_name', lastSyncTime)
  if (result.success) {
    console.log('同步成功，数据:', result.data)
    wx.setStorageSync('lastSyncTime', result.lastSyncTime)
  }
}

// ==================== 五、文件上传 ====================

// 1. 上传单个文件
async function uploadFile(filePath) {
  const cloudPath = `uploads/${Date.now()}_image.jpg`
  const result = await CloudAPI.uploadFile(filePath, cloudPath)
  if (result.success) {
    console.log('文件ID:', result.fileID)
  }
}

// 2. 批量上传文件
async function uploadMultipleFiles(filePaths) {
  const cloudPathPrefix = `uploads/${Date.now()}`
  const result = await CloudAPI.uploadMultipleFiles(filePaths, cloudPathPrefix)
  if (result.success) {
    console.log('上传成功:', result.data)
  }
}

// 3. 获取文件临时链接
async function getTempFileURL(fileID) {
  const result = await CloudAPI.getTempFileURL(fileID)
  if (result.success) {
    console.log('临时链接:', result.tempFileURL)
  }
}

// 4. 删除文件
async function deleteFile(fileID) {
  const result = await CloudAPI.deleteFile(fileID)
  if (result.success) {
    console.log('删除成功')
  }
}

// ==================== 六、在页面中使用的示例 ====================

Page({
  data: {
    dataList: [],
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true })
    const result = await CloudAPI.queryData('memos', {}, 20, 0)
    this.setData({
      dataList: result.success ? result.data : [],
      loading: false
    })
  },

  // 添加数据
  async onAddMemo() {
    const result = await CloudAPI.uploadData('memos', {
      title: '新备忘录',
      content: '备忘录内容',
      createTime: new Date()
    })
    if (result.success) {
      wx.showToast({ title: '添加成功' })
      this.loadData()
    }
  },

  // 上传图片
  async onUploadImage() {
    wx.chooseImage({
      count: 1,
      success: async (res) => {
        const filePath = res.tempFilePaths[0]
        const cloudPath = `memos/${Date.now()}.jpg`
        const result = await CloudAPI.uploadFile(filePath, cloudPath)
        if (result.success) {
          console.log('图片上传成功:', result.fileID)
        }
      }
    })
  }
})

// ==================== 七、云函数说明 ====================

/**
 * 已创建的云函数:
 *
 * 1. user - 用户相关云函数
 *    - login: 统一登录接口
 *    - phoneLogin: 手机号登录
 *    - bindPhone: 绑定手机号
 *    - getUserInfo: 获取用户信息
 *    - createUser: 创建用户
 *    - updateUser: 更新用户信息
 *
 * 2. dataSync - 数据同步云函数
 *    - upload: 上传单条数据
 *    - batchUpload: 批量上传数据
 *    - update: 更新数据
 *    - delete: 删除数据
 *    - query: 查询数据
 *    - getById: 根据ID获取数据
 *    - sync: 增量同步
 *    - count: 统计数量
 */

// ==================== 八、数据库集合说明 ====================

/**
 * 需要在云开发控制台创建的数据库集合:
 *
 * 1. users - 用户信息集合
 *    - 字段: _openid, nickName, avatarUrl, gender, city, province, country,
 *            language, phoneNumber, createTime, updateTime, lastLoginTime
 *
 * 2. user_data - 用户数据集合（可根据实际需求命名）
 *    - 字段: _openid, userId, syncTime, 以及自定义的业务字段
 */

// ==================== 九、安全规则 ====================

/**
 * 数据库安全规则:
 * - 只允许用户访问自己的数据（基于 _openid）
 * - 写操作（增删改）需要用户登录
 * - 云函数自动校验用户身份
 */
