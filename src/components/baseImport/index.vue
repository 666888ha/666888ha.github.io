<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="批量导入"
    width="600px"
    :close-on-overlay-click="false"
    :destroy-on-close="true"
  >
    <!-- 步骤条 -->
    <t-steps :current="currentStep" align-center style="margin-bottom: 20px">
      <t-step-item title="上传文件" />
      <t-step-item title="数据预览" />
      <t-step-item title="导入数据" />
    </t-steps>

    <!-- 步骤1：上传文件 -->
    <div v-if="currentStep === 0" class="step-content">
      <!-- 下载模板 -->
      <t-card :shadow="true" class="step-card">
        <div class="card-header">
          <download-icon class="card-icon" />
          <span class="card-title">填写导入数据信息</span>
        </div>
        <div class="card-desc">请按照数据模板的格式准备导入数据，模板中的表头名称不可更改，表头不能删除</div>
        <t-button theme="primary" variant="text" class="template-btn" @click="downloadTemplate"> 下载模板 </t-button>
      </t-card>

      <!-- 上传文件 -->
      <t-card :shadow="true" class="step-card" style="margin-top: 16px">
        <div class="card-header">
          <upload-icon class="card-icon" />
          <span class="card-title">上传填好的信息表</span>
        </div>
        <div class="card-desc">
          文件后缀名必须为xlsx或xlsx（即Excel格式），文件大小不得大于10M，最多支持导入3000条数据
        </div>
        <t-upload
          class="upload-btn"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls"
          :max="1"
          :files="fileList"
        >
          <t-button theme="primary" variant="text">上传文件</t-button>
        </t-upload>
      </t-card>

      <!-- 提示信息 -->
      <t-alert
        message="导入过程中如发现同名客户，且对该客户数据有更新权限，则更新这条客户数据"
        theme="warning"
        style="margin-top: 16px"
      />

      <!-- 导入记录 -->
      <t-link theme="primary" style="margin-top: 12px; display: inline-block" @click="openImportRecord">
        导入记录
      </t-link>
    </div>

    <!-- 步骤2：数据预览（示例） -->
    <div v-if="currentStep === 1" class="step-content">
      <t-table :data="previewData" border style="width: 100%" max-height="300" :columns="columns"> </t-table>
      <div class="preview-tips" style="margin-top: 12px; color: #666">
        共预览到 {{ previewData.length }} 条数据，其中 0 条数据格式异常
      </div>
    </div>

    <!-- 步骤3：导入数据（示例） -->
    <div v-if="currentStep === 2" class="step-content">
      <t-progress :percentage="importProgress" color="#67c23a" style="margin-bottom: 16px" />
      <div class="import-result">
        <check-circle-icon style="color: #67c23a" />
        <span>导入成功！共导入 {{ importCount }} 条数据</span>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <t-button @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :disabled="currentStep === 0 && !fileList.length" @click="handleNext">
          {{ currentStep === 2 ? '完成' : '下一步' }}
        </t-button>
      </span>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { CheckCircleIcon, DownloadIcon, UploadIcon } from 'tdesign-icons-vue-next';
import { ref } from 'vue';

// 弹窗状态
const dialogVisible = ref(false);
// 当前步骤（0:上传文件 1:数据预览 2:导入完成）
const currentStep = ref(0);
// 上传的文件列表
const fileList = ref([]);
// 预览数据（示例）
const previewData = ref([
  { name: '客户A', type: '企业', phone: '13800138000', status: '正常' },
  { name: '客户B', type: '个人', phone: '13800138001', status: '正常' },
]);
const columns = [
  { colKey: 'name', title: '客户名称' },
  { colKey: 'type', title: '客户类型' },
  { colKey: 'phone', title: '手机号' },
  { colKey: 'status', title: '状态' },
];
// 导入进度/数量
const importProgress = ref(100);
const importCount = ref(2);
const show = () => {
  currentStep.value = 0;
  dialogVisible.value = true;
};
// 下载模板（实际项目中替换为后端模板文件地址）
const downloadTemplate = () => {
  // 示例：模拟下载（实际需通过a标签跳转或接口下载）
  const link = document.createElement('a');
  link.href = '/static/templates/customer_template.xlsx'; // 模板文件路径
  link.download = '客户数据导入模板.xlsx';
  link.click();
};

// 处理文件上传
const handleFileChange = (uploadFile: any) => {
  fileList.value = [uploadFile]; // 只保留一个文件
};

// 下一步/完成
const handleNext = () => {
  if (currentStep.value < 2) {
    currentStep.value++;
    // 步骤2→3时，模拟导入（实际需调用后端接口）
    if (currentStep.value === 2) {
      importCount.value = previewData.value.length;
    }
  } else {
    dialogVisible.value = false;
  }
};

// 打开导入记录（实际项目中替换为弹窗/页面）
const openImportRecord = () => {
  console.log('打开导入记录页面');
};
defineExpose({
  show,
});
</script>
<style scoped lang="less">
.step-content {
  padding: 0 8px;
}
.step-card {
  border: 1px solid #ebeef5;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
}
.card-icon {
  color: #0052d9;
  font-size: 18px;
}
.card-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}
.template-btn,
.upload-btn {
  color: #0052d9;
  padding: 0;
}
.preview-tips {
  font-size: 14px;
}
.import-result {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #333;
}
.dialog-footer {
  text-align: right;
}
</style>
