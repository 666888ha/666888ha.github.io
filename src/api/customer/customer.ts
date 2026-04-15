import { request } from '@/utils/request';

/**
 * 添加客户接口参数类型
 */
export interface AddCustomerParams {
  id?: string; // 客户id
  customer_name: string; // 客户名称（必填）
  customer_jieduan?: number | string; // 客户阶段：1-了解产品，2-正在跟进，3-正在试用，4-准备购买，5-准备付款，6-已经购买，7-暂时搁置
  customer_tags?: string; // 标签
  industry?: string; // 所属行业
  customer_type?: string; // 客户类型：end-终端客户, dealer-经销商客户, other-其他客户
  value_level?: number | string; // 客户价值等级 1-5
  registered_capital?: string; // 注册资本
  channel?: string; // 客户渠道
  owner_user_id?: number | string; // 归属人员
  region?: string; // 地区
  address?: string; // 详细地址
  company_scale?: string; // 企业规模
  parent_customer_id?: number | string; // 上级客户
  remark?: string; // 备注
  contacts?: Array<{
    contact_name: string; // 联系人姓名
    honorific: string; // 手机号
    role: string; // 是否大股东
    email?: string; // 邮箱
    birthday?: string; // 职务
    remark?: string; // 备注
  }>; // 联系人列表
}

/**
 * 添加客户
 * @param data 客户信息
 */
