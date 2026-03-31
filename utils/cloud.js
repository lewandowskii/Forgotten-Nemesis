// 云开发API工具类
class CloudAPI {
  static async callFunction(name, data) {
    try {
      const result = await wx.cloud.callFunction({
        name: name,
        data: data
      })
      return result.result
    } catch (error) {
      console.error('云函数调用失败:', error)
      return {
        success: false,
        message: error.message || '云函数调用失败'
      }
    }
  }

  // 用户相关API
  static async login(userInfo) {
    return await this.callFunction('user', {
      action: 'login',
      userInfo: userInfo
    })
  }

  static async getUserInfo() {
    return await this.callFunction('user', {
      action: 'getUserInfo'
    })
  }

  static async createUserInfo(userInfo) {
    return await this.callFunction('user', {
      action: 'createUser',
      userInfo: userInfo
    })
  }

  static async updateUserInfo(userId, updateData) {
    return await this.callFunction('user', {
      action: 'updateUser',
      userId,
      updateData
    })
  }

  // 数据同步API
  static async syncData(userId, data) {
    return await this.callFunction('user', {
      action: 'syncData',
      userId,
      data
    })
  }

  static async getSyncData(userId, lastSyncTime) {
    return await this.callFunction('user', {
      action: 'getSyncData',
      userId,
      lastSyncTime
    })
  }

  // 文件上传API
  static async uploadFile(filePath, cloudPath) {
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })
      return {
        success: true,
        fileID: result.fileID
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      return {
        success: false,
        message: error.message || '文件上传失败'
      }
    }
  }

  static async uploadMultipleFiles(filePaths, cloudPathPrefix) {
    try {
      const results = []
      for (let i = 0; i < filePaths.length; i++) {
        const cloudPath = `${cloudPathPrefix}/${Date.now()}_${i}.jpg`
        const result = await this.uploadFile(filePaths[i], cloudPath)
        results.push(result)
      }
      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('批量文件上传失败:', error)
      return {
        success: false,
        message: error.message || '批量文件上传失败'
      }
    }
  }

  static async deleteFile(fileID) {
    try {
      const result = await wx.cloud.deleteFile({
        fileList: [fileID]
      })
      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('文件删除失败:', error)
      return {
        success: false,
        message: error.message || '文件删除失败'
      }
    }
  }

  // 获取文件临时链接
  static async getTempFileURL(fileID) {
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      })
      return {
        success: true,
        tempFileURL: result.fileList[0].tempFileURL
      }
    } catch (error) {
      console.error('获取文件链接失败:', error)
      return {
        success: false,
        message: error.message || '获取文件链接失败'
      }
    }
  }

  static async getTempFileURLs(fileIDs) {
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: fileIDs
      })
      return {
        success: true,
        tempFileURLs: result.fileList.map(item => item.tempFileURL)
      }
    } catch (error) {
      console.error('批量获取文件链接失败:', error)
      return {
        success: false,
        message: error.message || '批量获取文件链接失败'
      }
    }
  }

  // 数据库操作 - 通过云函数
  static async uploadData(collectionName, data) {
    return await this.callFunction('dataSync', {
      action: 'upload',
      collectionName,
      data
    })
  }

  static async batchUploadData(collectionName, dataArray) {
    return await this.callFunction('dataSync', {
      action: 'batchUpload',
      collectionName,
      dataArray
    })
  }

  static async updateData(collectionName, where, data) {
    return await this.callFunction('dataSync', {
      action: 'update',
      collectionName,
      where,
      data
    })
  }

  static async deleteData(collectionName, where) {
    return await this.callFunction('dataSync', {
      action: 'delete',
      collectionName,
      where
    })
  }

  static async queryData(collectionName, where, limit, skip, orderBy) {
    return await this.callFunction('dataSync', {
      action: 'query',
      collectionName,
      where,
      limit,
      skip,
      orderBy
    })
  }

  static async getDataById(collectionName, id) {
    return await this.callFunction('dataSync', {
      action: 'getById',
      collectionName,
      id
    })
  }

  static async syncCollection(collectionName, lastSyncTime) {
    return await this.callFunction('dataSync', {
      action: 'sync',
      collectionName,
      lastSyncTime
    })
  }

  static async countData(collectionName, where) {
    return await this.callFunction('dataSync', {
      action: 'count',
      collectionName,
      where
    })
  }

  // 数据库操作 - 直接调用
  static async add(collectionName, data) {
    try {
      const db = wx.cloud.database()
      const result = await db.collection(collectionName).add({
        data: {
          ...data,
          createTime: new Date()
        }
      })
      return {
        success: true,
        _id: result._id
      }
    } catch (error) {
      console.error('数据库添加失败:', error)
      return {
        success: false,
        message: error.message || '数据库添加失败'
      }
    }
  }

  static async update(collectionName, where, data) {
    try {
      const db = wx.cloud.database()
      const result = await db.collection(collectionName).where(where).update({
        data: {
          ...data,
          updateTime: new Date()
        }
      })
      return {
        success: true,
        stats: result.stats
      }
    } catch (error) {
      console.error('数据库更新失败:', error)
      return {
        success: false,
        message: error.message || '数据库更新失败'
      }
    }
  }

  static async query(collectionName, where = {}, limit = 20, skip = 0) {
    try {
      const db = wx.cloud.database()
      const result = await db.collection(collectionName)
        .where(where)
        .limit(limit)
        .skip(skip)
        .orderBy('createTime', 'desc')
        .get()

      return {
        success: true,
        data: result.data,
        total: result.data.length
      }
    } catch (error) {
      console.error('数据库查询失败:', error)
      return {
        success: false,
        message: error.message || '数据库查询失败'
      }
    }
  }
}

module.exports = CloudAPI
