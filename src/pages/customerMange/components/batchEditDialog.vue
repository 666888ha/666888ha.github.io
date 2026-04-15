<template>
  <t-dialog
    v-model:visible="dialogVisible"
    title="批量编辑"
    width="800px"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <!-- 可批量编辑的字段 -->
    <div class="batch-edit-section">
      <div class="section-title">可批量编辑的字段</div>
      <div class="select-actions">
        <t-button variant="text" theme="primary" @click="handleSelectAll">全选</t-button>
        <t-button variant="text" theme="primary" @click="handleReverseSelect">反选</t-button>
      </div>
      <div class="field-buttons-grid">
        <div
          v-for="field in allFields"
          :key="field.key"
          class="field-button"
          :class="{ active: selectedFields.includes(field.key) }"
          @click="toggleField(field.key)"
        >
          {{ field.label }}
        </div>
      </div>
    </div>

    <!-- 字段编辑区域 -->
    <div class="field-edit-section">
      <div class="section-title">字段编辑区域</div>
      <t-form :data="formData" :label-width="100" class="edit-form">
        <!-- 所属行业 -->
        <t-form-item v-if="selectedFields.includes('industry')" label="所属行业" name="industry" :rules="[{ required: true, message: '请选择所属行业' }]">
          <t-select v-model="formData.industry" placeholder="选择行业" clearable>
            <t-option v-for="item in industryOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>

        <!-- 客户类型 -->
        <t-form-item v-if="selectedFields.includes('customerType')" label="客户类型" name="customerType" :rules="[{ required: true, message: '请选择客户类型' }]">
          <t-radio-group v-model="formData.customerType">
            <t-radio value="enterprise">企业客户</t-radio>
            <t-radio value="individual">个人客户</t-radio>
          </t-radio-group>
        </t-form-item>

        <!-- 客户状态 -->
        <t-form-item v-if="selectedFields.includes('status')" label="客户状态" name="status" :rules="[{ required: true, message: '请选择客户状态' }]">
          <t-select v-model="formData.status" placeholder="选择状态" clearable>
            <t-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>

        <!-- 客户星级 -->
        <t-form-item v-if="selectedFields.includes('valueLevel')" label="客户星级" name="valueLevel" :rules="[{ required: true, message: '请选择客户星级' }]">
          <t-rate v-model="formData.valueLevel" :count="5" />
        </t-form-item>

        <!-- 客户来源 -->
        <t-form-item v-if="selectedFields.includes('customerSource')" label="客户来源" name="customerSource">
          <t-select v-model="formData.customerSource" placeholder="请选择" clearable>
            <t-option v-for="item in sourceOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>

        <!-- 客户归属 -->
        <t-form-item v-if="selectedFields.includes('customerOwner')" label="归属人员" name="customerOwner" :rules="[{ required: true, message: '请选择归属人员' }]">
          <t-input v-model="formData.customerOwner" placeholder="请选择归属人员" clearable>
            <template #suffix-icon>
              <t-icon name="user-add" />
            </template>
          </t-input>
        </t-form-item>

        <!-- 所在地区 -->
        <t-form-item v-if="selectedFields.includes('region')" label="所在地区" name="region">
          <t-cascader v-model="formData.region" :options="regionOptions" placeholder="请选择省市区" clearable />
        </t-form-item>

        <!-- 详细地区 -->
        <t-form-item v-if="selectedFields.includes('detailRegion')" label="详细地区" name="detailRegion">
          <t-input v-model="formData.detailRegion" placeholder="请输入详细地区" clearable />
        </t-form-item>

        <!-- 企业规模 -->
        <t-form-item v-if="selectedFields.includes('enterpriseScale')" label="企业规模" name="enterpriseScale">
          <t-select v-model="formData.enterpriseScale" placeholder="请选择企业规模" clearable>
            <t-option v-for="item in scaleOptions" :key="item.value" :value="item.value" :label="item.label" />
          </t-select>
        </t-form-item>

        <!-- 上级客户 -->
        <t-form-item v-if="selectedFields.includes('parentCustomer')" label="上级客户" name="parentCustomer">
          <t-input v-model="formData.parentCustomer" placeholder="请选择上级客户" clearable />
        </t-form-item>

        <!-- 备注信息 -->
        <t-form-item v-if="selectedFields.includes('remarks')" label="备注信息" name="remarks">
          <t-textarea v-model="formData.remarks" placeholder="请输入备注信息" :autosize="{ minRows: 3, maxRows: 5 }" />
        </t-form-item>
      </t-form>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <t-space>
        <t-button variant="outline" @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleSave">保存</t-button>
      </t-space>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, watch } from 'vue';

defineOptions({
  name: 'BatchEditDialog',
});

// 弹框显示状态
const dialogVisible = ref(false);

// 所有可批量编辑的字段
interface FieldItem {
  key: string;
  label: string;
}

