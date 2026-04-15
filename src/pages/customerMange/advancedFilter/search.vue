<template>
  <div class="advanced-filter-search">
    <!-- 顶部搜索和归属人员 -->
    <div class="search-top-section">
      <div class="search-item">
        <label class="search-label">搜索:</label>
        <div class="search-input-wrapper">
          <t-input v-model="searchForm.keyword" placeholder="全局搜索,包含查重" clearable />
        </div>
      </div>
      <div class="search-item">
        <label class="search-label">归属人员:</label>
        <div class="search-input-wrapper">
          <t-select
            v-model="searchForm.owner_user_id"
            placeholder="选择人员"
            multiple
            clearable
            :options="ownerOptions"
          />
        </div>
      </div>
    </div>

    <!-- 筛选分类 -->
    <div class="filter-sections">
      <!-- 客户分类 -->
      <div class="filter-section">
        <label class="filter-label">客户分类:</label>
        <div class="filter-options">
          <div
            v-for="option in customerClassOptions"
            :key="option.value"
            class="filter-option"
            :class="{ active: searchForm.type === option.value || (option.value === 'list' && !searchForm.type) }"
            @click="handleOptionChange('type', option.value === 'list' ? '' : option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>

      <!-- 客户类型 -->
      <div class="filter-section">
        <label class="filter-label">客户类型:</label>
        <div class="filter-options">
          <div
            v-for="option in customerTypeOptions"
            :key="option.value"
            class="filter-option"
            :class="{ active: searchForm.customer_type === option.value }"
            @click="handleOptionChange('customer_type', option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>

      <!-- 客户状态 -->
      <div class="filter-section">
        <label class="filter-label">客户状态:</label>
        <div class="filter-options">
          <div
            class="filter-option"
            :class="{ active: searchForm.customer_jieduan === '' }"
            @click="handleOptionChange('customer_jieduan', '')"
          >
            全部
          </div>
          <div
            v-for="option in statusOptions"
            :key="option.value"
            class="filter-option"
            :class="{ active: searchForm.customer_jieduan === option.value }"
            @click="handleOptionChange('customer_jieduan', option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>

      <!-- 客户价值等级 -->
      <div class="filter-section">
        <label class="filter-label">客户价值等级:</label>
        <div class="filter-options">
          <div
            class="filter-option"
            :class="{ active: searchForm.value_level === '' }"
            @click="handleOptionChange('value_level', '')"
          >
            全部
          </div>
          <div
            v-for="level in 5"
            :key="level"
            class="filter-option filter-option-star"
            :class="{ active: searchForm.value_level === String(level) }"
            @click="handleOptionChange('value_level', `${level}`)"
          >
            <span v-for="i in level" :key="i" class="star-filled">★</span>
            <span v-for="i in 5 - level" :key="i" class="star-empty">☆</span>
          </div>
        </div>
      </div>

      <!-- 首字母筛选 -->
      <div class="filter-section">
        <label class="filter-label">首字母筛选:</label>
        <div class="filter-options filter-options-letters">
          <div
            class="filter-option filter-option-letter"
            :class="{ active: searchForm.first_letter === '' }"
            @click="handleOptionChange('first_letter', '')"
          >
            全部
          </div>
          <div
            v-for="letter in letters"
            :key="letter"
            class="filter-option filter-option-letter"
            :class="{ active: searchForm.first_letter === letter }"
            @click="handleOptionChange('first_letter', letter)"
          >
            {{ letter }}
          </div>
        </div>
      </div>

      <!-- 所属行业 -->
      <div class="filter-section">
        <label class="filter-label">所属行业:</label>
        <div class="filter-options filter-options-industry">
          <div
            v-for="(industry, index) in visibleIndustries"
            :key="industry.value"
            class="filter-option filter-tag"
            :class="{ active: searchForm.industry === industry.value }"
            @click="handleOptionChange('industry', industry.value)"
          >
            {{ industry.label }}
          </div>
          <t-link v-if="industryOptions.length > maxVisibleIndustries" theme="primary" @click="toggleIndustryExpand">
            {{ industryExpanded ? '收起' : '展开' }}
            <t-icon :name="industryExpanded ? 'chevron-up' : 'chevron-down'" size="14px" />
          </t-link>
        </div>
      </div>

      <!-- 客户渠道 -->
      <div class="filter-section">
        <label class="filter-label">客户渠道:</label>
        <div class="filter-options">
          <div
            v-for="option in visibleChannels"
            :key="option.value"
            class="filter-option"
            :class="{ active: searchForm.channel === option.value }"
            @click="handleOptionChange('channel', option.value)"
          >
            {{ option.label }}
          </div>
          <t-link v-if="channelOptions.length > maxVisibleChannels" theme="primary" @click="toggleChannelExpand">
            {{ channelExpanded ? '收起' : '展开' }}
            <t-icon :name="channelExpanded ? 'chevron-up' : 'chevron-down'" size="14px" />
          </t-link>
        </div>
      </div>
      <!-- 客户标签 -->
      <div class="filter-section">
        <label class="filter-label">客户标签:</label>
        <div class="filter-options">
          <div
            class="filter-option"
            :class="{ active: searchForm.customer_tags.length === 0 }"
            @click="handleOptionChange('customer_tags', '')"
          >
            全部
          </div>
          <div
            v-for="option in customerTagsOptions"
            :key="option.value"
            class="filter-option"
            :class="{ active: searchForm.customer_tags.includes(option.value) }"
            @click="handleOptionChange('customer_tags', option.value)"
          >
            {{ option.label }}
          </div>
        </div>
        <!-- 已选条件 -->
        <div class="selected-conditions">
          <t-link theme="primary" @click="clearAllConditions">清除全部搜索条件</t-link>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { getEmployeeList } from '@/api/customer/customer';
