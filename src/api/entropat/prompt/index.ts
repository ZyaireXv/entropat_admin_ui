import request from '@/config/axios'

export interface PromptVO {
  id: number
  promptType: string
  version: number
  active: boolean
  sort: number
  role: string
  content: string
  outFormat: string
  modelSource: string
  createTime?: Date
}

// 查询提示词列表 (分页)
export const getPromptPage = async (params: any) => {
  return await request.get({ url: `/app/appPatentPrompt/list`, params })
}

// 导出提示词列表
export const exportPrompt = async (params: any) => {
  return await request.download({ url: `/app/appPatentPrompt/export`, params })
}

// 获取提示词详细信息
export const getPromptInfo = async (id: number) => {
  return await request.get({ url: `/app/appPatentPrompt/` + id })
}

// 新增提示词
export const createPrompt = async (data: PromptVO) => {
  return await request.post({ url: `/app/appPatentPrompt`, data })
}

// 修改提示词
export const updatePrompt = async (data: PromptVO) => {
  return await request.put({ url: `/app/appPatentPrompt`, data })
}

// 删除提示词
export const deletePrompt = async (id: number) => {
  return await request.delete({ url: `/app/appPatentPrompt/` + id })
}

// 激活提示词
export const activatePrompt = async (id: number) => {
  return await request.post({ url: `/app/appPatentPrompt/activate/` + id })
}
