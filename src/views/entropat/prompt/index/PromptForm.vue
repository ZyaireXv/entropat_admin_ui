<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="提示词类型" prop="promptType">
        <el-input v-model="formData.promptType" placeholder="请输入提示词类型" />
      </el-form-item>
      <el-form-item label="版本号" prop="version">
        <el-input-number v-model="formData.version" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="formData.role" placeholder="请选择角色" clearable class="w-full">
          <el-option label="系统 (system)" value="system" />
          <el-option label="助手 (assistant)" value="assistant" />
          <el-option label="用户 (user)" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型来源" prop="modelSource">
        <el-select v-model="formData.modelSource" placeholder="请选择模型" clearable class="w-full">
          <el-option
            v-for="model in modelList"
            :key="model.model"
            :label="model.name"
            :value="model.model"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="显示顺序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="是否启用" prop="active">
        <el-switch v-model="formData.active" />
      </el-form-item>
      <el-form-item label="提示词内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 10 }"
          placeholder="请输入提示词内容"
        />
      </el-form-item>
      <el-form-item label="输出格式" prop="outFormat">
        <el-input
          v-model="formData.outFormat"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          placeholder="请输入输出格式要求"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :disabled="formLoading">确 定</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as PromptApi from '@/api/entropat/prompt'
import { FormInstance, FormRules } from 'element-plus'
import { ModelApi, ModelVO } from '@/api/ai/model/model'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<PromptApi.PromptVO>({
  id: undefined as unknown as number,
  promptType: undefined as unknown as string,
  version: 1,
  active: true,
  sort: 0,
  role: undefined as unknown as string,
  content: undefined as unknown as string,
  outFormat: undefined as unknown as string,
  modelSource: undefined as unknown as string
})
const modelList = ref<ModelVO[]>([]) // 模型列表
const formRules = reactive<FormRules>({
  promptType: [{ required: true, message: '提示词类型不能为空', trigger: 'blur' }],
  role: [{ required: true, message: '角色不能为空', trigger: 'change' }],
  content: [{ required: true, message: '提示词内容不能为空', trigger: 'blur' }],
  modelSource: [{ required: true, message: '模型来源不能为空', trigger: 'change' }]
})
const formRef = ref<FormInstance>() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增提示词' : '修改提示词'
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await PromptApi.getPromptInfo(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await PromptApi.createPrompt(data)
      message.success(t('common.createSuccess'))
    } else {
      await PromptApi.updatePrompt(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined as unknown as number,
    promptType: undefined as unknown as string,
    version: 1,
    active: true,
    sort: 0,
    role: undefined as unknown as string,
    content: undefined as unknown as string,
    outFormat: undefined as unknown as string,
    modelSource: undefined as unknown as string
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  // 获得模型列表 (Type 1 通常代表对话模型，如果不是 1，可以传 undefined 或者相应类型)
  modelList.value = await ModelApi.getModelSimpleList(1)
})
</script>
