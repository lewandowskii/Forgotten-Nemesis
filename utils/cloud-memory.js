// 云端数据同步管理
import AuthAPI from './auth'
import { MemoryStorage } from './memory'

class CloudMemorySync {
  // 同步本地数据到云端
  static async syncToCloud(isSilent = false) {
    try {
      // 检查登录状态
      if (!AuthAPI.checkLoginStatus()) {
        return {
          success: false,
          message: '用户未登录，无法同步数据'
        }
      }

      // 获取本地数据
      const localMemories = MemoryStorage.getMemories()
      if (localMemories.length === 0) {
        return {
          success: true,
          message: '没有数据需要同步'
        }
      }

      // 过滤需要同步的数据（排除已同步的数据）
      const lastSyncTime = wx.getStorageSync('lastSyncTime')
      const dataToSync = localMemories.filter(memory => {
        if (!lastSyncTime) return true
        return new Date(memory.createTime || Date.now()).getTime() > new Date(lastSyncTime).getTime()
      })

      if (dataToSync.length === 0) {
        return {
          success: true,
          message: '数据已是最新'
        }
      }

      // 同步到云端
      const result = await AuthAPI.syncData(dataToSync)
      
      if (result.success && !isSilent) {
        wx.showToast({
          title: `同步成功，已同步${dataToSync.length}条数据`,
          icon: 'success',
          duration: 2000
        })
      }

      return result
    } catch (error) {
      console.error('云端同步失败:', error)
      return {
        success: false,
        message: error.message || '云端同步失败'
      }
    }
  }

  // 从云端拉取数据
  static async syncFromCloud(isSilent = false) {
    try {
      // 检查登录状态
      if (!AuthAPI.checkLoginStatus()) {
        return {
          success: false,
          message: '用户未登录，无法获取数据'
        }
      }

      const result = await AuthAPI.getCloudData()
      
      if (result.success && result.data.length > 0) {
        // 合并云端数据到本地
        const localMemories = MemoryStorage.getMemories()
        const cloudMemories = result.data
        
        // 以云端数据为准，去除重复的本地数据
        const mergedMemories = [...cloudMemories, ...localMemories.filter(local => 
          !cloudMemories.find(cloud => cloud.id === local.id)
        )]
        
        // 保存到本地存储
        wx.setStorageSync('memories', JSON.stringify(mergedMemories))
        
        if (!isSilent) {
            wx.showToast({
                title: `已从云端同步${result.data.length}条数据`,
                icon: 'success',
                duration: 2000
            })
        }
      }

      return result
    } catch (error) {
      console.error('云端数据获取失败:', error)
      return {
        success: false,
        message: error.message || '云端数据获取失败'
      }
    }
  }

  // 双向同步（先上传再下载）
  static async bidirectionalSync(isSilent = false) {
    if (!isSilent) {
      wx.showLoading({
        title: '数据同步中...',
        mask: true
      })
    }

    try {
      // 1. 先同步本地数据到云端
      const uploadResult = await this.syncToCloud(isSilent)
      
      if (!uploadResult.success) {
        if (!isSilent) wx.hideLoading()
        return uploadResult
      }

      // 等待一秒确保云端数据已保存
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 2. 再从云端拉取数据
      const downloadResult = await this.syncFromCloud(isSilent)
      
      if (!isSilent) wx.hideLoading()
      
      if (downloadResult.success && !isSilent) {
        wx.showToast({
          title: '数据同步完成',
          icon: 'success',
          duration: 2000
        })
      }

      return downloadResult
    } catch (error) {
      if (!isSilent) wx.hideLoading()
      return {
        success: false,
        message: error.message || '同步过程中出错'
      }
    }
  }

  // 检查是否需要同步
  static needsSync() {
    const lastSyncTime = wx.getStorageSync('lastSyncTime')
    if (!lastSyncTime) return true
    
    const timeSinceLastSync = Date.now() - new Date(lastSyncTime).getTime()
    const oneHour = 60 * 60 * 1000
    
    // 超过1小时需要同步
    return timeSinceLastSync > oneHour
  }

  // 获取同步状态
  static getSyncStatus() {
    const lastSyncTime = wx.getStorageSync('lastSyncTime')
    if (!lastSyncTime) {
      return {
        status: 'never',
        text: '从未同步',
        color: '#ff6b6b'
      }
    }

    const timeSinceLastSync = Date.now() - new Date(lastSyncTime).getTime()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    
    if (timeSinceLastSync < oneHour) {
      return {
        status: 'recent',
        text: '刚刚同步',
        color: '#52c41a'
      }
    } else if (timeSinceLastSync < oneDay) {
      return {
        status: 'today',
        text: '今天已同步',
        color: '#1890ff'
      }
    } else {
      return {
        status: 'old',
        text: `上次同步: ${lastSyncTime.split('T')[0]}`,
        color: '#faad14'
      }
    }
  }

  // 自动同步（在应用启动时调用）
  static async autoSync() {
    try {
      // 检查登录状态
      if (!AuthAPI.checkLoginStatus()) {
        return false
      }

      // 检查是否需要同步
      if (!this.needsSync()) {
        return true // 不需要同步也算成功
      }

      // 执行静默同步
      const result = await this.bidirectionalSync(true)
      
      return result.success
    } catch (error) {
      console.error('自动同步失败:', error)
      return false
    }
  }
}

module.exports = CloudMemorySync