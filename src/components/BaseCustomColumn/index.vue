<template>
  <t-dialog
    v-model:visible="dialogVisible"
    title="自定义显示列项"
    width="600px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <!-- 提示文字 -->
    <div class="dialog-tip">列项显示不得少于5项,最多支持自定义10个列项,灰色选中列不支持隐藏和排序</div>

    <!-- 列项列表 -->
    <div class="column-list">
      <div class="column-list-header">
        <div class="header-cell header-display">显示</div>
        <div class="header-cell header-name">列名</div>
        <div class="header-cell header-drag">拖动调整顺序</div>
      </div>
      <div ref="columnListRef" class="column-list-body">
        <div
          v-for="(column, index) in columnList"
          :key="column.colKey"
          class="column-item"
          :class="{ 'column-item--disabled': column.disabled }"
          :draggable="!column.disabled"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent="handleDragOver($event, index)"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
        >
          <div class="column-cell column-display">
            <t-checkbox
              v-model="column.checked"
              :disabled="column.disabled"
              @change="handleColumnChange(column, index)"
            />
          </div>
          <div class="column-cell column-name">{{ column.title }}</div>
          <div class="column-cell column-drag">
            <t-icon name="menu" size="16px" :class="{ 'drag-icon--disabled': column.disabled }" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <t-link theme="primary" @click="handleRestoreDefault">恢复默认</t-link>
        <div class="footer-buttons">
          <t-button theme="default" variant="outline" @click="handleCancel">取消</t-button>
          <t-button theme="primary" @click="handleConfirm">确定</t-button>
        </div>
      </div>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, ref } from 'vue';

import { extractColumnField } from '@/utils/ruoyi';

defineOptions({
  name: 'CustomColumnDialog',
});
const props = defineProps<{
  allColumnsConfig: AllColumnsConfig;
  tableColumns: ColumnItem[];
  requiredColumns: string[];
  customKeyName: string;
}>();
// 定义事件
const emit = defineEmits<{
  (e: 'confirm', columns: ColumnItem[]): void;
}>();
// 定义 Props
interface AllColumnsConfig {
  [key: string]: {
    title: string;
    colKey: string;
    width?: number;
    align?: string;
    fixed?: 'left' | 'right';
    [key: string]: any;
  };
}

// 弹框显示状态
const dialogVisible = ref(false);

// 列项列表
interface ColumnItem {
  colKey: string;
  title: string;
  checked: boolean;
  disabled: boolean;
  order: number;
  fixed?: 'left' | 'right';
}

const columnList = ref<ColumnItem[]>([]);

// 拖拽相关
const columnListRef = ref<HTMLElement | null>(null);
const dragIndex = ref<number>(-1);

// 根据 allColumnsConfig 生成默认列项配置
const generateDefaultColumns = (): ColumnItem[] => {
  const columns: ColumnItem[] = [];
  let order = 1;

  // 排除 rowSelect，因为它是系统列
  const excludeKeys = ['rowSelect'];

  // 默认显示的列（非必须，根据当前表格显示的列）
  const defaultCheckedColumns = extractColumnField(props.tableColumns, 'colKey');
  Object.keys(props.allColumnsConfig).forEach((key) => {
    if (excludeKeys.includes(key)) {
      return;
    }
    const colConfig = props.allColumnsConfig[key];
    const isRequired = props.requiredColumns.includes(key);
    const isChecked = defaultCheckedColumns.includes(key) || isRequired;

    const title = colConfig.title || key;
    columns.push({
      colKey: key,
      title,
      checked: isChecked,
      disabled: isRequired,
      order: isRequired && key === 'operation' ? 999 : order++,
      fixed: colConfig.fixed,
    });
  });

  // 按 order 排序
  return columns.sort((a, b) => a.order - b.order);
};

// 初始化列项列表
const initColumnList = () => {
  // 从localStorage读取保存的配置，如果没有则使用默认配置
  const savedColumns = localStorage.getItem(props.customKeyName);
  if (savedColumns) {
    try {
      const parsed = JSON.parse(savedColumns);
      // 验证保存的配置是否包含所有必要的列
      if (Array.isArray(parsed) && parsed.length > 0) {
        columnList.value = parsed;
        return;
      }
    } catch (e) {
      console.error('Failed to parse saved columns:', e);
    }
  }

  // 使用 allColumnsConfig 生成默认配置
  columnList.value = generateDefaultColumns();
};

// 显示弹框
const show = () => {
  initColumnList();
  dialogVisible.value = true;
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
};

// 取消
const handleCancel = () => {
  handleClose();
};

