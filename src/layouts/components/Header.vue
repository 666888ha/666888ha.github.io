<template>
  <div :class="layoutCls">
    <t-head-menu :class="menuCls" :theme="menuTheme" expand-type="popup" :value="active">
      <template #logo>
        <div class="header-logo-row">
          <!-- 顶栏左侧统一使用 aside-logo.png；侧栏布局右侧为折叠 + 搜索 -->
          <span
            v-if="showLogo"
            class="header-logo-container header-logo-container--brand"
            @click="handleNav('/workbench/workbench')"
          >
            <img src="@/assets/aside-logo.png" alt="" class="header-brand-img" width="150" height="55" />
          </span>
          <div v-if="layout === 'side'" class="header-side-tools">
            <t-button theme="default" shape="square" variant="text" @click="changeCollapsed">
              <t-icon class="collapsed-icon" name="view-list" />
            </t-button>
            <search :layout="layout" />
          </div>
          <div v-else-if="!showLogo" class="header-operate-left">
            <t-button theme="default" shape="square" variant="text" @click="changeCollapsed">
              <t-icon class="collapsed-icon" name="view-list" />
            </t-button>
            <search :layout="layout" />
          </div>
        </div>
      </template>
      <template v-if="layout !== 'side'" #default>
        <menu-content class="header-menu" :nav-data="menu" />
      </template>
      <template #operations>
        <div class="operations-container">
          <!-- 搜索框 -->
          <search v-if="layout !== 'side'" :layout="layout" />
          <notice />
          <t-dropdown
            :min-column-width="120"
            trigger="click"
            :popup-props="{
              attach: 'body',
              overlayInnerStyle: { zIndex: 5500 },
            }"
          >
            <template #dropdown>
              <!-- <t-dropdown-item class="operations-dropdown-container-item" @click="handleNav('/user/index')">
                <user-circle-icon />{{ t('layout.header.user') }}
              </t-dropdown-item> -->
              <t-dropdown-item class="operations-dropdown-container-item" @click="handleChangePassword">
                <lock-on-icon />修改密码
              </t-dropdown-item>
              <t-dropdown-item class="operations-dropdown-container-item" @click="handleChangeAvatar">
                <image-icon />修改头像
              </t-dropdown-item>
              <t-dropdown-item class="operations-dropdown-container-item" @click="handleChangeProfile">
                <edit-icon />修改资料
              </t-dropdown-item>
              <t-dropdown-item class="operations-dropdown-container-item" @click="handleLogout">
                <poweroff-icon />{{ t('layout.header.signOut') }}
              </t-dropdown-item>
            </template>
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <img v-if="user.userInfo.avatar" :src="user.userInfo.avatar" class="header-user-avatar" />
                <img v-else :src="logoImg" class="header-user-avatar" />
              </template>
              <div class="header-user-account">{{ user.userInfo.name }}</div>
              <template #suffix><chevron-down-icon /></template>
            </t-button>
          </t-dropdown>
          <!-- <t-tooltip placement="bottom" :content="t('layout.header.setting')">
            <t-button theme="default" shape="square" variant="text" @click="toggleSettingPanel">
              <setting-icon />
            </t-button>
          </t-tooltip> -->
        </div>
      </template>
    </t-head-menu>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon, EditIcon, ImageIcon, LockOnIcon, PoweroffIcon, SettingIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import logoImg from '@/assets/logo.png';
import { prefix } from '@/config/global';
import { langList, t } from '@/locales';
import { getActive } from '@/router';
import { useSettingStore, useUserStore } from '@/store';
import type { MenuRoute, ModeType } from '@/types/interface';

import notice from './Notice.vue';

const { theme, layout, showLogo, menu, isFixed, isCompact } = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  layout: {
    type: String,
    default: 'top',
  },
  showLogo: {
    type: Boolean,
    default: true,
  },
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: () => [],
  },
  isFixed: {
    type: Boolean,
    default: false,
  },
  isCompact: {
    type: Boolean,
    default: false,
  },
  maxLevel: {
    type: Number,
    default: 3,
  },
});

const router = useRouter();
const settingStore = useSettingStore();
const user = useUserStore();

const toggleSettingPanel = () => {
  settingStore.updateConfig({
    showSettingPanel: true,
  });
};

const active = computed(() => getActive());

const layoutCls = computed(() => [`${prefix}-header-layout`]);

const menuCls = computed(() => {
  const side = layout === 'side';
  return [
    {
      [`${prefix}-header-menu`]: !isFixed || side,
      /* 侧栏布局：顶栏占满整行，使用文档流，不再 fixed 且不再 left:280px */
      [`${prefix}-header-menu-fixed`]: isFixed && !side,
      [`${prefix}-header-menu-side-top`]: side,
    },
  ];
});
const menuTheme = computed(() => theme as ModeType);

