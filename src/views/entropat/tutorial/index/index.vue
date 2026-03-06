<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="教程标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入教程标题"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option label="启用" :value="0" />
          <el-option label="停用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="封面" align="center" prop="coverUrl" width="120">
        <template #default="scope">
          <el-image
            :src="scope.row.coverUrl"
            class="h-60px w-100px rounded-6px"
            fit="cover"
            :preview-src-list="[scope.row.coverUrl]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column label="标题" align="left" prop="title" min-width="220" />
      <el-table-column label="简介" align="left" prop="description" min-width="260" show-overflow-tooltip />
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'info'">
            {{ scope.row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="视频链接" align="left" min-width="280">
        <template #default="scope">
          <el-link :href="scope.row.videoUrl" target="_blank" type="primary" :underline="false">
            {{ scope.row.videoUrl }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" fixed="right" width="140">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <TutorialVideoForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import * as TutorialVideoApi from '@/api/entropat/tutorial'
import TutorialVideoForm from './TutorialVideoForm.vue'

/**
 * 教程视频管理
 *
 * 页面按“可配置内容”建模，而不是固定写死 5 条：
 * 管理员新增/停用后，首页列表会即时按状态与排序生效。
 */
defineOptions({ name: 'EntropatTutorialVideo' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(false)
const list = ref<TutorialVideoApi.TutorialVideoVO[]>([])
const total = ref(0)

const queryParams = reactive<TutorialVideoApi.TutorialVideoPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  status: undefined
})

const queryFormRef = ref()
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TutorialVideoApi.getTutorialVideoPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 新增/编辑 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await TutorialVideoApi.deleteTutorialVideo(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