const allFields: FieldItem[] = [
  { key: 'industry', label: '所属行业' },
  { key: 'customerType', label: '客户类型' },
  { key: 'status', label: '客户状态' },
  { key: 'valueLevel', label: '客户星级' },
  { key: 'customerSource', label: '客户来源' },
  { key: 'customerOwner', label: '客户归属' },
  { key: 'region', label: '所在地区' },
  { key: 'detailRegion', label: '详细地区' },
  { key: 'enterpriseScale', label: '企业规模' },
  { key: 'parentCustomer', label: '上级客户' },
  { key: 'remarks', label: '备注信息' },
];

// 选中的字段
const selectedFields = ref<string[]>(['industry', 'customerType', 'status', 'valueLevel', 'customerSource', 'customerOwner', 'region']);

// 表单数据
const formData = ref({
  industry: '',
  customerType: '',
  status: '',
  valueLevel: 0,
  customerSource: '',
  customerOwner: '',
  region: [] as string[],
  detailRegion: '',
  enterpriseScale: '',
  parentCustomer: '',
  remarks: '',
});

// 所属行业选项
const industryOptions = [
  { label: '仪器仪表', value: 'instrument' },
  { label: '电子通信', value: 'electronics' },
  { label: '机械制造', value: 'machinery' },
  { label: '化工材料', value: 'chemical' },
  { label: '生物医药', value: 'biomedical' },
  { label: '新能源', value: 'newenergy' },
  { label: '信息技术', value: 'it' },
  { label: '金融服务', value: 'finance' },
  { label: '房地产', value: 'realestate' },
  { label: '教育培训', value: 'education' },
  { label: '其他', value: 'other' },
];

// 客户状态选项
const statusOptions = [
  { label: '跟进', value: 'follow' },
  { label: '报价', value: 'quote' },
  { label: '购买', value: 'purchase' },
  { label: '流失', value: 'lost' },
];

// 客户来源选项
const sourceOptions = [
  { label: '线上推广', value: 'online' },
  { label: '电话营销', value: 'phone' },
  { label: '转介绍', value: 'referral' },
  { label: '展会', value: 'exhibition' },
  { label: '其他', value: 'other' },
];

// 企业规模选项
const scaleOptions = [
  { label: '小型企业', value: 'small' },
  { label: '中型企业', value: 'medium' },
  { label: '大型企业', value: 'large' },
];

// 省市区级联选择器选项
const regionOptions = [
  {
    label: '北京市',
    value: 'beijing',
    children: [
      {
        label: '北京市',
        value: 'beijing_city',
        children: [
          { label: '东城区', value: 'dongcheng' },
          { label: '西城区', value: 'xicheng' },
          { label: '朝阳区', value: 'chaoyang' },
          { label: '丰台区', value: 'fengtai' },
          { label: '石景山区', value: 'shijingshan' },
          { label: '海淀区', value: 'haidian' },
        ],
      },
    ],
  },
  {
    label: '上海市',
    value: 'shanghai',
    children: [
      {
        label: '上海市',
        value: 'shanghai_city',
        children: [
          { label: '黄浦区', value: 'huangpu' },
          { label: '徐汇区', value: 'xuhui' },
          { label: '长宁区', value: 'changning' },
          { label: '静安区', value: 'jingan' },
          { label: '普陀区', value: 'putuo' },
          { label: '虹口区', value: 'hongkou' },
        ],
      },
    ],
  },
  {
    label: '广东省',
    value: 'guangdong',
    children: [
      {
        label: '广州市',
        value: 'guangzhou',
        children: [
          { label: '荔湾区', value: 'liwan' },
          { label: '越秀区', value: 'yuexiu' },
          { label: '海珠区', value: 'haizhu' },
          { label: '天河区', value: 'tianhe' },
          { label: '白云区', value: 'baiyun' },
          { label: '黄埔区', value: 'huangpu' },
        ],
      },
      {
        label: '深圳市',
        value: 'shenzhen',
        children: [
          { label: '罗湖区', value: 'luohu' },
          { label: '福田区', value: 'futian' },
          { label: '南山区', value: 'nanshan' },
          { label: '宝安区', value: 'baoan' },
          { label: '龙岗区', value: 'longgang' },
          { label: '盐田区', value: 'yantian' },
        ],
      },
    ],
  },
  {
    label: '江苏省',
    value: 'jiangsu',
    children: [
      {
        label: '南京市',
        value: 'nanjing',
        children: [
          { label: '玄武区', value: 'xuanwu' },
          { label: '秦淮区', value: 'qinhuai' },
          { label: '建邺区', value: 'jianye' },
          { label: '鼓楼区', value: 'gulou' },
          { label: '浦口区', value: 'pukou' },
          { label: '栖霞区', value: 'qixia' },
        ],
      },
      {
        label: '苏州市',
        value: 'suzhou',
        children: [
          { label: '虎丘区', value: 'huqiu' },
          { label: '吴中区', value: 'wuzhong' },
          { label: '相城区', value: 'xiangcheng' },
          { label: '姑苏区', value: 'gusu' },
          { label: '吴江区', value: 'wujiang' },
        ],
      },
    ],
  },
  {
    label: '浙江省',
    value: 'zhejiang',
    children: [
      {
        label: '杭州市',
        value: 'hangzhou',
        children: [
          { label: '上城区', value: 'shangcheng' },
          { label: '下城区', value: 'xiacheng' },
          { label: '江干区', value: 'jianggan' },
          { label: '拱墅区', value: 'gongshu' },
          { label: '西湖区', value: 'xihu' },
          { label: '滨江区', value: 'binjiang' },
        ],
      },
    ],
  },
  {
    label: '安徽省',
    value: 'anhui',
    children: [
      {
        label: '合肥市',
        value: 'hefei',
        children: [
          { label: '瑶海区', value: 'yaohai' },
          { label: '庐阳区', value: 'luyang' },
          { label: '蜀山区', value: 'shushan' },
          { label: '包河区', value: 'baohe' },
          { label: '长丰县', value: 'changfeng' },
          { label: '肥东县', value: 'feidong' },
        ],
      },
    ],
  },
];