import { getDictOptions } from '@/api/dic';

defineOptions({
  name: 'AdvancedFilterSearch',
});

// 定义 emits
const emit = defineEmits(['filter-change']);

// 搜索表单数据
const searchForm = ref({
  keyword: '',
  owner_user_id: [] as string[],
  type: '',
  customer_type: 'all',
  customer_jieduan: '',
  value_level: '',
  first_letter: '',
  industry: 'all',
  channel: 'all',
  customer_tags: [],
});

// 客户分类选项（根据图片：list-全部 my-我的 subordinate-下属 collaborate-我协作的 public-公海）
const customerClassOptions = [
  { label: '全部', value: 'list' },
  { label: '我的客户', value: 'my' },
  { label: '下属客户', value: 'subordinate' },
  { label: '我协作的', value: 'collaborate' },
  { label: '公海客户', value: 'public' },
];

// 客户类型选项（从数据字典获取）
const customerTypeOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingCustomerType = ref(false);

// 加载客户类型字典选项
const loadCustomerTypeOptions = async () => {
  if (loadingCustomerType.value || customerTypeOptions.value.length > 0) {
    return;
  }

  loadingCustomerType.value = true;
  try {
    const response = await getDictOptions('customer_type');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      customerTypeOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取客户类型字典失败:', error);
  } finally {
    loadingCustomerType.value = false;
  }
};

// 客户状态选项（从数据字典获取）
const statusOptions = ref<Array<{ label: string; value: string | number }>>([]);
const loadingCustomerStatus = ref(false);

// 加载客户状态字典选项
const loadCustomerStatusOptions = async () => {
  if (loadingCustomerStatus.value || statusOptions.value.length > 0) {
    return;
  }

  loadingCustomerStatus.value = true;
  try {
    const response = await getDictOptions('customer_jieduan');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      statusOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取客户状态字典失败:', error);
  } finally {
    loadingCustomerStatus.value = false;
  }
};

// 首字母选项
const letters = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '#',
];

// 所属行业选项（从数据字典获取）
const industryOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingIndustry = ref(false);

// 加载所属行业字典选项
const loadIndustryOptions = async () => {
  if (loadingIndustry.value || industryOptions.value.length > 0) {
    return;
  }

  loadingIndustry.value = true;
  try {
    const response = await getDictOptions('industry');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      industryOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取所属行业字典失败:', error);
  } finally {
    loadingIndustry.value = false;
  }
};

// 客户渠道选项（从数据字典获取）
const channelOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingChannel = ref(false);

// 加载客户渠道字典选项
const loadChannelOptions = async () => {
  if (loadingChannel.value || channelOptions.value.length > 0) {
    return;
  }

  loadingChannel.value = true;
  try {
    const response = await getDictOptions('channel');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      channelOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取客户渠道字典失败:', error);
  } finally {
    loadingChannel.value = false;
  }
};

// 归属人员选项（从员工列表获取）
const ownerOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingOwner = ref(false);

// 加载归属人员列表
const loadOwnerOptions = async () => {
  if (loadingOwner.value || ownerOptions.value.length > 0) {
    return;
  }

  loadingOwner.value = true;
  try {
    const response = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      ownerOptions.value = data.map((emp: any) => ({
        label: emp.real_name || '',
        value: String(emp.id || ''),
      }));
    }
  } catch (error: any) {
    console.error('获取员工列表失败:', error);
  } finally {
    loadingOwner.value = false;
  }
};

