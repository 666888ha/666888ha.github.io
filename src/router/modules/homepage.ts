import {
  ChartAnalyticsIcon,
  ChartBarIcon,
  ChartLineIcon,
  ChartPieIcon,
  CheckCircleIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  SystemSettingIcon,
  TimeIcon,
  UserBusinessIcon,
  UsergroupIcon,
  WorkIcon,
  WorkOffIcon,
} from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/workbench',
    component: Layout,
    redirect: '/workbench/workbench',
    name: 'workbench',
    meta: {
      single: true,
      id: 1,
      parent_id: 0,
      title: {
        zh_CN: '首页',
        en_US: 'workbench',
      },
      icon: shallowRef(HomeIcon),
      orderNo: 0,
    },
    children: [
      {
        path: 'workbench',
        name: 'WorkbenchDetail',
        component: () => import('@/pages/workbench/index.vue'),
        meta: {
          id: 2,
          parent_id: 1,
          title: {
            zh_CN: '首页',
            en_US: 'Overview',
          },
        },
      },
    ],
  },

  {
    path: '/customerMange',
    component: Layout,
    redirect: '/customerMange/customer',
    name: 'customer',
    meta: {
      id: 3,
      parent_id: 0,
      title: {
        zh_CN: '客户管理',
        en_US: 'customerMange',
      },
      icon: shallowRef(UsergroupIcon),
      orderNo: 1,
    },
    children: [
      {
        path: 'customer',
        name: 'customerList',
        component: () => import('@/pages/customerMange/customer/index.vue'),
        meta: {
          id: 4,
          parent_id: 3,
          title: {
            zh_CN: '客户列表',
            en_US: 'customerList',
          },
        },
      },
      {
        path: 'customer/add',
        name: 'customerAdd',
        component: () => import('@/pages/customerMange/customer/add/index.vue'),
        meta: {
          id: 5,
          parent_id: 3,
          parent_name: '客户列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '新建客户',
            en_US: 'customer add',
          },
        },
      },
      {
        path: 'customer/edit',
        name: 'customerEdit',
        component: () => import('@/pages/customerMange/customer/edit/index.vue'),
        meta: {
          id: 6,
          parent_id: 3,
          parent_name: '客户列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '编辑客户',
            en_US: 'customer edit',
          },
        },
      },
      {
        path: 'customer/followUpCustomer',
        name: 'followUpCustomer',
        component: () => import('@/pages/customerMange/customer/followUpCustomer/index.vue'),
        meta: {
          id: 7,
          parent_id: 3,
          parent_name: '客户列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '跟进客户',
            en_US: 'followUpCustomer',
          },
        },
      },
      {
        path: 'customer/detail',
        name: 'customerDetail',
        component: () => import('@/pages/customerMange/customer/detail/index.vue'),
        meta: {
          id: 8,
          parent_id: 3,
          hidden: true, // 隐藏路由
          parent_name: '客户列表',
          title: {
            zh_CN: '客户详情',
            en_US: 'customer detail',
          },
        },
      },
      {
        path: 'highSeasCustomer',
        name: 'highSeasCustomer',
        component: () => import('@/pages/customerMange/highSeasCustomer/index.vue'),
        meta: {
          id: 9,
          parent_id: 3,
          title: {
            zh_CN: '公海客户',
            en_US: 'highSeasCustomer',
          },
        },
      },
      {
        path: 'garbageCustomers',
        name: 'garbageCustomers',
        component: () => import('@/pages/customerMange/garbageCustomers/index.vue'),
        meta: {
          id: 10,
          parent_id: 3,
          title: {
            zh_CN: '垃圾客户',
            en_US: 'garbageCustomers',
          },
        },
      },
      {
        path: 'advancedFilter',
        name: 'advancedFilter',
        component: () => import('@/pages/customerMange/advancedFilter/index.vue'),
        meta: {
          id: 11,
          parent_id: 3,
          title: {
            zh_CN: '高级筛选',
            en_US: 'advancedFilter',
          },
        },
      },
      {
        path: 'followUpRecord',
        name: 'followUpRecord',
        component: () => import('@/pages/customerMange/followUpRecord/index.vue'),
        meta: {
          id: 12,
          parent_id: 3,
          title: {
            zh_CN: '跟进记录',
            en_US: 'followUpRecord',
          },
        },
      },
      {
        path: 'contactsList',
        name: 'contactsList',
        component: () => import('@/pages/customerMange/contactsList/index.vue'),
        meta: {
          id: 13,
          parent_id: 3,
          title: {
            zh_CN: '联系人列表',
            en_US: 'contactsList',
          },
        },
      },
      {
        path: 'contacts/add',
        name: 'contactsAdd',
        component: () => import('@/pages/customerMange/contactsList/add/index.vue'),
        meta: {
          id: 14,
          parent_id: 3,
          parent_name: '联系人列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '添加联系人',
            en_US: 'contacts add',
          },
        },
      },
      {
        path: 'contacts/edit',
        name: 'contactsEdit',
        component: () => import('@/pages/customerMange/contactsList/edit/index.vue'),
        meta: {
          id: 15,
          parent_id: 3,
          hidden: true, // 隐藏路由
          parent_name: '联系人列表',
          title: {
            zh_CN: '编辑联系人',
            en_US: 'contacts edit',
          },
        },
      },
      {
        path: 'contacts/detailAddCustomer',
        name: 'detailAddCustomer',
        component: () => import('@/pages/customerMange/contactsList/detailAddCustomer/index.vue'),
        meta: {
          id: 16,
          parent_id: 3,
          hidden: true, // 隐藏路由
          parent_name: '联系人列表',
          title: {
            zh_CN: '添加联系人',
            en_US: 'detailAddCustomer',
          },
        },
      },

      {
        path: 'contacts/detail',
        name: 'contactsDetail',
        component: () => import('@/pages/customerMange/contactsList/detail/index.vue'),
        meta: {
          id: 17,
          parent_id: 3,
          hidden: true, // 隐藏路由
          parent_name: '联系人列表',
          title: {
            zh_CN: '联系人详情',
            en_US: 'contacts detail',
          },
        },
      },
    ],
  },
  {
    path: '/followUpManagement',
    component: Layout,
    redirect: '/followUpManagement/list',
    name: 'followUpManagement',
    id: 18,
    parent_id: 0,
    meta: {
      title: {
        zh_CN: '跟进管理',
        en_US: 'followUpManagement',
      },
      icon: shallowRef(TimeIcon),
      orderNo: 2,
    },
    children: [
      {
        path: 'list',
        name: 'followUpManagementList',
        component: () => import('@/pages/followUpManagement/list/index.vue'),
        meta: {
          id: 19,
          parent_id: 18,
          title: {
            zh_CN: '跟进管理列表',
            en_US: 'followUpManagementList',
          },
        },
      },
      {
        path: 'add',
        name: 'followUpManagementAdd',
        component: () => import('@/pages/followUpManagement/add/index.vue'),
        meta: {
          id: 20,
          parent_id: 18,
          hidden: true, // 隐藏路由
          parent_name: '跟进管理列表',
          title: {
            zh_CN: '新建跟进',
            en_US: 'followUpManagementAdd',
          },
        },
      },
      {
        path: 'edit',
        name: 'followUpManagementEdit',
        component: () => import('@/pages/followUpManagement/edit/index.vue'),
        meta: {
          id: 21,
          parent_id: 18,
          parent_name: '跟进管理列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '编辑跟进',
            en_US: 'followUpManagementEdit',
          },
        },
      },
      {
        path: 'detail',
        name: 'followUpManagementDetail',
        component: () => import('@/pages/followUpManagement/detail/index.vue'),
        meta: {
          id: 22,
          parent_id: 18,
          parent_name: '跟进管理列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '跟进管理详情',
            en_US: 'followUpManagementDetail',
          },
        },
      },
    ],
  },
  {
    path: '/quotation',
    component: Layout,
    redirect: '/quotation/list',
    name: 'quotation',
    meta: {
      id: 23,
      parent_id: 0,
      title: {
        zh_CN: '报价单',
        en_US: 'quotation',
      },
      icon: shallowRef(FileIcon),
      orderNo: 3,
    },
    children: [
      {
        path: 'list',
        name: 'quotationList',
        component: () => import('@/pages/quotation/list/index.vue'),
        meta: {
          id: 24,
          parent_id: 23,
          title: {
            zh_CN: '报价单列表',
            en_US: 'quotationList',
          },
        },
      },
      {
        path: 'quotationDetail',
        name: 'QuotationDetail',
        component: () => import('@/pages/quotation/quotationDetail/index.vue'),
        meta: {
          id: 25,
          parent_id: 23,
          hidden: true, // 隐藏路由
          parent_name: '报价单列表',
          title: {
            zh_CN: '报价单详情',
            en_US: 'quotationDetail',
          },
        },
      },
      {
        path: 'chooseProduct',
        name: 'chooseProduct',
        component: () => import('@/pages/quotation/chooseProduct/index.vue'),
        meta: {
          id: 26,
          parent_id: 23,
          hidden: true, // 隐藏路由
          parent_name: '报价单列表',
          title: {
            zh_CN: '选择产品',
            en_US: 'chooseProduct',
          },
        },
      },
      {
        path: 'confirmQuotation',
        name: 'confirmQuotation',
        component: () => import('@/pages/quotation/confirmQuotation/index.vue'),
        meta: {
          id: 27,
          parent_id: 23,
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '确认报价',
            en_US: 'confirmQuotation',
          },
        },
      },
    ],
  },
  {
    path: '/contractMange',
    component: Layout,
    redirect: '/contractMange',
    name: 'contractMange',
    meta: {
      id: 28,
      parent_id: 0,
      title: {
        zh_CN: '合同管理',
        en_US: 'contractMange',
      },
      icon: shallowRef(FolderIcon),
      orderNo: 4,
    },
    children: [
      {
        path: 'contractMange',
        name: 'contractMangeList',
        component: () => import('@/pages/contractMange/index.vue'),
        meta: {
          id: 29,
          parent_id: 28,
          title: {
            zh_CN: '全部合同',
            en_US: 'contractMangeList',
          },
        },
      },
      {
        path: 'add',
        name: 'addContract',
        component: () => import('@/pages/contractMange/add/index.vue'),
        meta: {
          id: 30,
          parent_id: 28,
          parent_name: '合同列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '添加合同',
            en_US: 'addContract',
          },
        },
      },
      {
        path: 'edit',
        name: 'editContract',
        component: () => import('@/pages/contractMange/edit/index.vue'),
        meta: {
          id: 31,
          parent_id: 28,
          hidden: true, // 隐藏路由
          parent_name: '合同列表',
          title: {
            zh_CN: '编辑合同',
            en_US: 'editContract',
          },
        },
      },
      {
        path: 'detail',
        name: 'detailContract',
        component: () => import('@/pages/contractMange/detail/index.vue'),
        meta: {
          id: 32,
          parent_id: 28,
          hidden: true, // 隐藏路由
          parent_name: '合同列表',
          title: {
            zh_CN: '合同详情',
            en_US: 'detailContract',
          },
        },
      },
      {
        path: 'quationContract',
        name: 'quationContract',
        component: () => import('@/pages/contractMange/quationContract/index.vue'),
        meta: {
          id: 33,
          parent_id: 28,
          parent_name: '报价单列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '报价转合同',
            en_US: 'quationContract',
          },
        },
      },
    ],
  },
  {
    path: '/approveMange',
    component: Layout,
    redirect: '/approveMange/customerApprove',
    name: 'customerApprove',
    meta: {
      id: 34,
      parent_id: 0,
      title: {
        zh_CN: '审批管理',
        en_US: 'approveMange',
      },
      icon: shallowRef(CheckCircleIcon),
      orderNo: 5,
    },
    children: [
      {
        path: 'customerApprove',
        name: 'customerApproveList',
        component: () => import('@/pages/approveMange/customerApprove/index.vue'),
        meta: {
          id: 35,
          parent_id: 34,
          title: {
            zh_CN: '客户审批列表',
            en_US: 'customerApproveList',
          },
        },
      },
      {
        path: 'customerApprove/detail',
        name: 'customerApproveDetail',
        component: () => import('@/pages/approveMange/customerApprove/detail/index.vue'),
        meta: {
          id: 36,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '客户审批列表',
          title: {
            zh_CN: '客户审批详情',
            en_US: 'customerApproveDetail',
          },
        },
      },
      {
        path: 'customerApprove/approve',
        name: 'customerApproveApprove',
        component: () => import('@/pages/approveMange/customerApprove/approve/index.vue'),
        meta: {
          id: 37,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '客户审批列表',
          title: {
            zh_CN: '客户审批',
            en_US: 'customerApproveApprove',
          },
        },
      },
      {
        path: 'followUpApprove/approve',
        name: 'followUpApprove',
        component: () => import('@/pages/approveMange/followUpApprove/approve/index.vue'),
        meta: {
          id: 38,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '跟进审批列表',
          title: {
            zh_CN: '审批跟进',
            en_US: 'followUpApprove',
          },
        },
      },
      {
        path: 'followUpApprove/detail',
        name: 'followUpApprovedetail',
        component: () => import('@/pages/approveMange/followUpApprove/detail/index.vue'),
        meta: {
          id: 39,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '跟进审批列表',
          title: {
            zh_CN: '跟进审批详情',
            en_US: 'followUpApprovedetail',
          },
        },
      },
      {
        path: 'followUpApprove',
        name: 'followUpApproveList',
        component: () => import('@/pages/approveMange/followUpApprove/list/index.vue'),
        meta: {
          id: 40,
          parent_id: 34,
          title: {
            zh_CN: '跟进审批列表',
            en_US: 'followUpApproveList',
          },
        },
      },
      {
        path: 'quotationApprove',
        name: 'quotationApproveList',
        component: () => import('@/pages/approveMange/quotationApprove/index.vue'),
        meta: {
          id: 41,
          parent_id: 34,
          title: {
            zh_CN: '报价审批列表',
            en_US: 'quotationApproveList',
          },
        },
      },
      {
        path: 'quotationApprove/approve',
        name: 'quotationApproves',
        component: () => import('@/pages/approveMange/quotationApprove/approve/index.vue'),
        meta: {
          id: 42,
          parent_id: 34,
          parent_name: '报价审批列表',
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '报价审批',
            en_US: 'quotationApproves',
          },
        },
      },
      {
        path: 'quotationApprove/detail',
        name: 'quotationDetail',
        component: () => import('@/pages/approveMange/quotationApprove/detail/index.vue'),
        meta: {
          id: 43,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '报价审批列表',
          title: {
            zh_CN: '报价单详情',
            en_US: 'quotationDetail',
          },
        },
      },
      {
        path: 'contractApprove',
        name: 'contractApproveList',
        component: () => import('@/pages/approveMange/contractApprove/index.vue'),
        meta: {
          id: 44,
          parent_id: 34,
          title: {
            zh_CN: '合同审批列表',
            en_US: 'contractApproveList',
          },
        },
      },
      {
        path: 'contractApprove/approve',
        name: 'contractApprove',
        component: () => import('@/pages/approveMange/contractApprove/approve/index.vue'),
        meta: {
          id: 45,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '合同审批列表',
          title: {
            zh_CN: '合同审批',
            en_US: 'contractApprove',
          },
        },
      },
      {
        path: 'contractApprove/approveDetail',
        name: 'contractApproveDetail',
        component: () => import('@/pages/approveMange/contractApprove/detail/index.vue'),
        meta: {
          id: 46,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '合同审批列表',
          title: {
            zh_CN: '合同审批详情',
            en_US: 'contractApproveDetail',
          },
        },
      },
      {
        path: 'workReportApprove',
        name: 'workReportApproveList',
        component: () => import('@/pages/approveMange/workReportApprove/index.vue'),
        meta: {
          id: 47,
          parent_id: 34,
          title: {
            zh_CN: '工作报告点评',
            en_US: 'workReportApproveList',
          },
        },
      },
      {
        path: 'workReportApprove/approveDetail',
        name: 'workReportApproveDetail',
        component: () => import('@/pages/approveMange/workReportApprove/detail/index.vue'),
        meta: {
          id: 48,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '工作报告点评',
          title: {
            zh_CN: '工作报告详情',
            en_US: 'workReportApproveDetail',
          },
        },
      },
      {
        path: 'workReportApprove/approve',
        name: 'workReportApprove',
        component: () => import('@/pages/approveMange/workReportApprove/approve/index.vue'),
        meta: {
          id: 49,
          parent_id: 34,
          hidden: true, // 隐藏路由
          parent_name: '工作报告点评',
          title: {
            zh_CN: '工作报告审批',
            en_US: 'workReportApprove',
          },
        },
      },
    ],
  },
  {
    path: '/workReport',
    component: Layout,
    redirect: '/workReport',
    name: 'workReport',
    meta: {
      id: 50,
      parent_id: 0,
      title: {
        zh_CN: '工作报告',
        en_US: 'workReport',
      },
      icon: shallowRef(WorkIcon),
      orderNo: 6,
    },
    children: [
      {
        path: 'workReport',
        name: 'workReportList',
        component: () => import('@/pages/workReport/index.vue'),
        meta: {
          id: 51,
          parent_id: 50,
          title: {
            zh_CN: '工作报告列表',
            en_US: 'workReportList',
          },
        },
      },
      {
        path: 'workReportDetail',
        name: 'workReportDetail',
        component: () => import('@/pages/workReport/detail/index.vue'),
        meta: {
          id: 52,
          parent_id: 50,
          hidden: true, // 隐藏路由
          parent_name: '工作报告列表',
          title: {
            zh_CN: '工作报告详情',
            en_US: 'workReportDetail',
          },
        },
      },
    ],
  },
  {
    path: '/workOrderMange',
    component: Layout,
    redirect: '/workOrderMange',
    name: 'workOrderMange',
    meta: {
      id: 53,
      parent_id: 0,
      title: {
        zh_CN: '工单管理',
        en_US: 'workOrderMange',
      },
      icon: shallowRef(WorkOffIcon),
      orderNo: 7,
    },
    children: [
      {
        path: 'workOrderMange',
        name: 'workOrderMangeList',
        component: () => import('@/pages/workOrderMange/index.vue'),
        meta: {
          id: 54,
          parent_id: 53,

          title: {
            zh_CN: '工单管理列表',
            en_US: 'workOrderMangeList',
          },
        },
      },
    ],
  },
  {
    path: '/officeMange',
    component: Layout,
    redirect: 'itemMange',
    name: 'officeMange',
    meta: {
      id: 55,
      parent_id: 0,
      hidden: true, // 隐藏路由
      title: {
        zh_CN: '办公管理',
        en_US: 'officeMange',
      },
      icon: shallowRef(UserBusinessIcon),
      orderNo: 8,
    },
    children: [
      {
        path: 'itemMange',
        name: 'itemMange',
        component: () => import('@/pages/officeMange/itemMange/index.vue'),
        meta: {
          id: 56,
          parent_id: 55,
          title: {
            zh_CN: '物品申领',
            en_US: 'itemMange',
          },
        },
      },
      {
        path: 'itemMange/add',
        name: 'addItemMange',
        component: () => import('@/pages/officeMange/itemMange/add/index.vue'),
        meta: {
          hidden: true, // 隐藏路由
          id: 57,
          parent_id: 55,
          title: {
            zh_CN: '添加物品',
            en_US: 'addItemMange',
          },
        },
      },
      {
        path: 'itemMange/edit',
        name: 'editItemMange',
        component: () => import('@/pages/officeMange/itemMange/edit/index.vue'),
        meta: {
          id: 58,
          parent_id: 55,
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '编辑物品',
            en_US: 'editItemMange',
          },
        },
      },

      {
        path: 'borrowingRecord',
        name: 'borrowingRecord',
        component: () => import('@/pages/officeMange/borrowingRecord/index.vue'),
        meta: {
          id: 59,
          parent_id: 55,
          title: {
            zh_CN: '申领记录',
            en_US: 'borrowingRecord',
          },
        },
      },
    ],
  },
  {
    path: '/officeMangeAdmin',
    component: Layout,
    redirect: 'itemMangeAdmin',
    name: 'officeMangeAdmin',
    meta: {
      id: 60,
      parent_id: 0,
      title: {
        zh_CN: '办公管理',
        en_US: 'officeMangeAdmin',
      },
      icon: shallowRef(UserBusinessIcon),
      orderNo: 9,
    },
    children: [
      {
        path: 'itemMangeAdmin',
        name: 'itemMangeAdmin',
        component: () => import('@/pages/officeMangeAdmin/itemMangeAdmin/index.vue'),
        meta: {
          id: 61,
          parent_id: 60,
          title: {
            zh_CN: '物品管理',
            en_US: 'itemMangeAdmin',
          },
        },
      },
      {
        path: 'itemMangeAdmin/add',
        name: 'addItemMangeAdmin',
        component: () => import('@/pages/officeMangeAdmin/itemMangeAdmin/add/index.vue'),
        meta: {
          id: 62,
          parent_id: 60,
          hidden: true, // 隐藏路由
          parent_name: '物品管理',
          title: {
            zh_CN: '添加物品',
            en_US: 'addItemMangeAdmin',
          },
        },
      },
      {
        path: 'itemMangeAdmin/detail',
        name: 'detailItemMange',
        component: () => import('@/pages/officeMangeAdmin/itemMangeAdmin/detail/index.vue'),
        meta: {
          id: 63,
          parent_id: 60,
          hidden: true, // 隐藏路由
          parent_name: '物品管理',
          title: {
            zh_CN: '物品详情',
            en_US: 'detailItemMange',
          },
        },
      },
      {
        path: 'itemMangeAdmin/editAdmin',
        name: 'editItemMangeAdmin',
        component: () => import('@/pages/officeMangeAdmin/itemMangeAdmin/edit/index.vue'),
        meta: {
          id: 64,
          parent_id: 60,
          hidden: true, // 隐藏路由
          parent_name: '物品管理',
          title: {
            zh_CN: '编辑物品',
            en_US: 'editItemMangeAdmin',
          },
        },
      },
      {
        path: 'borrowingRecordAdmin',
        name: 'borrowingRecordAdmin',
        component: () => import('@/pages/officeMangeAdmin/borrowingRecordAdmin/index.vue'),
        meta: {
          id: 65,
          parent_id: 60,
          title: {
            zh_CN: '申领记录',
            en_US: 'borrowingRecordAdmin',
          },
        },
      },
      {
        path: 'meetingMange',
        name: 'meetingMange',
        component: () => import('@/pages/officeMangeAdmin/meetingMange/index.vue'),
        meta: {
          id: 66,
          parent_id: 60,
          title: {
            zh_CN: '会议管理',
            en_US: 'meetingMange',
          },
        },
      },
      {
        path: 'goodsApprove',
        name: 'goodsApprove',
        component: () => import('@/pages/approveMange/goodsApprove/index.vue'),
        meta: {
          id: 67,
          parent_id: 60,
          title: {
            zh_CN: '物品管理审批',
            en_US: 'goodsApprove',
          },
        },
      },
    ],
  },
  {
    path: '/salesStatistics',
    component: Layout,
    redirect: '/salesStatistics/process/salesForecast',
    name: 'salesStatistics',
    meta: {
      id: 75,
      parent_id: 0,
      title: {
        zh_CN: '销售统计',
        en_US: 'salesStatistics',
      },
      icon: shallowRef(ChartAnalyticsIcon),
      orderNo: 10,
    },
    children: [
      {
        path: 'process',
        name: 'salesStatisticsProcess',
        component: () => import('@/layouts/nestedRouterView.vue'),
        redirect: { name: 'salesForecastAnalysis' },
        meta: {
          id: 76,
          parent_id: 75,
          orderNo: 1,
          title: {
            zh_CN: '销售过程统计',
            en_US: 'salesProcessStatistics',
          },
          icon: shallowRef(ChartBarIcon),
        },
        children: [
          {
            path: 'salesForecast',
            name: 'salesForecastSection',
            component: () => import('@/layouts/nestedRouterView.vue'),
            redirect: { name: 'salesForecastAnalysis' },
            meta: {
              id: 77,
              parent_id: 76,
              /** 浮层内不再单独显示「销售预测分析」分组条，与子项链接去重 */
              hideFlyoutSubgroupTitle: true,
              title: {
                zh_CN: '销售预测分析',
                en_US: 'salesForecastAnalysis',
              },
            },
            children: [
              {
                path: '',
                name: 'salesForecastAnalysis',
                component: () => import('@/pages/officeMangeAdmin/salesStatistics/salesForecast/index.vue'),
                meta: {
                  id: 101,
                  parent_id: 77,
                  title: {
                    zh_CN: '销售预测分析',
                    en_US: 'salesForecastAnalysis',
                  },
                },
              },
              {
                path: 'report',
                name: 'salesForecastReport',
                component: () => import('@/pages/officeMangeAdmin/salesStatistics/salesForecast/report/index.vue'),
                meta: {
                  id: 102,
                  parent_id: 77,
                  title: {
                    zh_CN: '销售预测报表',
                    en_US: 'salesForecastReport',
                  },
                },
              },
            ],
          },
          {
            path: 'salesFunnel',
            name: 'salesFunnelSection',
            component: () => import('@/layouts/nestedRouterView.vue'),
            redirect: { name: 'salesFunnelAnalysis' },
            meta: {
              id: 78,
              parent_id: 76,
              hideFlyoutSubgroupTitle: true,
              title: {
                zh_CN: '销售漏斗分析',
                en_US: 'salesFunnelAnalysis',
              },
            },
            children: [
              {
                path: '',
                name: 'salesFunnelAnalysis',
                component: () => import('@/pages/officeMangeAdmin/salesStatistics/salesFunnel/index.vue'),
                meta: {
                  id: 103,
                  parent_id: 78,
                  title: {
                    zh_CN: '销售漏斗分析',
                    en_US: 'salesFunnelAnalysis',
                  },
                },
              },
              {
                path: 'report',
                name: 'salesFunnelReport',
                component: () => import('@/pages/officeMangeAdmin/salesStatistics/salesFunnel/report/index.vue'),
                meta: {
                  id: 104,
                  parent_id: 78,
                  title: {
                    zh_CN: '销售漏斗报表',
                    en_US: 'salesFunnelReport',
                  },
                },
              },
            ],
          },
          {
            path: 'businessAdditionSummary',
            name: 'businessAdditionSummary',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/businessAdditionSummary/index.vue'),
            meta: {
              id: 79,
              parent_id: 76,
              title: {
                zh_CN: '业务新增汇总',
                en_US: 'businessAdditionSummary',
              },
            },
          },
          {
            path: 'followUpRecordSummary',
            name: 'followUpRecordSummaryStat',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/followUpRecordSummary/index.vue'),
            meta: {
              id: 80,
              parent_id: 76,
              title: {
                zh_CN: '跟进记录汇总',
                en_US: 'followUpRecordSummary',
              },
            },
          },
          {
            path: 'businessComprehensive',
            name: 'businessComprehensiveStatistics',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/businessComprehensive/index.vue'),
            meta: {
              id: 81,
              parent_id: 76,
              title: {
                zh_CN: '业务综合统计',
                en_US: 'businessComprehensiveStatistics',
              },
            },
          },
          {
            path: 'businessGrowth',
            name: 'businessGrowthStatistics',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/businessGrowth/index.vue'),
            meta: {
              id: 82,
              parent_id: 76,
              title: {
                zh_CN: '业务增长统计',
                en_US: 'businessGrowthStatistics',
              },
            },
          },
        ],
      },
      {
        path: 'performance',
        name: 'salesStatisticsPerformance',
        component: () => import('@/layouts/nestedRouterView.vue'),
        redirect: { name: 'performanceGoalCompletion' },
        meta: {
          id: 83,
          parent_id: 75,
          orderNo: 2,
          title: {
            zh_CN: '销售业绩统计',
            en_US: 'salesPerformanceStatistics',
          },
          icon: shallowRef(ChartPieIcon),
        },
        children: [
          {
            path: 'goalCompletion',
            name: 'performanceGoalCompletion',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/goalCompletion/index.vue'),
            meta: {
              id: 84,
              parent_id: 83,
              title: {
                zh_CN: '业绩目标完成度',
                en_US: 'performanceGoalCompletion',
              },
            },
          },
          {
            path: 'paymentPlan',
            name: 'paymentCollectionPlanSummary',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/paymentPlan/index.vue'),
            meta: {
              id: 86,
              parent_id: 83,
              title: {
                zh_CN: '回款计划汇总',
                en_US: 'paymentCollectionPlanSummary',
              },
            },
          },
          {
            path: 'productSales',
            name: 'productSalesVolumeSummary',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/productSales/index.vue'),
            meta: {
              id: 87,
              parent_id: 83,
              title: {
                zh_CN: '产品销量汇总',
                en_US: 'productSalesVolumeSummary',
              },
            },
          },
        ],
      },
      {
        path: 'ranking',
        name: 'salesStatisticsRanking',
        component: () => import('@/layouts/nestedRouterView.vue'),
        redirect: { name: 'performanceCompletionRanking' },
        meta: {
          id: 89,
          parent_id: 75,
          orderNo: 3,
          title: {
            zh_CN: '销售排名统计',
            en_US: 'salesRankingStatistics',
          },
          icon: shallowRef(ChartLineIcon),
        },
        children: [
          {
            path: 'performanceCompletion',
            name: 'performanceCompletionRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/performanceCompletion/index.vue'),
            meta: {
              id: 90,
              parent_id: 89,
              title: {
                zh_CN: '业绩完成度排名',
                en_US: 'performanceCompletionRanking',
              },
            },
          },
          {
            path: 'transactionData',
            name: 'transactionDataRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/transactionDataRanking/index.vue'),
            meta: {
              id: 91,
              parent_id: 89,
              title: {
                zh_CN: '成交数据排名',
                en_US: 'transactionDataRanking',
              },
            },
          },
          {
            path: 'paymentCollectionRanking',
            name: 'paymentCollectionDataRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/paymentCollectionRanking/index.vue'),
            meta: {
              id: 92,
              parent_id: 89,
              title: {
                zh_CN: '回款数据排名',
                en_US: 'paymentCollectionDataRanking',
              },
            },
          },
          {
            path: 'conversionRateRanking',
            name: 'conversionRateRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/conversionRateRanking/index.vue'),
            meta: {
              id: 93,
              parent_id: 89,
              title: {
                zh_CN: '转化率排名',
                en_US: 'conversionRateRanking',
              },
            },
          },
          {
            path: 'profitMarginRanking',
            name: 'profitMarginRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/profitMarginRanking/index.vue'),
            meta: {
              id: 94,
              parent_id: 89,
              title: {
                zh_CN: '利润率排名',
                en_US: 'profitMarginRanking',
              },
            },
          },
          {
            path: 'followVisitRanking',
            name: 'followVisitRanking',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/followVisitRanking/index.vue'),
            meta: {
              id: 95,
              parent_id: 89,
              title: {
                zh_CN: '跟进拜访排名',
                en_US: 'followVisitRanking',
              },
            },
          },
        ],
      },
      {
        path: 'customerData',
        name: 'salesStatisticsCustomerData',
        component: () => import('@/layouts/nestedRouterView.vue'),
        redirect: { name: 'customerAttributeAnalysis' },
        meta: {
          id: 96,
          parent_id: 75,
          orderNo: 4,
          title: {
            zh_CN: '客户数据分析',
            en_US: 'customerDataAnalysis',
          },
          icon: shallowRef(UserBusinessIcon),
        },
        children: [
          {
            path: 'attributeAnalysis',
            name: 'customerAttributeAnalysis',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/customerData/attributeAnalysis/index.vue'),
            meta: {
              id: 97,
              parent_id: 96,
              title: {
                zh_CN: '客户属性分析',
                en_US: 'customerAttributeAnalysis',
              },
            },
          },
          {
            path: 'regionalDistribution',
            name: 'customerRegionalDistribution',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/customerData/regionalDistribution/index.vue'),
            meta: {
              id: 98,
              parent_id: 96,
              title: {
                zh_CN: '客户区域分布',
                en_US: 'customerRegionalDistribution',
              },
            },
          },
          {
            path: 'transactionTop10',
            name: 'customerTransactionTop10',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/customerData/transactionTop10/index.vue'),
            meta: {
              id: 99,
              parent_id: 96,
              title: {
                zh_CN: '客户成交TOP10',
                en_US: 'customerTransactionTop10',
              },
            },
          },
          {
            path: 'transactionRate',
            name: 'customerTransactionRateAnalysis',
            component: () => import('@/pages/officeMangeAdmin/salesStatistics/customerData/transactionRate/index.vue'),
            meta: {
              id: 100,
              parent_id: 96,
              title: {
                zh_CN: '客户成交率分析',
                en_US: 'customerTransactionRateAnalysis',
              },
            },
          },
        ],
      },
    ],
  },
  {
    path: '/systemMange',
    component: Layout,
    redirect: '/systemMange/userList',
    name: 'systemMange',
    meta: {
      id: 68,
      parent_id: 0,
      title: {
        zh_CN: '系统管理',
        en_US: 'systemMange',
      },
      icon: shallowRef(SystemSettingIcon),
      orderNo: 11,
    },
    children: [
      {
        path: 'userList',
        name: 'userList',
        component: () => import('@/pages/systemMange/user/index.vue'),
        meta: {
          id: 69,
          parent_id: 68,
          title: {
            zh_CN: '用户管理',
            en_US: 'userList',
          },
        },
      },
      {
        path: 'role',
        name: 'role',
        component: () => import('@/pages/systemMange/role/index.vue'),
        meta: {
          id: 70,
          parent_id: 68,
          title: {
            zh_CN: '角色管理',
            en_US: 'role',
          },
        },
      },
      {
        path: 'dept',
        name: 'dept',
        component: () => import('@/pages/systemMange/dept/index.vue'),
        meta: {
          id: 71,
          parent_id: 68,
          title: {
            zh_CN: '部门管理',
            en_US: 'dept',
          },
        },
      },
      {
        path: 'approvalManage',
        name: 'approvalManage',
        component: () => import('@/pages/systemMange/approvalManage/index.vue'),
        meta: {
          id: 75,
          parent_id: 68,
          title: {
            zh_CN: '审批管理',
            en_US: 'approvalManage',
          },
        },
      },
      {
        path: 'modifyPassword',
        name: 'modifyPassword',
        component: () => import('@/pages/systemMange/modifyPassword/index.vue'),
        meta: {
          hidden: true, // 隐藏路由
          id: 72,
          parent_id: 68,
          title: {
            zh_CN: '修改密码',
            en_US: 'modifyPassword',
          },
        },
      },
      {
        path: 'modifyAvatar',
        name: 'modifyAvatar',
        component: () => import('@/pages/systemMange/modifyAvatar/index.vue'),
        meta: {
          id: 73,
          parent_id: 68,
          hidden: true, // 隐藏路由
          title: {
            zh_CN: '修改头像',
            en_US: 'modifyAvatar',
          },
        },
      },
      {
        path: 'modifyInfo',
        name: 'modifyInfo',
        component: () => import('@/pages/systemMange/modifyInfo/index.vue'),
        meta: {
          hidden: true, // 隐藏路由
          id: 74,
          parent_id: 68,
          title: {
            zh_CN: '修改资料',
            en_US: 'modifyInfo',
          },
        },
      },
    ],
  },
];
