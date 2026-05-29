<template>
  <t-dialog
    v-model:visible="dialogVisible"
    :header="currentReportId ? '编辑工作报告' : '写工作报告'"
    width="50%"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-width="100px"
        label-align="right"
        @submit="handleSubmit"
      >
        <!-- 报告类型和日期 -->
        <t-row :gutter="[16]">
          <t-col :span="6">
            <t-form-item label="报告类型" name="report_type" required>
              <t-select
                v-model="formData.report_type"
                placeholder="请选择报告类型"
                :options="reportTypeOptions"
                clearable
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="日期" name="submit_time">
              <t-date-picker v-model="formData.submit_time" placeholder="请选择日期" style="width: 100%" clearable />
            </t-form-item>
          </t-col>
        </t-row>

        <t-row :gutter="[16]" class="plan-row">
          <t-col :span="12">
            <!-- 工作计划 -->
            <t-form-item label="工作计划" name="plan" required>
              <t-textarea
                v-model="formData.plan"
                placeholder="请输入工作计划"
                :maxlength="5000"
                :autosize="{ minRows: 6, maxRows: 10 }"
                show-word-limit
                class="plan-textarea"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="[16]">
          <t-col :span="12">
            <!-- 工作总结 -->
            <t-form-item label="工作总结" name="summary" required>
              <t-textarea
                v-model="formData.summary"
                placeholder="请输入工作总结"
                :maxlength="5000"
                :autosize="{ minRows: 6, maxRows: 10 }"
                show-word-limit
                class="summary-textarea"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="" name="">
              <div class="generate-section">
                <t-button theme="default" variant="outline" @click="handleGenerateSummary">
                  <template #icon>
                    <t-icon name="file" />
                  </template>
                  生成总结
                </t-button>
                <div class="generate-tip">点击生成当日跟进情况、新增客户、新增报价等等</div>
              </div>
            </t-form-item>
          </t-col>
        </t-row>
      </t-form>
    </template>
    <template #footer>
      <t-space>
        <t-button theme="default" variant="outline" @click="handleClose">取消</t-button>
        <t-button theme="primary" @click="handleConfirm">保存</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, reactive, ref } from 'vue';

import { editWorkReport, submitWorkReport } from '@/api/workReport';

defineOptions({
  name: 'AddWorkReportDialog',
});

const emit = defineEmits(['success']);

// 弹框显示/隐藏
const dialogVisible = ref(false);

// 表单引用
const formRef = ref();

// 报告类型选项
const reportTypeOptions = [
  { label: '日报', value: 1 },
  { label: '周报', value: 2 },
  { label: '月报', value: 3 },
];

// 表单数据
const formData = reactive({
  report_type: 1, // 默认日报
  submit_time: '', // 日期
  summary: '', // 工作总结
  plan: '', // 工作计划
});

// 表单验证规则
const formRules: FormRules = {
  report_type: [{ required: true, message: '请选择报告类型', type: 'error', trigger: 'blur' }],
  summary: [
    { required: true, message: '请输入工作总结', type: 'error', trigger: 'blur' },
    { min: 1, message: '工作总结至少需要1个字符', type: 'error', trigger: 'blur' },
    { max: 5000, message: '工作总结不能超过5000个字符', type: 'error', trigger: 'blur' },
  ],
  plan: [
    { required: true, message: '请输入工作计划', type: 'error', trigger: 'blur' },
    { min: 1, message: '工作计划至少需要1个字符', type: 'error', trigger: 'blur' },
    { max: 5000, message: '工作计划不能超过5000个字符', type: 'error', trigger: 'blur' },
  ],
};

// 当前编辑的报告ID
const currentReportId = ref<string | number | null>(null);

export type WorkReportPrefill = {
  /** 预填工作总结 */
  summary?: string;
  /** 预填工作计划 */
  plan?: string;
  /** 报告类型，默认日报 */
  report_type?: number;
};

// 显示弹框（支持编辑模式；新增时可传 prefill 预填，例如从客户跟单一键带入）
const show = (reportData?: any, prefill?: WorkReportPrefill) => {
  if (reportData && reportData.id) {
    // 编辑模式：填充数据
    currentReportId.value = reportData.id;
    formData.report_type = reportData.report_type || 1;
    formData.submit_time = reportData.submit_time || '';
    formData.summary = reportData.summary || '';
    formData.plan = reportData.plan || '';
  } else {
    // 新增模式：重置表单数据
    currentReportId.value = null;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    formData.report_type = prefill?.report_type ?? 1;
    formData.submit_time = todayStr;
    formData.summary = prefill?.summary ?? '';
    formData.plan = prefill?.plan ?? '';
  }
  // 显示弹框
  dialogVisible.value = true;
  // 清除验证状态
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
};

// 生成总结
const handleGenerateSummary = () => {
  MessagePlugin.info('生成总结功能待开发');
  // TODO: 调用生成总结接口
};

// 确认提交
const handleConfirm = () => {
  formRef.value?.submit();
};

// 提交表单
const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    try {
      const params: any = {
        report_type: formData.report_type,
        submit_time: formData.submit_time,
        summary: formData.summary.trim(),
        plan: formData.plan.trim(),
      };

      let res;
      if (currentReportId.value) {
        // 编辑模式
        params.id = currentReportId.value;
        res = await editWorkReport(params);
      } else {
        // 新增模式
        res = await submitWorkReport(params);
      }

      if (res.code === 0 || res.code === 200) {
        MessagePlugin.success(currentReportId.value ? '编辑工作报告成功' : '提交工作报告成功');
        handleClose();
        emit('success');
      } else {
        MessagePlugin.error(res.msg || (currentReportId.value ? '编辑工作报告失败' : '提交工作报告失败'));
      }
    } catch (error: any) {
      console.error('提交工作报告失败:', error);
      MessagePlugin.error(error.message || '提交工作报告失败，请重试');
    }
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
:deep(.t-dialog) {
  .t-dialog__body {
    overflow-x: hidden;
  }
}

:deep(.t-form) {
  overflow-x: hidden;
}

.plan-row {
  margin-top: 10px;
}

.summary-section {
  .summary-textarea {
    width: 100%;
    margin-bottom: 16px;
  }

  .generate-section {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .generate-tip {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
      line-height: 1.5;
    }
  }
}

.plan-textarea {
  width: 100%;
}

.summary-textarea {
  width: 100%;
}

:deep(.t-form-item__label) {
  font-weight: normal;
}

:deep(.t-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.t-col) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>
