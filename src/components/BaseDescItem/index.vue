<template>
  <div class="base-desc-item" :style="{ flex }">
    <div
      v-if="label || $slots.label"
      :style="labelStyle"
      class="base-desc-item__label"
      :class="{ 'is-required': required }"
      @dblclick="clickToast"
    >
      <slot name="label">{{ label + baseDesc.labelSuffix }}</slot>
    </div>
    <div class="base-desc-item__content" :style="{ background: contentBackground }">
      <div class="base-desc-item__content-wrap">
        <slot />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'BaseDescItem',
  inject: ['baseDesc'],
  props: {
    label: {
      type: String,
      default: '',
    },
    labelWidth: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    flex: {
      type: [Number, String],
      default: 1,
    },
    contentBackground: {
      type: String,
      default: '',
    },
  },
  computed: {
    labelStyle() {
      const style = {};
      const labelWidth = this.labelWidth || this.baseDesc.labelWidth;
      if (labelWidth) {
        style.width = labelWidth;
      }
      return style;
    },
  },
  methods: {
    clickToast() {
      this.$api.toastEgg(this);
    },
  },
};
</script>
<style scoped lang="scss">
/* 详情自定义form */
.base-desc-item {
  flex: 1;
  display: flex;
  min-height: 40px;
  font-size: 14px;

  .base-desc-item__label {
    width: 150px;
    padding: 15px 9px;
    text-align: left;
    color: #666666;
    background: #f5f7fa;
    border: 1px solid #e8e8e8;
    margin: -1px;
    display: flex;
    align-items: center;

    &.is-required:before {
      content: '*';
      color: #f56c6c;
      margin-right: 4px;
    }
  }

  .base-desc-item__content {
    flex: 1;
    margin: -1px;
    padding: 15px 9px;
    background: #fff;
    color: #222222;
    border: 1px solid #e8e8e8;
    word-break: break-all;
    display: flex;
    align-items: center;
    // overflow: auto;

    .base-desc-item__content-wrap {
      flex: 1;
    }

    .el-form-item {
      margin-bottom: 0;
    }
  }
}
</style>
