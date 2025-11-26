// 데이터 접근 서비스 (localStorage / Supabase 추상화)
import { supabase } from '../lib/supabase'

class DataService {
  constructor() {
    // 'localStorage' 또는 'supabase'로 설정
    this.storageType = supabase ? 'supabase' : 'localStorage'
    this.supabase = supabase
  }

  // 결재 데이터 가져오기
  async getApprovals() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase 결재 데이터 조회 오류:', error)
        return []
      }
      
      return (data || []).map(approval => ({
        id: approval.id,
        approvalNumber: approval.approval_number,
        title: approval.title,
        siteId: approval.site_id,
        siteName: approval.site_name,
        author: approval.author,
        content: approval.content,
        attachment: null,
        attachmentFileName: approval.attachment_file_name,
        attachmentData: approval.attachment_data,
        status: approval.status,
        currentStep: approval.current_step,
        totalSteps: approval.total_steps,
        approvers: approval.approvers || [],
        approvals: approval.approvals || [],
        rejectedAt: approval.rejected_at,
        rejectionReason: approval.rejection_reason,
        updatedAt: approval.updated_at,
        originalCreatedAt: approval.original_created_at,
        createdAt: approval.created_at
      }))
    } else {
      return JSON.parse(localStorage.getItem('approvals')) || []
    }
  }

  // 현장 데이터 가져오기
  async getSites() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('sites')
        .select('*')
      
      if (error) {
        console.error('Supabase 현장 데이터 조회 오류:', error)
        return []
      }
      
      return (data || []).map(site => ({
        id: site.id,
        name: site.name,
        location: site.location,
        manager: site.manager,
        steps: site.steps,
        approvers: site.approvers || [],
        createdAt: site.created_at,
        updatedAt: site.updated_at
      }))
    } else {
      return JSON.parse(localStorage.getItem('sites')) || []
    }
  }

  // 승인된 사용자 데이터 가져오기
  async getApprovedUsers() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('approved_users')
        .select('*')
      
      if (error) {
        console.error('Supabase 사용자 데이터 조회 오류:', error)
        return []
      }
      
      return (data || []).map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name,
        phone: user.phone,
        email: user.email,
        approvedAt: user.approved_at,
        approvedBy: user.approved_by,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    } else {
      return JSON.parse(localStorage.getItem('approvedUsers')) || []
    }
  }

  // 결재 데이터 저장
  async saveApproval(approval) {
    if (this.storageType === 'supabase' && this.supabase) {
      let supabaseSiteId = null
      if (approval.siteName) {
        const allSites = await this.getSites()
        const matchingSite = allSites.find(s => s.name === approval.siteName)
        if (matchingSite) {
          supabaseSiteId = matchingSite.id
        }
      }
      
      const supabaseData = {
        approval_number: approval.approvalNumber,
        title: approval.title,
        site_id: supabaseSiteId,
        site_name: approval.siteName,
        author: approval.author,
        content: approval.content,
        attachment_file_name: approval.attachmentFileName,
        attachment_data: approval.attachmentData,
        status: approval.status,
        current_step: approval.currentStep,
        total_steps: approval.totalSteps,
        approvers: approval.approvers || [],
        approvals: approval.approvals || [],
        rejected_at: approval.rejectedAt || null,
        rejection_reason: approval.rejectionReason || null,
        updated_at: approval.updatedAt || null,
        original_created_at: approval.originalCreatedAt || null,
        created_at: approval.createdAt
      }

      const { data, error } = await this.supabase
        .from('approvals')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 결재 저장 오류:', error)
        return null
      }
      
      const savedApproval = data[0]
      return {
        id: savedApproval.id,
        approvalNumber: savedApproval.approval_number,
        title: savedApproval.title,
        siteId: savedApproval.site_id,
        siteName: savedApproval.site_name,
        author: savedApproval.author,
        content: savedApproval.content,
        attachment: null,
        attachmentFileName: savedApproval.attachment_file_name,
        attachmentData: savedApproval.attachment_data,
        status: savedApproval.status,
        currentStep: savedApproval.current_step,
        totalSteps: savedApproval.total_steps,
        approvers: savedApproval.approvers || [],
        approvals: savedApproval.approvals || [],
        rejectedAt: savedApproval.rejected_at,
        rejectionReason: savedApproval.rejection_reason,
        updatedAt: savedApproval.updated_at,
        originalCreatedAt: savedApproval.original_created_at,
        createdAt: savedApproval.created_at
      }
    } else {
      const approvals = JSON.parse(localStorage.getItem('approvals')) || []
      approvals.push(approval)
      localStorage.setItem('approvals', JSON.stringify(approvals))
      return approval
    }
  }

  // 결재 데이터 업데이트
  async updateApproval(approvalId, updates) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseUpdates = {}
      
      if (updates.approvalNumber !== undefined) supabaseUpdates.approval_number = updates.approvalNumber
      if (updates.title !== undefined) supabaseUpdates.title = updates.title
      if (updates.siteId !== undefined) supabaseUpdates.site_id = updates.siteId
      if (updates.siteName !== undefined) supabaseUpdates.site_name = updates.siteName
      if (updates.author !== undefined) supabaseUpdates.author = updates.author
      if (updates.content !== undefined) supabaseUpdates.content = updates.content
      if (updates.attachmentFileName !== undefined) supabaseUpdates.attachment_file_name = updates.attachmentFileName
      if (updates.attachmentData !== undefined) supabaseUpdates.attachment_data = updates.attachmentData
      if (updates.status !== undefined) supabaseUpdates.status = updates.status
      if (updates.currentStep !== undefined) supabaseUpdates.current_step = updates.currentStep
      if (updates.totalSteps !== undefined) supabaseUpdates.total_steps = updates.totalSteps
      if (updates.approvers !== undefined) supabaseUpdates.approvers = updates.approvers
      if (updates.approvals !== undefined) supabaseUpdates.approvals = updates.approvals
      if (updates.rejectedAt !== undefined) supabaseUpdates.rejected_at = updates.rejectedAt
      if (updates.rejectionReason !== undefined) supabaseUpdates.rejection_reason = updates.rejectionReason
      if (updates.updatedAt !== undefined) supabaseUpdates.updated_at = updates.updatedAt
      if (updates.originalCreatedAt !== undefined) supabaseUpdates.original_created_at = updates.originalCreatedAt

      const { data, error } = await this.supabase
        .from('approvals')
        .update(supabaseUpdates)
        .eq('id', approvalId)
        .select()
      
      if (error) {
        console.error('Supabase 결재 업데이트 오류:', error)
        return null
      }
      
      const updatedApproval = data[0]
      return {
        id: updatedApproval.id,
        approvalNumber: updatedApproval.approval_number,
        title: updatedApproval.title,
        siteId: updatedApproval.site_id,
        siteName: updatedApproval.site_name,
        author: updatedApproval.author,
        content: updatedApproval.content,
        attachment: null,
        attachmentFileName: updatedApproval.attachment_file_name,
        attachmentData: updatedApproval.attachment_data,
        status: updatedApproval.status,
        currentStep: updatedApproval.current_step,
        totalSteps: updatedApproval.total_steps,
        approvers: updatedApproval.approvers || [],
        approvals: updatedApproval.approvals || [],
        rejectedAt: updatedApproval.rejected_at,
        rejectionReason: updatedApproval.rejection_reason,
        updatedAt: updatedApproval.updated_at,
        originalCreatedAt: updatedApproval.original_created_at,
        createdAt: updatedApproval.created_at
      }
    } else {
      const approvals = JSON.parse(localStorage.getItem('approvals')) || []
      const index = approvals.findIndex(a => a.id === approvalId)
      if (index !== -1) {
        approvals[index] = { ...approvals[index], ...updates }
        localStorage.setItem('approvals', JSON.stringify(approvals))
        return approvals[index]
      }
      return null
    }
  }

  // 결재 데이터 삭제
  async deleteApproval(approvalId, deletedBy = null) {
    // 먼저 삭제할 결재 데이터 가져오기
    const approvals = await this.getApprovals()
    const approvalToDelete = approvals.find(a => a.id === approvalId)
    
    if (!approvalToDelete) {
      console.error('삭제할 결재를 찾을 수 없습니다.')
      return false
    }

    // 삭제된 결재로 저장
    const deletedApproval = {
      ...approvalToDelete,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || null
    }
    await this.saveDeletedApproval(deletedApproval)

    // 원본 결재 삭제
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('approvals')
        .delete()
        .eq('id', approvalId)
      
      if (error) {
        console.error('Supabase 결재 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const filtered = approvals.filter(a => a.id !== approvalId)
      localStorage.setItem('approvals', JSON.stringify(filtered))
      return true
    }
  }

  // 삭제된 결재 데이터 가져오기
  async getDeletedApprovals() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('deleted_approvals')
        .select('*')
        .order('deleted_at', { ascending: false })
      
      if (error) {
        console.error('Supabase 삭제된 결재 조회 오류:', error)
        return []
      }
      
      return (data || []).map(approval => ({
        id: approval.id,
        approvalNumber: approval.approval_number,
        title: approval.title,
        siteId: approval.site_id,
        siteName: approval.site_name,
        author: approval.author,
        content: approval.content,
        attachment: null,
        attachmentFileName: approval.attachment_file_name,
        attachmentData: approval.attachment_data,
        status: approval.status,
        currentStep: approval.current_step,
        totalSteps: approval.total_steps,
        approvers: approval.approvers || [],
        approvals: approval.approvals || [],
        rejectedAt: approval.rejected_at,
        rejectionReason: approval.rejection_reason,
        updatedAt: approval.updated_at,
        originalCreatedAt: approval.original_created_at,
        createdAt: approval.created_at,
        deletedAt: approval.deleted_at,
        deletedBy: approval.deleted_by
      }))
    } else {
      return JSON.parse(localStorage.getItem('deletedApprovals')) || []
    }
  }

  // 삭제된 결재 저장
  async saveDeletedApproval(approval) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        id: approval.id,
        approval_number: approval.approvalNumber,
        title: approval.title,
        site_id: approval.siteId,
        site_name: approval.siteName,
        author: approval.author,
        content: approval.content,
        attachment_file_name: approval.attachmentFileName || null,
        attachment_data: approval.attachmentData || null,
        status: approval.status,
        current_step: approval.currentStep,
        total_steps: approval.totalSteps,
        approvers: approval.approvers || [],
        approvals: approval.approvals || [],
        rejected_at: approval.rejectedAt || null,
        rejection_reason: approval.rejectionReason || null,
        updated_at: approval.updatedAt || null,
        original_created_at: approval.originalCreatedAt || approval.createdAt,
        created_at: approval.createdAt,
        deleted_at: approval.deletedAt || new Date().toISOString(),
        deleted_by: approval.deletedBy || null
      }

      const { data, error } = await this.supabase
        .from('deleted_approvals')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 삭제된 결재 저장 오류:', error)
        return null
      }
      return data[0]
    } else {
      const deletedApprovals = JSON.parse(localStorage.getItem('deletedApprovals')) || []
      deletedApprovals.push(approval)
      localStorage.setItem('deletedApprovals', JSON.stringify(deletedApprovals))
      return approval
    }
  }

  // 현장 데이터 저장
  async saveSite(site) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        name: site.name,
        location: site.location,
        manager: site.manager,
        steps: site.steps,
        approvers: site.approvers || []
      }

      const { data, error } = await this.supabase
        .from('sites')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 현장 저장 오류:', error)
        return null
      }
      return data[0]
    } else {
      const sites = JSON.parse(localStorage.getItem('sites')) || []
      sites.push(site)
      localStorage.setItem('sites', JSON.stringify(sites))
      return site
    }
  }

  // 현장 데이터 업데이트
  async updateSite(siteId, updates) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('sites')
        .update(updates)
        .eq('id', siteId)
        .select()
      
      if (error) {
        console.error('Supabase 현장 업데이트 오류:', error)
        return null
      }
      return data[0]
    } else {
      const sites = JSON.parse(localStorage.getItem('sites')) || []
      const index = sites.findIndex(s => s.id === siteId)
      if (index !== -1) {
        sites[index] = { ...sites[index], ...updates }
        localStorage.setItem('sites', JSON.stringify(sites))
        return sites[index]
      }
      return null
    }
  }

  // 현장 데이터 삭제
  async deleteSite(siteId) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('sites')
        .delete()
        .eq('id', siteId)
      
      if (error) {
        console.error('Supabase 현장 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const sites = JSON.parse(localStorage.getItem('sites')) || []
      const filtered = sites.filter(s => s.id !== siteId)
      localStorage.setItem('sites', JSON.stringify(filtered))
      return true
    }
  }

  // 승인된 사용자 데이터 저장
  async saveApprovedUser(user) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        username: user.username,
        password: user.password,
        role: user.role,
        name: user.name,
        phone: user.phone || null,
        email: user.email || null,
        approved_at: user.approvedAt || new Date().toISOString(),
        approved_by: user.approvedBy || null
      }

      const { data, error } = await this.supabase
        .from('approved_users')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 사용자 저장 오류:', error)
        return null
      }
      
      const savedUser = data[0]
      return {
        id: savedUser.id,
        username: savedUser.username,
        password: savedUser.password,
        role: savedUser.role,
        name: savedUser.name,
        phone: savedUser.phone,
        email: savedUser.email,
        approvedAt: savedUser.approved_at,
        approvedBy: savedUser.approved_by,
        createdAt: savedUser.created_at,
        updatedAt: savedUser.updated_at
      }
    } else {
      const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || []
      approvedUsers.push(user)
      localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers))
      return user
    }
  }

  // 승인된 사용자 데이터 업데이트
  async updateApprovedUser(username, updates) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseUpdates = {}
      if (updates.username !== undefined) supabaseUpdates.username = updates.username
      if (updates.password !== undefined) supabaseUpdates.password = updates.password
      if (updates.role !== undefined) supabaseUpdates.role = updates.role
      if (updates.name !== undefined) supabaseUpdates.name = updates.name
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone
      if (updates.email !== undefined) supabaseUpdates.email = updates.email
      if (updates.approvedAt !== undefined) supabaseUpdates.approved_at = updates.approvedAt
      if (updates.approvedBy !== undefined) supabaseUpdates.approved_by = updates.approvedBy
      
      const { data, error } = await this.supabase
        .from('approved_users')
        .update(supabaseUpdates)
        .eq('username', username)
        .select()
      
      if (error) {
        console.error('Supabase 사용자 업데이트 오류:', error)
        return null
      }
      
      const updatedUser = data[0]
      return {
        id: updatedUser.id,
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        approvedAt: updatedUser.approved_at,
        approvedBy: updatedUser.approved_by,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      }
    } else {
      const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || []
      const index = approvedUsers.findIndex(u => u.username === username)
      if (index !== -1) {
        approvedUsers[index] = { ...approvedUsers[index], ...updates }
        localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers))
        return approvedUsers[index]
      }
      return null
    }
  }

  // 승인된 사용자 데이터 삭제
  async deleteApprovedUser(username) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('approved_users')
        .delete()
        .eq('username', username)
      
      if (error) {
        console.error('Supabase 사용자 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers')) || []
      const filtered = approvedUsers.filter(u => u.username !== username)
      localStorage.setItem('approvedUsers', JSON.stringify(filtered))
      return true
    }
  }

  // 회원가입 요청 데이터 가져오기
  async getUserRequests() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('user_requests')
        .select('*')
        .order('requested_at', { ascending: false })
      
      if (error) {
        console.error('Supabase 회원가입 요청 조회 오류:', error)
        return []
      }
      return data || []
    } else {
      return JSON.parse(localStorage.getItem('userRequests')) || []
    }
  }

  // 회원가입 요청 저장
  async saveUserRequest(request) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        username: request.username,
        password: request.password,
        role: request.role,
        name: request.name,
        phone: request.phone || null,
        email: request.email || null,
        status: request.status || 'pending',
        requested_at: request.requestedAt || new Date().toISOString(),
        approved_at: request.approvedAt || null,
        approved_by: request.approvedBy || null
      }

      const { data, error } = await this.supabase
        .from('user_requests')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 회원가입 요청 저장 오류:', error)
        return null
      }
      return data[0]
    } else {
      const userRequests = JSON.parse(localStorage.getItem('userRequests')) || []
      userRequests.push(request)
      localStorage.setItem('userRequests', JSON.stringify(userRequests))
      return request
    }
  }

  // 회원가입 요청 업데이트
  async updateUserRequest(requestId, updates) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('user_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
      
      if (error) {
        console.error('Supabase 회원가입 요청 업데이트 오류:', error)
        return null
      }
      return data[0]
    } else {
      const userRequests = JSON.parse(localStorage.getItem('userRequests')) || []
      const index = userRequests.findIndex(r => r.id === requestId)
      if (index !== -1) {
        userRequests[index] = { ...userRequests[index], ...updates }
        localStorage.setItem('userRequests', JSON.stringify(userRequests))
        return userRequests[index]
      }
      return null
    }
  }

  // 삭제된 사용자 데이터 가져오기
  async getDeletedUsers() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('deleted_users')
        .select('*')
        .order('deleted_at', { ascending: false })
      
      if (error) {
        console.error('Supabase 삭제된 사용자 조회 오류:', error)
        return []
      }
      return data || []
    } else {
      return JSON.parse(localStorage.getItem('deletedUsers')) || []
    }
  }

  // 삭제된 사용자 저장
  async saveDeletedUser(user) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        username: user.username,
        password: user.password || null,
        role: user.role || null,
        name: user.name || null,
        phone: user.phone || null,
        email: user.email || null,
        deleted_at: user.deletedAt || new Date().toISOString(),
        deleted_by: user.deletedBy || null
      }

      const { data, error } = await this.supabase
        .from('deleted_users')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 삭제된 사용자 저장 오류:', error)
        return null
      }
      return data[0]
    } else {
      const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || []
      deletedUsers.push(user)
      localStorage.setItem('deletedUsers', JSON.stringify(deletedUsers))
      return user
    }
  }

  // 삭제된 사용자 삭제 (복구 시 사용)
  async deleteDeletedUser(username) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('deleted_users')
        .delete()
        .eq('username', username)
      
      if (error) {
        console.error('Supabase 삭제된 사용자 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || []
      const filtered = deletedUsers.filter(u => u.username !== username)
      localStorage.setItem('deletedUsers', JSON.stringify(filtered))
      return true
    }
  }

  // 삭제된 사용자 영구 삭제
  async permanentlyDeleteUser(username) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('deleted_users')
        .delete()
        .eq('username', username)
      
      if (error) {
        console.error('Supabase 삭제된 사용자 영구 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const deletedUsers = JSON.parse(localStorage.getItem('deletedUsers')) || []
      const filtered = deletedUsers.filter(u => u.username !== username)
      localStorage.setItem('deletedUsers', JSON.stringify(filtered))
      return true
    }
  }

  // 알림 데이터 가져오기
  async getNotifications() {
    if (this.storageType === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('Supabase 알림 조회 오류:', error)
        return []
      }
      return (data || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        approvalId: n.approval_id,
        userId: n.user_id,
        read: n.read,
        createdAt: n.created_at
      }))
    } else {
      return JSON.parse(localStorage.getItem('notifications')) || []
    }
  }

  // 알림 저장
  async saveNotification(notification) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseData = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        approval_id: notification.approvalId || null,
        user_id: notification.userId || null,
        read: notification.read || false
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .insert([supabaseData])
        .select()
      
      if (error) {
        console.error('Supabase 알림 저장 오류:', error)
        return null
      }
      return {
        id: data[0].id,
        type: data[0].type,
        title: data[0].title,
        message: data[0].message,
        approvalId: data[0].approval_id,
        userId: data[0].user_id,
        read: data[0].read,
        createdAt: data[0].created_at
      }
    } else {
      const notifications = JSON.parse(localStorage.getItem('notifications')) || []
      notifications.push(notification)
      if (notifications.length > 100) {
        notifications.splice(0, notifications.length - 100)
      }
      localStorage.setItem('notifications', JSON.stringify(notifications))
      return notification
    }
  }

  // 알림 업데이트
  async updateNotification(notificationId, updates) {
    if (this.storageType === 'supabase' && this.supabase) {
      const supabaseUpdates = {}
      if (updates.read !== undefined) supabaseUpdates.read = updates.read

      const { data, error } = await this.supabase
        .from('notifications')
        .update(supabaseUpdates)
        .eq('id', notificationId)
        .select()
      
      if (error) {
        console.error('Supabase 알림 업데이트 오류:', error)
        return null
      }
      return {
        id: data[0].id,
        type: data[0].type,
        title: data[0].title,
        message: data[0].message,
        approvalId: data[0].approval_id,
        userId: data[0].user_id,
        read: data[0].read,
        createdAt: data[0].created_at
      }
    } else {
      const notifications = JSON.parse(localStorage.getItem('notifications')) || []
      const index = notifications.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        notifications[index] = { ...notifications[index], ...updates }
        localStorage.setItem('notifications', JSON.stringify(notifications))
        return notifications[index]
      }
      return null
    }
  }

  // 알림 삭제
  async deleteNotification(notificationId) {
    if (this.storageType === 'supabase' && this.supabase) {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) {
        console.error('Supabase 알림 삭제 오류:', error)
        return false
      }
      return true
    } else {
      const notifications = JSON.parse(localStorage.getItem('notifications')) || []
      const filtered = notifications.filter(n => n.id !== notificationId)
      localStorage.setItem('notifications', JSON.stringify(filtered))
      return true
    }
  }

  // 월별 결재 데이터 가져오기
  async getMonthlyApprovals(year, month) {
    const allApprovals = await this.getApprovals()
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    return allApprovals.filter(approval => {
      const approvalDate = new Date(approval.createdAt || approval.created_at)
      return approvalDate >= startDate && approvalDate <= endDate
    })
  }
}

// 전역 DataService 인스턴스
export const dataService = new DataService()

