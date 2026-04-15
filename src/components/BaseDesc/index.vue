<template>
  <div class="base-desc">
    <slot />
  </div>
</template>
<script>
export default {
  name: 'BaseDesc',
  provide() {
    return {
      baseDesc: this,
    };
  },
  props: {
    labelWidth: {
      type: String,
      default: '',
    },
    labelSuffix: {
      type: String,
      default: '：',
    },
  },
};
</script>
<style scoped>
.base-desc {
  border: 1px solid #e8e8e8;
}
</style>