// 客户标签选项（从数据字典获取）
const customerTagsOptions = ref<Array<{ label: string; value: string }>>([]);
const loadingTags = ref(false);

// 加载客户标签字典选项
const loadCustomerTagsOptions = async () => {
  if (loadingTags.value || customerTagsOptions.value.length > 0) {
    return;
  }

  loadingTags.value = true;
  try {
    const response = await getDictOptions('biaoqian');
    if (response.code === 0 || response.code === 200) {
      const data = response.data || [];
      customerTagsOptions.value = data;
    }
  } catch (error: any) {
    console.error('获取客户标签字典失败:', error);
  } finally {
    loadingTags.value = false;
  }
};

// 行业展开状态
const industryExpanded = ref(false);
const maxVisibleIndustries = 6; // 默认显示6个行业

// 渠道展开状态
const channelExpanded = ref(false);
const maxVisibleChannels = 4; // 默认显示4个渠道

// 计算可见的行业选项
const visibleIndustries = computed(() => {
  const options = industryOptions.value || [];
  if (industryExpanded.value) {
    return options;
  }
  return options.slice(0, maxVisibleIndustries);
});

// 计算可见的渠道选项
const visibleChannels = computed(() => {
  const options = channelOptions.value || [];
  if (channelExpanded.value) {
    return options;
  }
  return options.slice(0, maxVisibleChannels);
});

// 切换行业展开
const toggleIndustryExpand = () => {
  industryExpanded.value = !industryExpanded.value;
};

// 切换渠道展开
const toggleChannelExpand = () => {
  channelExpanded.value = !channelExpanded.value;
};

// 处理选项变化
const handleOptionChange = (field: string, value: any) => {
  // 特殊处理客户标签的多选逻辑
  if (field === 'customer_tags') {
    const currentTags = searchForm.value.customer_tags as string[];
    const index = currentTags.indexOf(value);

    if (index > -1) {
      // 如果已存在，则移除
      currentTags.splice(index, 1);
    } else {
      // 如果不存在，则添加
      currentTags.push(value);
    }
  } else {
    console.log(field, value);
    // 其他字段保持原有逻辑
    (searchForm.value as any)[field] = value;
  }

  // updateSelectedTags();
  // 触发筛选
  triggerFilter();
};

// 触发筛选
const triggerFilter = () => {
  // 延迟一点时间，确保数据更新完成
  setTimeout(() => {
    emit('filter-change', { ...searchForm.value });
  }, 0);
};

// 已选标签
interface SelectedTag {
  field: string;
  label: string;
  value: any;
}

const selectedTags = ref<SelectedTag[]>([]);

// 更新已选标签
const updateSelectedTags = () => {
  const tags: SelectedTag[] = [];

  if (searchForm.value.keyword) {
    tags.push({ field: 'keyword', label: `搜索: ${searchForm.value.keyword}`, value: searchForm.value.keyword });
  }

  if (searchForm.value.owner && Array.isArray(searchForm.value.owner) && searchForm.value.owner.length > 0) {
    const selectedOwners = searchForm.value.owner
      .map((val) => {
        const option = ownerOptions.value.find((opt) => opt.value === val);
        return option ? option.label : val;
      })
      .join('、');
    tags.push({ field: 'owner', label: `归属人员: ${selectedOwners}`, value: searchForm.value.owner });
  }

  if (searchForm.value.customerClass) {
    const option = customerClassOptions.find((opt) => opt.value === searchForm.value.customerClass);
    if (option) {
      tags.push({ field: 'customerClass', label: `客户分类: ${option.label}`, value: searchForm.value.customerClass });
    }
  }

  if (searchForm.value.customerType) {
    const option = customerTypeOptions.value.find((opt) => opt.value === searchForm.value.customerType);
    if (option) {
      tags.push({ field: 'customerType', label: `客户类型: ${option.label}`, value: searchForm.value.customerType });
    }
  }

  if (searchForm.value.status) {
    const option = statusOptions.value.find((opt) => opt.value === searchForm.value.status);
    if (option) {
      tags.push({ field: 'status', label: `客户状态: ${option.label}`, value: searchForm.value.status });
    }
  }

  if (searchForm.value.valueLevel) {
    let stars = '';
    for (let i = 0; i < Number(searchForm.value.valueLevel); i++) {
      stars += '★';
    }
    for (let i = Number(searchForm.value.valueLevel); i < 5; i++) {
      stars += '☆';
    }
    tags.push({ field: 'valueLevel', label: `客户价值等级: ${stars}`, value: searchForm.value.valueLevel });
  }

  if (searchForm.value.initialLetter) {
    tags.push({
      field: 'initialLetter',
      label: `首字母: ${searchForm.value.initialLetter}`,
      value: searchForm.value.initialLetter,
    });
  }

  if (searchForm.value.industry) {
    const option = industryOptions.value.find((opt) => opt.value === searchForm.value.industry);
    if (option) {
      tags.push({ field: 'industry', label: `所属行业: ${option.label}`, value: searchForm.value.industry });
    }
  }

  if (searchForm.value.channel) {
    const option = channelOptions.value.find((opt) => opt.value === searchForm.value.channel);
    if (option) {
      tags.push({ field: 'channel', label: `客户渠道: ${option.label}`, value: searchForm.value.channel });
    }
  }

  selectedTags.value = tags;
};

