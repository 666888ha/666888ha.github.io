<template>
  <t-dialog
    v-model:visible="dialogVisible"
    title="数据合并"
    width="800px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <!-- 警告信息框 -->
    <div class="warning-box">
      <div class="warning-icon">
        <t-icon name="error-circle" size="20px" style="color: #faad14" />
      </div>
      <div class="warning-content">
        <div class="warning-item">
          <span class="warning-number">1、</span>
          <span>合并后系统只保留目标客户,同时将另一个客户的联系人、、合同、附件、销售动态等迁移到目标客户。</span>
        </div>
        <div class="warning-item">
          <span class="warning-number">2、</span>
          <span>红色字段表示两个客户该字段的值不同。</span>
        </div>
      </div>
    </div>

    <!-- 提示文字 -->
    <div class="instruction-text">请选择合并后需要保留的值:</div>

    <!-- 数据选择区域 -->
    <div class="merge-data-table-wrapper">
      <div class="merge-data-table">
        <div class="table-header">
          <div class="header-field">字段</div>
          <div class="header-option">选项一</div>
          <div class="header-option">选项二</div>
        </div>
        <div ref="tableBodyRef" class="table-body">
          <div
            v-for="(field, index) in mergeFields"
            :key="index"
            class="table-row"
            :class="{ 'has-difference': field.hasDifference }"
          >
            <div class="row-field" :class="{ 'field-different': field.hasDifference }">
              {{ field.fieldName }}
            </div>
            <div class="row-option">
              <t-radio :checked="field.selectedValue === 'option1'" @click="handleRadioChange(index, 'option1')" />
              <span class="option-text">{{ field.option1 }}</span>
            </div>
            <div class="row-option">
              <t-radio :checked="field.selectedValue === 'option2'" @click="handleRadioChange(index, 'option2')" />
              <span class="option-text">{{ field.option2 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <t-space>
        <t-button variant="outline" @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleMerge">合并</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { ErrorCircleIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, ref, watch } from 'vue';

defineOptions({
  name: 'MergeCustomerDialog',
});

// 图标组件
const TIcon = ErrorCircleIcon;

// 客户数据接口
interface CustomerData {
  id: number;
  customerName: string;
  status: string;
  statusText: string;
  valueLevel: number;
  primaryContact: string;
  mobile: string;
  lastFollow: string;
  daysNotFollowed: number;
  systemNumber: string;
  customerType?: string;
  industry?: string;
  customerSource?: string;
  region?: string;
  [key: string]: any;
}

// 弹框显示状态
const dialogVisible = ref(false);

// 选中的两个客户数据
const customer1 = ref<CustomerData | null>(null);
const customer2 = ref<CustomerData | null>(null);

// 字段映射配置
const fieldConfig = [
  { key: 'customerName', label: '客户名称' },
  { key: 'systemNumber', label: '系统编号' },
  { key: 'customerType', label: '客户类型' },
  { key: 'industry', label: '所属行业' },
  { key: 'statusText', label: '客户状态' },
  { key: 'valueLevel', label: '客户价值等级', formatter: (val: number) => '⭐'.repeat(val || 0) },
  { key: 'primaryContact', label: '首联系人' },
  { key: 'mobile', label: '手机号码' },
  { key: 'lastFollow', label: '最后跟进' },
  { key: 'daysNotFollowed', label: '未跟进天数', formatter: (val: number) => `${val || 0}天` },
  { key: 'customerSource', label: '客户来源' },
  { key: 'region', label: '所在地区' },
];

// 合并字段数据
interface MergeField {
  fieldName: string;
  fieldKey: string;
  option1: string;
  option2: string;
  selectedValue: 'option1' | 'option2';
  hasDifference: boolean;
}

// 根据客户数据生成合并字段
const generateMergeFields = (cust1: CustomerData, cust2: CustomerData): MergeField[] => {
  return fieldConfig.map((config) => {
    const val1 = cust1[config.key] ?? '';
    const val2 = cust2[config.key] ?? '';

    // 格式化值
    const formattedVal1 = config.formatter ? config.formatter(val1) : String(val1 || '');
    const formattedVal2 = config.formatter ? config.formatter(val2) : String(val2 || '');

    // 比较值是否不同
    const hasDifference = formattedVal1 !== formattedVal2;

    return {
      fieldName: config.label,
      fieldKey: config.key,
      option1: formattedVal1,
      option2: formattedVal2,
      selectedValue: 'option1',
      hasDifference,
    };
  });
};

const mergeFields = ref<MergeField[]>([]);
const tableBodyRef = ref<HTMLElement | null>(null);

// 处理单选按钮变化
const handleRadioChange = (index: number, value: 'option1' | 'option2') => {
  mergeFields.value[index].selectedValue = value;
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
  customer1.value = null;
  customer2.value = null;
  mergeFields.value = [];
};

// 取消
const handleCancel = () => {
  handleClose();
};

// 合并
const handleMerge = () => {
  if (!customer1.value || !customer2.value) {
    MessagePlugin.warning('请选择要合并的客户');
    return;
  }

  // 获取选中的值
  const selectedValues: Record<string, any> = {};
  mergeFields.value.forEach((field) => {
    const selectedCustomer = field.selectedValue === 'option1' ? customer1.value : customer2.value;
    if (selectedCustomer) {
      selectedValues[field.fieldKey] = selectedCustomer[field.fieldKey];
    }
  });

  console.log('合并数据:', {
    targetCustomer: customer1.value,
    sourceCustomer: customer2.value,
    selectedValues,
  });

  MessagePlugin.success('合并成功');
  handleClose();
};

// 调整表头宽度以匹配表体（考虑滚动条）
const adjustHeaderWidth = () => {
  nextTick(() => {
    if (tableBodyRef.value) {
      const scrollbarWidth = tableBodyRef.value.offsetWidth - tableBodyRef.value.clientWidth;
      const tableHeader = document.querySelector('.merge-data-table .table-header') as HTMLElement;
      if (tableHeader && scrollbarWidth > 0) {
        tableHeader.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
  });
};

// 显示弹框，接收选中的客户数据
const show = (customers: CustomerData[]) => {
  if (!customers || customers.length !== 2) {
    MessagePlugin.warning('请选择两个客户进行合并');
    return;
  }

  customer1.value = customers[0];
  customer2.value = customers[1];

  // 生成合并字段
  mergeFields.value = generateMergeFields(customers[0], customers[1]);

  dialogVisible.value = true;

  // 调整表头宽度
  adjustHeaderWidth();
};

// 监听弹框显示状态，调整表头宽度
watch(dialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      adjustHeaderWidth();
    });
  }
});

