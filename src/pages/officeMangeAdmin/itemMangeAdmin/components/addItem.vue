<template>
  <div class="office-item-add-container">
    <t-card :bordered="false" class="form-card">
      <t-form ref="formRef" :data="formData" :rules="formRules" :label-width="100" @submit="handleSubmit">
        <t-row :gutter="[24, 24]">
          <!-- 物品编码 -->
          <t-col :span="6">
            <t-form-item label="物品编码" name="goods_code" required>
              <t-input v-model="formData.goods_code" placeholder="请输入物品编码" />
            </t-form-item>
          </t-col>

          <!-- 物品名称 -->
          <t-col :span="6">
            <t-form-item label="物品名称" name="goods_name" required>
              <t-input v-model="formData.goods_name" placeholder="请输入物品名称" />
            </t-form-item>
          </t-col>

          <!-- 物品分类 -->
          <t-col :span="6">
            <t-form-item label="物品分类" name="goods_cate" required>
              <t-select
                v-model="formData.goods_cate"
                :options="categoryOptions"
                placeholder="请选择物品分类"
                clearable
              />
            </t-form-item>
          </t-col>

          <!-- 物品属性 -->
          <t-col :span="6">
            <t-form-item label="物品属性" name="goods_attr" required>
              <t-select
                v-model="formData.goods_attr"
                :options="attributeOptions"
                placeholder="请选择物品属性"
                clearable
              />
            </t-form-item>
          </t-col>

          <!-- 物品位置 -->
          <t-col :span="6">
            <t-form-item label="物品位置" name="goods_location" required>
              <t-input v-model="formData.goods_location" placeholder="请输入物品位置" />
            </t-form-item>
          </t-col>

          <!-- 物库存数量 -->
          <t-col :span="6">
            <t-form-item label="物库存数量" name="stock_num" required>
              <t-input-number v-model="formData.stock_num" :min="0" theme="column" placeholder="请输入库存数量" />
            </t-form-item>
          </t-col>

          <!-- 物品照片 -->
          <t-col :span="12">
            <t-form-item label="物品照片" name="attachments">
              <base-upload
                v-model="formData.attachments"
                :upload-action="uploadAction"
                :multiple="true"
                button-text="选择附件"
                tips="支持格式:.rar .zip .doc .docx .pdf,单个文件不能超过20MB"
                :max-size="20"
                :allowed-types="['.rar', '.zip', '.doc', '.docx', '.pdf']"
              />
            </t-form-item>
          </t-col>

          <!-- 备注信息 -->
          <t-col :span="12">
            <t-form-item label="备注信息" name="remark">
              <t-textarea
                v-model="formData.remark"
                placeholder="请输入备注信息"
                :maxlength="300"
                show-word-limit
                :autosize="{ minRows: 4, maxRows: 8 }"
              />
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 底部按钮 -->
        <t-form-item>
          <div class="form-actions">
            <t-button theme="default" variant="outline" @click="handleCancel">取消</t-button>
            <t-button type="submit" theme="primary">保存</t-button>
          </div>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRules, SubmitContext, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { addOfficeGoods, editOfficeGoods, getOfficeGoodsDetail } from '@/api/office';
import BaseUpload from '@/components/BaseUpload/index.vue';

defineOptions({
  name: 'OfficeItemAdd',
});

const props = defineProps<{
  mode?: 'add' | 'edit';
}>();

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstanceFunctions>();

// 表单数据
const formData = reactive({
  id: '' as string | number | undefined,
  goods_code: '',
  goods_name: '',
  goods_cate: '',
  goods_attr: '',
  goods_location: '',
  stock_num: 0,
  attachments: [] as UploadFile[],
  remark: '',
});

// 上传地址（参照合同添加页面）
const uploadAction = ref('/api/dict/upload');

// 分类选项（示例数据，后续可替换为接口数据）
const categoryOptions = ref([
  { label: '办公', value: '办公' },
  { label: '电子', value: '电子' },
  { label: '家具', value: '家具' },
]);

// 物品属性选项
const attributeOptions = ref([
  { label: '耗材', value: '耗材' },
  { label: '其他', value: '其他' },
]);