export const addCustomer = (data: AddCustomerParams) => {
  return request.post<any>({
    url: '/api/customer/add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 更新客户信息
 * @param customerId 客户ID
 * @param data 客户信息
 */
export const updateCustomer = (data: Partial<AddCustomerParams>) => {
  return request.post<any>({
    url: `/api/customer/edit`,
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 获取客户详情
 * @param customerId 客户ID
 */
export const getCustomerDetail = (customerId: string | number) => {
  if (!customerId) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.get<any>({
    url: `/api/customer/detail`,
    params: {
      id: customerId,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 删除客户
 * @param customerId 客户ID
 */
export const deleteCustomer = (customerId: string | number) => {
  if (!customerId) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/del',
    data: {
      id: customerId,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 移入公海
 * @param customerIds 客户ID数组
 * @param remark 备注信息
 */
export const moveToPublicSea = (customerIds: (string | number)[], remark?: string) => {
  if (!customerIds || customerIds.length === 0) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/movetopublic',
    data: {
      ids: customerIds, // 支持数组
      remark: remark || '',
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 移出公海
 * @param customerIds 客户ID数组
 * @param remark 备注信息
 * @param ownerUserId 归属人ID
 */
export const moveOutPublicSea = (customerIds: (string | number)[], remark?: string, ownerUserId?: string | number) => {
  if (!customerIds || customerIds.length === 0) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/moveoutpublic',
    data: {
      id: customerIds, // 支持数组
      remark: remark || '',
      owner_user_id: ownerUserId || '',
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 搜索公司（客户名称）
 * @param keyword 搜索关键词
 */
export const searchCompany = (keyword: string) => {
  if (!keyword || keyword.trim().length === 0) {
    return Promise.resolve({ code: 0, data: [] });
  }
  return request.get<any>({
    url: '/api/customer/searchCompany',
    params: {
      keyword: keyword.trim(),
      with_local: true,
      with_tyc: true,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 客户名称搜索结果项
 */
export interface CustomerSearchItem {
  value: string; // 客户名称（用于显示和提交）
  label: string; // 客户名称（用于显示）
  source?: 'local' | 'external'; // 数据来源：local-本地, external-天眼查
  id?: string | number; // 客户ID（如果是本地客户）
  creditCode?: string; // 统一社会信用代码（天眼查数据）
  [key: string]: any; // 其他扩展字段
}

/**
 * 客户名称搜索（本地 + 天眼查）
 * @param keyword 搜索关键词
 */
export const searchCustomerName = (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) {
    return Promise.resolve({ code: 0, data: [] });
  }

  return request.get<any>({
    url: '/api/customer/search',
    params: {
      keyword: keyword.trim(),
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 员工信息
 */
export interface EmployeeItem {
  employeeId?: string | number; // 员工ID
  employeeName?: string; // 员工姓名
  name?: string; // 员工姓名（备用字段）
  id?: string | number; // 员工ID（备用字段）
  [key: string]: any; // 其他扩展字段
}

/**
 * 获取员工列表
 * @param params 查询参数
 */
export const getEmployeeList = (params?: {
  keyword?: string; // 搜索关键字
  status?: string; // 员工状态
  limit?: number; // 返回结果数量上限
  offset?: number; // 分页起始位置
}) => {
  return request.get<any>({
    url: '/api/system/employee/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 添加/管理客户协作人
 * @param data 协作人管理参数
 * 示例：
 * {
 *   id: 1, // 客户ID
 *   type: 'add', // add-新增, replace-替换, remove-移除
 *   collaborator_ids: [1, 2] // 协作人ID数组
 * }
 */
export const manageCustomerCollaborator = (data: {
  id: number | string;
  type: string;
  collaborator_ids: (number | string)[];
}) => {
  return request.post<any>({
    url: '/api/customer/manage-collaborator',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取相关客户列表
 * @param customer_id 客户ID
 */
export const getSubCustomerList = (customer_id: string | number) => {
  return request.get<any>({
    url: '/api/customer/sub-customer-list',
    params: { parent_id: customer_id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 客户列表查询参数
 */
export interface CustomerListParams {
  keyword?: string; // 关键词搜索
  customer_status?: string; // 客户状态
  customer_type?: string; // 客户类型
  industry?: string; // 所属行业
  value_level?: number | string; // 客户价值等级
  page?: number; // 页码
  limit?: number; // 每页条数
}

/**
 * 客户列表项
 */
export interface CustomerListItem {
  id: number | string; // 客户ID
  customer_name?: string; // 客户名称
  customerName?: string; // 客户名称（兼容字段）
  customer_type?: string; // 客户类型
  customerType?: string; // 客户类型（兼容字段）
  status?: string; // 客户状态
  statusText?: string; // 客户状态文本
  value_level?: number; // 客户价值等级
  valueLevel?: number; // 客户价值等级（兼容字段）
  main_contact_name?: string; // 首联系人
  primary_contact?: string; // 首联系人（兼容字段）
  primaryContact?: string; // 首联系人（兼容字段）
  main_contact_mobile?: string; // 手机号码
  mobile?: string; // 手机号码（兼容字段）
  last_follow_time?: string; // 最后跟进时间
  last_follow?: string; // 最后跟进时间（兼容字段）
  lastFollow?: string; // 最后跟进时间（兼容字段）
  days_not_followed?: number; // 未跟进天数
  daysNotFollowed?: number; // 未跟进天数（兼容字段）
  system_number?: string; // 系统编号
  systemNumber?: string; // 系统编号（兼容字段）
  region_name?: string; // 所在地区
  region?: string; // 所在地区（兼容字段）
  channel?: string; // 客户来源
  customerSource?: string; // 客户来源（兼容字段）
  [key: string]: any; // 其他扩展字段
}

/**
 * 客户列表响应数据
 */
export interface CustomerListResponse {
  code: number;
  data: {
    list: CustomerListItem[]; // 客户列表
    total: number; // 总条数
    page?: number; // 当前页码
    limit?: number; // 每页条数
  };
  message?: string;
}

/**
 * 获取客户列表
 * @param params 查询参数
 */
export const getCustomerList = (params?: CustomerListParams) => {
  return request.get<CustomerListResponse>({
    url: '/api/customer/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 获取垃圾客户列表
 * @param params 查询参数
 */
export const getGarbageList = (params?: CustomerListParams) => {
  return request.get<CustomerListResponse>({
    url: '/api/customer/garbage-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 转移客户接口参数
 */
export interface ChangeOwnerParams {
  id: number | string; // 客户 ID（必填）
  new_owner_id: number | string; // 新归属人 ID（必填）
  reason: string; // 原因（必填）
}

/**
 * 转移客户
 * @param data 转移客户参数
 */
export const changeOwner = (data: ChangeOwnerParams) => {
  if (!data.id) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  if (!data.new_owner_id) {
    return Promise.reject(new Error('新归属人ID不能为空'));
  }
  if (!data.reason || !data.reason.trim()) {
    return Promise.reject(new Error('原因不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/changeowner',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 批量领取垃圾客户
 * @param ids 客户ID数组
 */
export const batchReceiveGarbage = (ids: (string | number)[]) => {
  if (!ids || ids.length === 0) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/batch-receive-garbage',
    data: {
      ids,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取客户归属变更记录
 * @param params 查询参数（customer_id必填，支持分页与时间范围）
 */
export const getOwnerChangeLog = (params: {
  customer_id: string | number;
  page?: number;
  limit?: number;
  start_time?: string;
  end_time?: string;
}) => {
  return request.get<any>({
    url: '/api/customer/owner-change-log',
    params,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 批量领取公海客户
 * @param ids 客户ID数组
 */
export const batchReceive = (ids: (string | number)[]) => {
  if (!ids || ids.length === 0) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/batch-receive',
    data: {
      ids,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 移入垃圾客户
 * @param customerIds 客户ID数组
 * @param remark 备注信息
 */
export const moveToWaste = (customerIds: (string | number)[], remark?: string) => {
  if (!customerIds || customerIds.length === 0) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/movetogarbage',
    data: {
      ids: customerIds, // 支持数组
      remark: remark || '',
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

// 获取联系人列表
export const getContactList = (customer_id: string) => {
  return request.get<any>({
    url: '/api/customer/contact-list',
    params: {
      customer_id,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取所有联系人列表参数
 */
export interface ContactAllListParams {
  page?: number;
  limit?: number;
  keyword?: string; // 关键词（联系人姓名、客户名称、手机号码）
  birthday?: string; // 联系人生日
  role?: string; // 角色
  last_contact?: string; // 最后联系日期
  last_follow?: string; // 最后跟进日期
  type?: string; // 数据权限：all (全部)/my (我的)/subordinate (下属)/collaborate (我协作的)/sub_collaborate (下属协作的)
  [key: string]: any;
}

/**
 * 获取所有联系人列表
 */
export const getContactAllList = (params?: ContactAllListParams) => {
  return request.get<any>({
    url: '/api/customer/contact-all-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 添加联系人接口参数类型
 */
export interface AddContactParams {
  contact_id?: string | number; // 联系人ID（编辑时必填）
  customer_id: string | number; // 客户ID（必填）
  contact_name: string; // 联系人姓名（必填）
  honorific?: string; // 尊称：unknown-未知, mr-先生, ms-女士
  position?: string; // 角色
  role?: string; // 部门职务
  mobile?: string; // 手机号码
  tel?: string; // 固定电话
  email?: string; // 电子邮箱
  wechat?: string; // 微信账号
  fax?: string; // 传真号码
  contact_region?: string | (string | number)[]; // 所在地区
  contact_address?: string; // 详细地址
  birthday?: string; // 生日
  contact_remark?: string; // 备注
}

/**
 * 添加客户联系人
 * @param data 联系人信息
 */
export const addContact = (data: AddContactParams) => {
  return request.post<any>({
    url: '/api/customer/add-contact',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 编辑客户联系人
 * @param data 联系人信息
 */
export const updateContact = (data: AddContactParams) => {
  return request.post<any>({
    url: '/api/customer/edit-contact',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 获取联系人详情
 * @param contactId 联系人ID
 */
export const getContactDetail = (contactId: string | number) => {
  if (!contactId) {
    return Promise.reject(new Error('联系人ID不能为空'));
  }
  return request.get<any>({
    url: '/api/customer/contact-detail',
    params: {
      contact_id: contactId,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 删除联系人
 * @param contactId 联系人ID
 */
export const deleteContact = (contactId: string | number) => {
  if (!contactId) {
    return Promise.reject(new Error('联系人ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer/del-contact',
    data: {
      contact_id: contactId,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
// 添加跟进记录
export interface FollowUpParams {
  customer_id: string;
  main_visitor: string;
  visitor_identity: string;
  follow_content: string;
  departure_time?: string;
  arrival_time?: string;
  leave_time?: string;
}
export const addFollowUp = (data: FollowUpParams) => {
  return request.post<any>({
    url: '/api/follow/add-follow',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true, // 确保携带 token
    },
  } as any);
};

/**
 * 跟进记录列表查询参数
 */
export interface FollowRecordListParams {
  type?: string; // 列表类型：全部、我的等
  customer_id?: string | number; // 客户ID（客户详情页跟进记录使用）
  page?: number; // 当前页码
  limit?: number; // 每页数量
  customer_name?: string; // 客户名称
  follow_stage?: string; // 跟进阶段
  follow_user_id?: string | number; // 跟进人ID
  deal_probability?: string | number; // 成交几率
  start_time?: string; // 跟进开始时间
  end_time?: string; // 跟进结束时间
  follow_type?: string; // 跟进类型
  keyword?: string; // 关键词（搜索跟进内容等）
}

/**
 * 获取跟进记录列表-全部的跟进数据根据时间维度
 */
export const getFollowRecordList = (params?: FollowRecordListParams) => {
  return request.get<any>({
    url: '/api/follow/follow-record-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 获取跟进记录列表-全部的跟进数据根据客户维度
 */
export const getAllFollowList = (params?: FollowRecordListParams) => {
  return request.get<any>({
    url: '/api/follow/all-follow-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取跟进记录列表-根据对象来的
 */
export const getCustomerFollowList = (params?: FollowRecordListParams) => {
  return request.get<any>({
    url: '/api/follow/customer-follow-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 获取跟进详情
 * @param id 跟进记录 ID
 */
export const getFollowDetail = (id: string | number) => {
  return request.get<any>({
    url: '/api/follow/follow-detail',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 删除跟进记录
 * @param id 跟进记录 ID
 */
export const delFollow = (id: string | number) => {
  return request.post<any>({
    url: '/api/follow/del-follow',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 删除跟进记录下的评论
 * @param id 评论 ID
 */
export const delComment = (id: string | number) => {
  return request.post<any>({
    url: '/api/follow/comment-del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 编辑跟进记录
 */
export interface EditFollowParams extends FollowUpParams {
  id: string | number;
}

export const editFollow = (data: EditFollowParams) => {
  return request.post<any>({
    url: '/api/follow/edit-follow',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 客户审批接口参数
 */
export interface CustomerApprovalParams {
  id: number | string; // 客户ID（必填）id 跟进记录 ID
  approval_status: number; // 审批状态：1-通过，2-否决（必填）
  reject_reason?: string; // 否决原因（否决时必填，1-1000字）
  approval_comment?: string; // 审批点评（通过时必填，1-1000字）
  notify_user_ids?: string; // 通知人员ID（通过时必填），格式：1,2
  notify_user_names?: string; // 通知人员名称（通过时必填），格式：张三，李四
}

/**
 * 客户审批
 * @param data 审批参数
 */
export const customerApproval = (data: CustomerApprovalParams) => {
  return request.post<any>({
    url: '/api/customer/approval',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
// 添加跟进评论
export const addFollowComment = (data: { follow_id: string | number; comment_content: string }) => {
  return request.post<any>({
    url: '/api/follow/comment-add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取客户操作日志参数
 */
export interface CustomerOperationLogParams {
  customer_id: string | number; // 客户ID（必填）
  page?: number; // 页码
  limit?: number; // 每页条数
  start_time?: string; // 开始时间
  end_time?: string; // 结束时间
}

/**
 * 获取客户操作日志
 * @param params 查询参数
 */
export const getCustomerOperationLog = (params: CustomerOperationLogParams) => {
  if (!params.customer_id) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.get<any>({
    url: '/api/customer/operation-log',
    params: {
      customer_id: params.customer_id,
      page: params.page || 1,
      limit: params.limit || 10,
      start_time: params.start_time,
      end_time: params.end_time,
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
/**
 * 跟进审批
 * @param data 审批参数
 */
export const followApproval = (data: CustomerApprovalParams) => {
  return request.post<any>({
    url: '/api/follow/approval',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
