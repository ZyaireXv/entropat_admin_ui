<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="提示词类型" prop="promptType">
        <el-input
          v-model="queryParams.promptType"
          placeholder="请输入提示词类型"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select
          v-model="queryParams.role"
          placeholder="请选择角色"
          clearable
          class="!w-240px"
        >
          <el-option label="系统 (system)" value="system" />
          <el-option label="助手 (assistant)" value="assistant" />
          <el-option label="用户 (user)" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型来源" prop="modelSource">
        <el-select
          v-model="queryParams.modelSource"
          placeholder="请选择模型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="model in modelList"
            :key="model.model"
            :label="model.name"
            :value="model.model"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="active">
        <el-select
          v-model="queryParams.active"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <!-- <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['entropat:prompt:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button> -->
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="提示词类型" align="center" prop="promptType" width="150" />
      <el-table-column label="版本号" align="center" prop="version" width="100" />
      <el-table-column label="角色" align="center" prop="role" width="120" />
      <el-table-column label="模型来源" align="center" prop="modelSource" width="150" />
      <el-table-column label="状态" align="center" prop="active" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.active"
            @change="handleActiveChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="提示内容" align="left" prop="content" show-overflow-tooltip>
        <template #default="scope">
          <div class="line-clamp-2">{{ scope.row.content }}</div>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <PromptForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import * as PromptApi from '@/api/entropat/prompt'
import PromptForm from './PromptForm.vue'
import { ModelApi, ModelVO } from '@/api/ai/model/model'

defineOptions({ name: 'EntropatPrompt' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<PromptApi.PromptVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  promptType: null,
  role: null,
  modelSource: null,
  active: null
})
const queryFormRef = ref() // 搜索的表单
const modelList = ref<ModelVO[]>([]) // 模型列表
// const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PromptApi.getPromptPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 修改状态操作 */
const handleActiveChange = async (row: PromptApi.PromptVO) => {
  try {
    // 确认提示
    await message.confirm('确认要修改该提示词的状态吗？')
    // 发起修改状态
    await PromptApi.activatePrompt(row.id)
    message.success('状态更新成功')
  } catch {
    // 撤销状态的回显：如果取消修改或 API 请求失败
    row.active = !row.active
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PromptApi.deletePrompt(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
// const handleExport = async () => {
//   try {
//     // 导出的二次确认
//     await message.exportConfirm()
//     // 发起导出
//     exportLoading.value = true
//     const data = await PromptApi.exportPrompt(queryParams)
//     download.excel(data, '提示词配置.xls')
//   } catch {
//   } finally {
//     exportLoading.value = false
//   }
// }

/** 初始化 **/
onMounted(async () => {
  getList()
  modelList.value = await ModelApi.getModelSimpleList(1)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-clamp: 2;
}
</style>
