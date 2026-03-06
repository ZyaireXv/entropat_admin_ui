<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="920px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-alert
        v-if="!hasPublicConfigId"
        type="warning"
        :closable="false"
        show-icon
        title="未配置公开桶ID：上传模式不可用，请改用外部链接或先补齐配置。"
        class="mb-16px"
      />

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="教程标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入教程标题" maxlength="100" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序值" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :precision="0" class="!w-240px" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="教程简介" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入教程简介"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="封面来源" required>
        <el-radio-group v-model="sourceMode.cover" @change="() => handleSourceModeChange('cover')">
          <el-radio value="upload" :disabled="!hasPublicConfigId">上传到公开OSS</el-radio>
          <el-radio value="url">外部链接</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="封面图片" prop="coverUrl">
        <UploadImg
          v-if="sourceMode.cover === 'upload'"
          v-model="formData.coverUrl"
          directory="patent/tutorial/cover"
          :config-id="resolvedPublicConfigId"
          width="220px"
          height="140px"
          :show-btn-text="false"
        >
          <template #tip>
            建议尺寸 16:9，支持 jpg/png/gif，大小不超过 5MB
          </template>
        </UploadImg>
        <el-input
          v-else
          v-model="formData.coverUrl"
          placeholder="请输入封面公网 URL（http/https）"
        />
      </el-form-item>

      <el-form-item label="视频来源" required>
        <el-radio-group v-model="sourceMode.video" @change="() => handleSourceModeChange('video')">
          <el-radio value="upload" :disabled="!hasPublicConfigId">上传到公开OSS</el-radio>
          <el-radio value="url">外部链接</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="视频文件" prop="videoUrl">
        <UploadFile
          v-if="sourceMode.video === 'upload'"
          v-model="formData.videoUrl"
          :limit="1"
          :file-type="['mp4', 'mov', 'm4v', 'webm']"
          :file-size="1024"
          directory="patent/tutorial/video"
          :config-id="resolvedPublicConfigId"
        />
        <el-input
          v-else
          v-model="formData.videoUrl"
          placeholder="请输入视频公网 URL（http/https）"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { CommonStatusEnum } from '@/utils/constants'
import * as TutorialVideoApi from '@/api/entropat/tutorial'

/**
 * 教程视频表单
 *
 * 为什么把“上传”和“外部链接”做成互斥：
 * 1. 避免同一个字段同时存在两种来源，降低误填概率；
 * 2. 管理员操作路径更清晰：要么上传到公开桶，要么明确使用外链；
 * 3. 互斥后校验逻辑简单，减少后续维护歧义。
 */
defineOptions({ name: 'TutorialVideoForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const publicConfigId = Number(import.meta.env.VITE_PATENT_TUTORIAL_PUBLIC_FILE_CONFIG_ID || 0)
const hasPublicConfigId = computed(() => publicConfigId > 0)
const resolvedPublicConfigId = computed(() => (hasPublicConfigId.value ? publicConfigId : undefined))

const sourceMode = ref({
  cover: 'upload',
  video: 'upload'
})

const formData = ref<TutorialVideoApi.TutorialVideoVO>({
  id: undefined,
  title: '',
  description: '',
  coverUrl: '',
  videoUrl: '',
  sort: 10,
  status: CommonStatusEnum.ENABLE
})

const formRules = reactive({
  title: [{ required: true, message: '教程标题不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '教程简介不能为空', trigger: 'blur' }],
  coverUrl: [{ required: true, message: '请上传封面或填写封面链接', trigger: 'blur' }],
  videoUrl: [{ required: true, message: '请上传视频或填写视频链接', trigger: 'blur' }],
  sort: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

/**
 * 切换来源模式时清空值。
 *
 * 原因：上一种模式产生的值如果被沿用，会让“互斥”在数据层失效，
 * 看起来切了模式，实际提交的还是旧值，容易造成误解。
 */
const handleSourceModeChange = (target: 'cover' | 'video') => {
  if (target === 'cover') {
    formData.value.coverUrl = ''
    formRef.value?.clearValidate?.(['coverUrl'])
    return
  }
  formData.value.videoUrl = ''
  formRef.value?.clearValidate?.(['videoUrl'])
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await TutorialVideoApi.getTutorialVideo(id)
      // 编辑场景下优先按“链接模式”回显，避免误导为“刚上传完成”。
      sourceMode.value.cover = 'url'
      sourceMode.value.video = 'url'
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return

  if (!hasPublicConfigId.value && (sourceMode.value.cover === 'upload' || sourceMode.value.video === 'upload')) {
    message.error('未配置公开桶ID，无法使用上传模式，请改为外部链接或先完成配置。')
    return
  }

  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    const data = formData.value as TutorialVideoApi.TutorialVideoVO
    if (formType.value === 'create') {
      await TutorialVideoApi.createTutorialVideo(data)
      message.success(t('common.createSuccess'))
    } else {
      await TutorialVideoApi.updateTutorialVideo(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    title: '',
    description: '',
    coverUrl: '',
    videoUrl: '',
    sort: 10,
    status: CommonStatusEnum.ENABLE
  }
  sourceMode.value.cover = hasPublicConfigId.value ? 'upload' : 'url'
  sourceMode.value.video = hasPublicConfigId.value ? 'upload' : 'url'
  formRef.value?.resetFields()
}
</script>