// 移除标签
const removeTag = (index: number) => {
  const tag = selectedTags.value[index];
  if (tag) {
    if (tag.field === 'owner') {
      (searchForm.value as any)[tag.field] = [];
    } else if (tag.field === 'valueLevel' || tag.field === 'initialLetter') {
      (searchForm.value as any)[tag.field] = '';
    } else {
      (searchForm.value as any)[tag.field] = '';
    }
    updateSelectedTags();
  }
};

// 清除全部条件
const clearAllConditions = () => {
  searchForm.value = {
    keyword: '',
    owner_user_id: [] as string[],
    type: '',
    customer_type: 'all',
    customer_jieduan: '',
    value_level: '',
    first_letter: '',
    industry: 'all',
    channel: 'all',
    customer_tags: [],
  };
  // selectedTags.value = [];
  // 触发筛选
  // triggerFilter();
};

// 监听搜索关键词变化
watch(
  () => searchForm.value.keyword,
  () => {
    // 使用防抖，避免频繁触发
    clearTimeout((window as any).keywordTimer);
    (window as any).keywordTimer = setTimeout(() => {
      updateSelectedTags();
      triggerFilter();
    }, 500);
  },
);

// 监听归属人员变化
watch(
  () => searchForm.value.owner,
  () => {
    updateSelectedTags();
    triggerFilter();
  },
  { deep: true },
);

// 初始化时更新标签
updateSelectedTags();

// 初始化时加载所有字典数据
onMounted(() => {
  loadCustomerTypeOptions();
  loadCustomerStatusOptions();
  loadIndustryOptions();
  loadChannelOptions();
  loadOwnerOptions();
  loadCustomerTagsOptions();
});
</script>
<style lang="less" scoped>
.advanced-filter-search {
  padding: 20px;
  background: white;

  .search-top-section {
    display: grid;
    gap: 24px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--td-component-border);
    grid-template-columns: repeat(3, 1fr);
    .search-item {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .search-label {
        font-size: 14px;
        color: var(--td-text-color-primary);
        white-space: nowrap;
      }

      .search-input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        :deep(.t-input) {
          flex: 1;
        }

        .badge-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;

          :deep(.t-badge) {
            .t-badge--circle {
              background: #faad14;
              color: white;
              min-width: 18px;
              height: 18px;
              line-height: 18px;
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .filter-sections {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;

    .filter-section {
      display: flex;
      gap: 12px;
      align-items: flex-start;

      .filter-label {
        font-size: 14px;
        color: var(--td-text-color-primary);
        white-space: nowrap;
        min-width: 100px;
        padding-top: 4px;
        flex-shrink: 0;
      }

      .filter-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        flex: 1;

        .filter-option {
          padding: 4px 12px;
          border: 1px solid var(--td-component-border);
          border-radius: 4px;
          background: white;
          color: var(--td-text-color-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;

          &:hover {
            border-color: var(--td-brand-color);
            color: var(--td-brand-color);
          }

          &.active {
            background: var(--td-brand-color);
            border-color: var(--td-brand-color);
            color: white;
          }

          &.filter-tag {
            background: var(--td-bg-color-container-select);
            border-color: var(--td-component-border);

            &.active {
              background: var(--td-brand-color);
              border-color: var(--td-brand-color);
              color: white;
            }
          }

          &.filter-option-letter {
            min-width: 32px;
            text-align: center;
          }

          &.filter-option-star {
            .star-filled {
              color: #f5222d;
            }

            .star-empty {
              color: var(--td-text-color-disabled);
            }

            &.active {
              .star-filled,
              .star-empty {
                color: white;
              }
            }
          }
        }
      }
    }
  }

  .selected-conditions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    .selected-label {
      font-size: 14px;
      color: var(--td-text-color-primary);
      white-space: nowrap;
    }

    .selected-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1;

      .selected-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        background: var(--td-brand-color);
        color: white;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;

        .t-icon {
          cursor: pointer;
          opacity: 0.8;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