// 切换字段选择
const toggleField = (fieldKey: string) => {
  const index = selectedFields.value.indexOf(fieldKey);
  if (index > -1) {
    selectedFields.value.splice(index, 1);
    // 清除该字段的值
    if (formData.value[fieldKey as keyof typeof formData.value] !== undefined) {
      if (fieldKey === 'valueLevel') {
        (formData.value[fieldKey as keyof typeof formData.value] as any) = 0;
      } else if (fieldKey === 'region') {
        (formData.value[fieldKey as keyof typeof formData.value] as any) = [];
      } else {
        (formData.value[fieldKey as keyof typeof formData.value] as any) = '';
      }
    }
  } else {
    selectedFields.value.push(fieldKey);
  }
};

// 全选
const handleSelectAll = () => {
  selectedFields.value = allFields.map((field) => field.key);
};

// 反选
const handleReverseSelect = () => {
  selectedFields.value = allFields.filter((field) => !selectedFields.value.includes(field.key)).map((field) => field.key);
};

// 关闭弹框
const handleClose = () => {
  dialogVisible.value = false;
  // 重置表单
  selectedFields.value = ['industry', 'customerType', 'status', 'valueLevel', 'customerSource', 'customerOwner', 'region'];
  formData.value = {
    industry: '',
    customerType: '',
    status: '',
    valueLevel: 0,
    customerSource: '',
    customerOwner: '',
    region: [],
    detailRegion: '',
    enterpriseScale: '',
    parentCustomer: '',
    remarks: '',
  };
};

// 取消
const handleCancel = () => {
  handleClose();
};

// 保存
const handleSave = () => {
  if (selectedFields.value.length === 0) {
    MessagePlugin.warning('请至少选择一个要批量编辑的字段');
    return;
  }

  // 验证必填字段
  const requiredFields = ['industry', 'customerType', 'status', 'valueLevel', 'customerOwner'];
  const missingFields: string[] = [];
  
  requiredFields.forEach((fieldKey) => {
    if (selectedFields.value.includes(fieldKey)) {
      const value = formData.value[fieldKey as keyof typeof formData.value];
      if (
        value === '' ||
        value === null ||
        value === undefined ||
        (fieldKey === 'valueLevel' && value === 0) ||
        (fieldKey === 'region' && (Array.isArray(value) ? value.length === 0 : true))
      ) {
        const field = allFields.find((f) => f.key === fieldKey);
        if (field) {
          missingFields.push(field.label);
        }
      }
    }
  });

  if (missingFields.length > 0) {
    MessagePlugin.warning(`请填写必填字段: ${missingFields.join('、')}`);
    return;
  }

  // 构建要更新的数据
  const updateData: Record<string, any> = {};
  selectedFields.value.forEach((fieldKey) => {
    updateData[fieldKey] = formData.value[fieldKey as keyof typeof formData.value];
  });

  console.log('批量编辑数据:', updateData);
  MessagePlugin.success('批量编辑成功');
  handleClose();
};

// 显示弹框
const show = () => {
  dialogVisible.value = true;
};

// 暴露方法
defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.batch-edit-section {
  margin-bottom: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 12px;
  }

  .select-actions {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    :deep(.t-button) {
      padding: 0;
      height: auto;
      min-height: auto;
    }
  }

  .field-buttons-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;

    .field-button {
      padding: 8px 16px;
      text-align: center;
      border: 1px solid var(--td-component-border);
      border-radius: 4px;
      background: white;
      color: var(--td-text-color-secondary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--td-brand-color);
        color: var(--td-brand-color);
      }

      &.active {
        background: var(--td-brand-color);
        border-color: var(--td-brand-color);
        color: white;
      }
    }
  }
}

.field-edit-section {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 16px;
  }

  .edit-form {
    :deep(.t-form-item) {
      margin-bottom: 20px;
    }

    :deep(.t-form-item__label) {
      .t-form-item__required-mark {
        color: #f5222d;
      }
    }
  }
}

:deep(.t-dialog__footer) {
  text-align: right;
}
</style>