// 校验规则
const formRules: FormRules<typeof formData> = {
  goods_code: [
    { required: true, message: '请输入物品编码', type: 'error', trigger: 'blur' },
    { min: 2, max: 50, message: '物品编码长度为2-50个字符', type: 'error', trigger: 'blur' },
  ],
  goods_name: [
    { required: true, message: '请输入物品名称', type: 'error', trigger: 'blur' },
    { min: 2, max: 255, message: '物品名称长度为2-255个字符', type: 'error', trigger: 'blur' },
  ],
  goods_cate: [{ required: true, message: '请选择物品分类', type: 'error', trigger: 'change' }],
  goods_attr: [{ required: true, message: '请选择物品属性', type: 'error', trigger: 'change' }],
  goods_location: [{ required: true, message: '请输入物品位置', type: 'error', trigger: 'blur' }],
  stock_num: [{ required: true, message: '请输入库存数量', type: 'error', trigger: 'blur' }],
};

// 加载编辑详情
const loadDetail = async () => {
  if (props.mode !== 'edit') return;
  const id = route.query.id as string | undefined;
  if (!id) {
    MessagePlugin.error('缺少物品ID');
    return;
  }
  formData.id = id;
  try {
    const res = await getOfficeGoodsDetail(id);
    if (res.code === 0 || res.code === 200) {
      const detail = res.data || {};
      // 映射API返回的字段到表单字段
      Object.assign(formData, detail);
      // 处理图片数组，转换为UploadFile格式
      detail.goods_img = detail.goods_img.split(',');
      if (detail.goods_img && Array.isArray(detail.goods_img) && detail.goods_img.length > 0) {
        formData.attachments = detail.goods_img.map((url: string) => ({
          url,
          name: url.split('/').pop() || 'image',
          status: 'success',
        })) as UploadFile[];
      }
    } else {
      MessagePlugin.error(res.msg || '获取物品详情失败');
    }
  } catch (error: any) {
    console.error('获取物品详情失败:', error);
    MessagePlugin.error('获取物品详情失败，请重试');
  }
};

// 取消
const handleCancel = () => {
  router.back();
};

// 格式化附件为数组格式（goods_img）
const formatAttachments = (files: UploadFile[]) => {
  if (!files || files.length === 0) return [];
  return files
    .filter((file) => file.url || (file as any).response) // 只处理已上传成功的文件
    .map((file) => {
      const resp: any = (file as any).response || {};
      const fileUrl = file.url || resp.url || resp.data?.url || resp.data?.file_url || '';
      return fileUrl; // goods_img 是字符串数组
    });
};

// 提交
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult !== true) {
    if (firstError) {
      MessagePlugin.warning(firstError);
    }
    return;
  }

  try {
    // 组装提交参数（按照API接口参数格式）
    const payload: any = {
      goods_code: formData.goods_code.trim(),
      goods_name: formData.goods_name.trim(),
      goods_cate: formData.goods_cate,
      stock_num: String(formData.stock_num), // 转为字符串
      goods_attr: formData.goods_attr,
      goods_location: formData.goods_location.trim(),
      goods_img: formatAttachments(formData.attachments || []).toString(), // 数组格式
      remark: formData.remark.trim() || '',
    };

    // 编辑模式需要传id
    if (props.mode === 'edit' && formData.id) {
      payload.id = formData.id;
    }

    let response;
    if (props.mode === 'edit' && formData.id) {
      // 编辑模式
      response = await editOfficeGoods(payload);
    } else {
      // 新增模式
      response = await addOfficeGoods(payload);
    }

    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success(props.mode === 'edit' ? '编辑物品成功' : '新增物品成功');
      router.back();
    } else {
      MessagePlugin.error(
        response.msg || response.message || (props.mode === 'edit' ? '编辑物品失败' : '新增物品失败'),
      );
    }
  } catch (error: any) {
    console.error('提交物品失败:', error);
    MessagePlugin.error(error.message || '操作失败，请重试');
  }
};

onMounted(() => {
  if (props.mode === 'edit') {
    loadDetail();
  }
});
</script>
<style lang="less" scoped>
.office-item-add-container {
  padding: 20px;
}

.form-card {
  :deep(.t-card__body) {
    padding: 24px 32px;
  }
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.form-actions {
  display: flex;
  gap: 12px;
}
</style>