// 暴露方法
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.warning-box {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  margin-bottom: 20px;

  .warning-icon {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .warning-content {
    flex: 1;

    .warning-item {
      font-size: 14px;
      color: var(--td-text-color-primary);
      line-height: 1.6;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .warning-number {
        font-weight: 500;
      }
    }
  }
}

.instruction-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
  margin-bottom: 16px;
  font-weight: 500;
}

.merge-data-table-wrapper {
  border: 1px solid var(--td-component-border);
  border-radius: 4px;
  overflow: hidden;
}

.merge-data-table {
  position: relative;

  .table-header {
    display: grid;
    grid-template-columns: 150px 1fr 1fr;
    background: var(--td-bg-color-container-select);
    border-bottom: 1px solid var(--td-component-border);
    position: sticky;
    top: 0;
    z-index: 10;

    .header-field,
    .header-option {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      border-right: 1px solid var(--td-component-border);
      box-sizing: border-box;

      &:last-child {
        border-right: none;
      }
    }

    .header-option {
      text-align: center;
    }
  }

  .table-body {
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;

    // 滚动条样式优化
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--td-bg-color-container);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--td-component-border);
      border-radius: 4px;

      &:hover {
        background: var(--td-text-color-disabled);
      }
    }

    .table-row {
      display: grid;
      grid-template-columns: 150px 1fr 1fr;
      border-bottom: 1px solid var(--td-component-border);
      box-sizing: border-box;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--td-bg-color-container-hover);
      }

      &.has-difference {
        .row-field {
          color: #f5222d;
        }
      }

      .row-field,
      .row-option {
        padding: 12px 16px;
        font-size: 14px;
        color: var(--td-text-color-primary);
        border-right: 1px solid var(--td-component-border);
        display: flex;
        align-items: center;
        box-sizing: border-box;

        &:last-child {
          border-right: none;
        }
      }

      .row-field {
        font-weight: 500;

        &.field-different {
          color: #f5222d;
        }
      }

      .row-option {
        justify-content: flex-start;
        gap: 8px;

        .option-text {
          flex: 1;
        }
      }
    }
  }

  // 确保表头和表体列宽一致
  .table-header,
  .table-body .table-row {
    width: 100%;
  }
}

:deep(.t-dialog__footer) {
  text-align: right;
}
</style>
