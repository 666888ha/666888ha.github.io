<template>
  <div>
    <!-- 1. 导出进度弹窗 -->
    <t-dialog
      v-model:visible="exportProgressVisible"
      header="批量导出"
      width="500px"
      :close-on-overlay-click="false"
      :show-overlay="true"
      :footer="false"
    >
      <div class="progress-container">
        <p>导出处理中</p>
        <t-progress :percentage="exportProgress" theme="line" />
        <p class="progress-desc">批量导出1000条数据，共在生成导出文件</p>
      </div>
    </t-dialog>

    <!-- 2. 导出完成弹窗 -->
    <t-dialog
      v-model:visible="exportFinishVisible"
      header="批量导出"
      width="500px"
      :close-on-overlay-click="false"
      :footer="false"
    >
      <div class="finish-container">
        <t-button theme="primary" style="margin-right: 10px" @click="downloadExportFile">
          <template #icon><download-icon /></template>
          下载导出文件
        </t-button>
        <t-button theme="default" @click="openExportManage"> 导出文件管理 </t-button>
      </div>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { DownloadIcon } from 'tdesign-icons-vue-next';
import { ref } from 'vue';
// 导出相关状态
const exportProgressVisible = ref(false);
const exportFinishVisible = ref(false);
const exportProgress = ref(0);
const isExporting = ref(false); // 表格加载状态

// 打开导出进度弹窗（模拟进度）
const openExportProgress = () => {
  exportProgressVisible.value = true;
  isExporting.value = true;
  exportProgress.value = 0;

  // 模拟进度增长（实际需对接后端导出接口的进度回调）
  const timer = setInterval(() => {
    exportProgress.value += 10;
    if (exportProgress.value >= 100) {
      clearInterval(timer);
      // 进度完成后，切换到"导出完成"弹窗
      setTimeout(() => {
        exportProgressVisible.value = false;
        exportFinishVisible.value = true;
        isExporting.value = false;
      }, 500);
    }
  }, 300);
};

// 下载导出文件（实际需后端提供文件地址）
const downloadExportFile = () => {
  const link = document.createElement('a');
  link.href = '/api/export/download'; // 后端文件下载接口
  link.download = '客户数据导出.xlsx';
  link.click();
};

// 打开导出文件管理
const openExportManage = () => {
  // 实际逻辑：打开导出记录页面/弹窗
  console.log('打开导出文件管理');
  exportFinishVisible.value = false;
};
defineExpose({
  openExportProgress,
});
</script>
<style lang="less" scoped>
.progress-container {
  padding: 20px 0;
}
.progress-desc {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  text-align: center;
}
.finish-container {
  padding: 20px 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