// 列项复选框变化
const handleColumnChange = (column: ColumnItem, index: number) => {
  if (column.disabled) {
    return;
  }

  const checkedCount = columnList.value.filter((col) => col.checked).length;

  // 最少5项
  if (!column.checked && checkedCount <= 5) {
    column.checked = true;
    MessagePlugin.warning('列项显示不得少于5项');
    return;
  }

  // 最多10项
  if (column.checked && checkedCount >= 12) {
    column.checked = false;
    MessagePlugin.warning('最多支持自定义10个列项');
  }
};

// 拖拽开始
const handleDragStart = (event: DragEvent, index: number) => {
  const item = columnList.value[index];
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
  }
  if (event.target) {
    (event.target as HTMLElement).style.opacity = '0.5';
  }
};

// 拖拽经过
const handleDragOver = (event: DragEvent, index: number) => {
  if (dragIndex.value === -1) return;
  const item = columnList.value[index];
  if (item.disabled) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

// 放置
const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault();
  if (dragIndex.value === -1 || dragIndex.value === index) return;

  const item = columnList.value[index];
  if (item.disabled) return;

  const draggedItem = columnList.value[dragIndex.value];
  if (draggedItem.disabled) return;

  // 交换位置
  const temp = columnList.value[dragIndex.value];
  columnList.value.splice(dragIndex.value, 1);
  columnList.value.splice(index, 0, temp);

  // 更新order
  columnList.value.forEach((col, idx) => {
    col.order = idx + 1;
  });
};

// 拖拽结束
const handleDragEnd = (event: DragEvent) => {
  dragIndex.value = -1;
  if (event.target) {
    (event.target as HTMLElement).style.opacity = '1';
  }
};

// 恢复默认
const handleRestoreDefault = () => {
  columnList.value = generateDefaultColumns();
  MessagePlugin.success('已恢复默认设置');
};

// 确定
const handleConfirm = () => {
  const checkedCount = columnList.value.filter((col) => col.checked).length;
  // 验证最少5项
  if (checkedCount < 5) {
    MessagePlugin.warning('列项显示不得少于5项');
    return;
  }
  // 验证最多10项
  if (checkedCount > 12) {
    MessagePlugin.warning('最多支持自定义12个列项');
    return;
  }

  // 保存配置到localStorage
  localStorage.setItem(props.customKeyName, JSON.stringify(columnList.value));
  // 触发自定义事件，通知父组件更新表格列
  const checkedColumns = columnList.value.filter((col) => col.checked).sort((a, b) => a.order - b.order);
  // 构建新的表格列配置
  const newColumns: any[] = [props.allColumnsConfig.rowSelect];
  console.log(checkedColumns);
  // 按照用户选择的顺序和配置添加列
  checkedColumns.forEach((column) => {
    const colKey = column.colKey;
    // 跳过 row-select，因为已经添加了
    if (colKey === 'row-select') {
      return;
    }
    if (props.allColumnsConfig[colKey]) {
      newColumns.push(props.allColumnsConfig[colKey]);
    }
  });
  emit('confirm', newColumns);
  handleClose();
  MessagePlugin.success('设置已保存');
};

// 暴露方法
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.dialog-tip {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--td-bg-color-container-select);
  border-radius: 4px;
}

.column-list {
  border: 1px solid var(--td-component-border);
  border-radius: 4px;
  overflow: hidden;

  .column-list-header {
    display: flex;
    background: var(--td-bg-color-container);
    border-bottom: 1px solid var(--td-component-border);
    font-weight: 500;
    color: var(--td-text-color-primary);

    .header-cell {
      padding: 12px 16px;
      font-size: 14px;

      &.header-display {
        width: 80px;
        text-align: center;
      }

      &.header-name {
        flex: 1;
      }

      &.header-drag {
        width: 120px;
        text-align: center;
      }
    }
  }

  .column-list-body {
    max-height: 400px;
    overflow-y: auto;

    .column-item {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--td-component-border);
      transition: background-color 0.2s;
      cursor: move;

      &:last-child {
        border-bottom: none;
      }

      &:hover:not(.column-item--disabled) {
        background: var(--td-bg-color-container-hover);
      }

      &.column-item--disabled {
        cursor: not-allowed;
        background: var(--td-bg-color-container-select);

        .column-name {
          color: var(--td-text-color-placeholder);
        }
      }

      .column-cell {
        padding: 12px 16px;
        font-size: 14px;

        &.column-display {
          width: 80px;
          text-align: center;
        }

        &.column-name {
          flex: 1;
          color: var(--td-text-color-primary);
        }

        &.column-drag {
          width: 120px;
          text-align: center;

          .drag-icon--disabled {
            color: var(--td-text-color-disabled);
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-border);

  .footer-buttons {
    display: flex;
    gap: 12px;
  }
}
</style>