const changeCollapsed = () => {
  settingStore.updateConfig({
    isSidebarCompact: !settingStore.isSidebarCompact,
  });
};

const handleNav = (url: string) => {
  router.push(url);
};

// 修改密码
const handleChangePassword = () => {
  router.push('/systemMange/modifyPassword');
  // TODO: 跳转到修改密码页面或打开修改密码弹窗
  // router.push('/user/change-password');
};

// 修改头像
const handleChangeAvatar = () => {
  router.push('/systemMange/modifyAvatar');
  // TODO: 打开修改头像弹窗或跳转到修改头像页面
  // router.push('/user/change-avatar');
};

// 修改资料
const handleChangeProfile = () => {
  router.push('/systemMange/modifyInfo');
};

const handleLogout = async () => {
  try {
    // 调用退出登录接口并清除本地状态
    await user.logout();
    // 跳转到登录页
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
    MessagePlugin.success('退出登录成功');
  } catch (error: any) {
    console.error('退出登录失败:', error);
    // user.logout() 方法内部已经处理了错误，即使接口失败也会清除本地状态
    // 所以这里直接跳转即可
    router.push({
      path: '/login',
    });
    MessagePlugin.warning('退出登录失败，已清除本地登录信息');
  }
};
</script>
<style lang="less" scoped>
.@{starter-prefix}-header {
  &-menu-side-top {
    width: 100%;

    :deep(.t-head-menu) {
      position: relative !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    :deep(.t-head-menu__inner) {
      width: 100%;
      max-width: 100%;
      padding-right: var(--td-comp-margin-xl);
    }
  }

  &-menu-fixed {
    position: fixed;
    top: 0;
    z-index: 1001;

    :deep(.t-head-menu__inner) {
      padding-right: var(--td-comp-margin-xl);
    }
  }

  &-logo-container {
    cursor: pointer;
    display: inline-flex;
  }
}

.header-menu {
  flex: 1 1 auto;
  display: inline-flex;

  :deep(.t-menu__item) {
    min-width: unset;
  }
}

.operations-container {
  display: flex;
  align-items: center;

  .t-popup__reference {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .t-button {
    margin-left: var(--td-comp-margin-l);
  }
}

.header-operate-left {
  display: flex;
  align-items: normal;
  line-height: 0;
}

.header-logo-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-height: 40px;
}

.header-side-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 紧跟在顶栏 Logo 后的工具区 */
.header-logo-container + .header-side-tools {
  margin-left: 8px;
}

/* 顶栏无品牌图时，折叠与搜索左留白 */
.header-logo-row > .header-side-tools:first-child {
  margin-left: 24px;
}

.header-logo-container--brand {
  width: 150px;
  height: 55px;
  flex-shrink: 0;
  margin-left: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.header-brand-img {
  width: 150px;
  height: 55px;
  object-fit: contain;
  display: block;
  /* 将彩色 logo 转为纯白，适配深蓝顶栏 */
  filter: brightness(0) invert(1);
}

.header-logo-container {
  width: 184px;
  height: 26px;
  display: flex;
  flex-shrink: 0;
  margin-left: 24px;
  color: white;

  .t-logo {
    width: 100%;
    height: 100%;

    &:hover {
      cursor: pointer;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

.header-user-account {
  display: inline-flex;
  align-items: center;
  color: white;
}
.header-user-btn {
  height: 40px;
}
.header-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 20px;
}
:deep(.t-head-menu) {
  background-color: #114893;
}

:deep(.t-head-menu__inner) {
  border-bottom: 1px solid var(--td-component-stroke);
  background-color: #114893;
}

:deep(.t-menu--light) {
  background-color: #114893;

  .t-menu__item {
    color: white;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }

    &.t-is-active {
      background-color: rgba(255, 255, 255, 0.15);
      color: white;
    }
  }

  .header-user-account {
    color: white;
  }

  .t-icon {
    color: white;
  }

  .t-button {
    color: white;
  }
}

.t-menu--dark {
  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-gray-color-10);
  }

  .header-user-account {
    color: rgb(255 255 255 / 55%);
  }
}

.operations-dropdown-container-item {
  width: 100%;
  display: flex;
  align-items: center;

  :deep(.t-dropdown__item-text) {
    display: flex;
    align-items: center;
  }

  .t-icon {
    font-size: var(--td-comp-size-xxxs);
    margin-right: var(--td-comp-margin-s);
  }

  :deep(.t-dropdown__item) {
    width: 100%;
    margin-bottom: 0;
  }

  &:last-child {
    :deep(.t-dropdown__item) {
      margin-bottom: 8px;
    }
  }
}
</style>
<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="less">
.operations-dropdown-container-item {
  .t-dropdown__item-text {
    display: flex;
    align-items: center;
  }
}
</style>
