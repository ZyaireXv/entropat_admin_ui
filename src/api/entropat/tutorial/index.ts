import request from '@/config/axios'

export interface TutorialVideoVO {
  id?: number
  title: string
  description: string
  coverUrl: string
  videoUrl: string
  sort: number
  status: number
  createTime?: string
}

export interface TutorialVideoPageReqVO {
  pageNo: number
  pageSize: number
  title?: string
  status?: number
}

// 分页查询教程视频
export const getTutorialVideoPage = async (params: TutorialVideoPageReqVO) => {
  return await request.get({ url: '/patent/tutorial-video/page', params })
}

// 获取教程视频详情
export const getTutorialVideo = async (id: number) => {
  return await request.get({ url: '/patent/tutorial-video/get', params: { id } })
}

// 创建教程视频
export const createTutorialVideo = async (data: TutorialVideoVO) => {
  return await request.post({ url: '/patent/tutorial-video/create', data })
}

// 更新教程视频
export const updateTutorialVideo = async (data: TutorialVideoVO) => {
  return await request.put({ url: '/patent/tutorial-video/update', data })
}

// 删除教程视频
export const deleteTutorialVideo = async (id: number) => {
  return await request.delete({ url: '/patent/tutorial-video/delete', params: { id } })
}
