import { request } from '@/utils/request';

/**
 * 员工列表接口返回的单条数据结构
 */
export interface SystemEmployeeItem {
  id: number | string;
  username: string;
  real_name: string;
  role_id?: number | string;
  role?: {
    role_name?: string;
    [key: string]: any;
  };
  status: number;
  create_time: string;
  [key: string]: any;
}

export interface SystemEmployeeListParams {
  username?: string; // 账号关键词
  real_name?: string; // 姓名关键词
  status?: number; // 状态（0 禁用 / 1 启用）
  page?: number; // 页码
  limit?: number; // 每页条数
}

export interface SystemEmployeeListResponse {
  code: number;
  msg?: string;
  count?: number;
  data?: SystemEmployeeItem[];
  [key: string]: any;
}

/**
 * 获取员工分页列表
 * 接口：system/employee/list
 */
export const getSystemEmployeeList = (params: SystemEmployeeListParams) => {
  return request.get<SystemEmployeeListResponse>({
    url: '/api/system/employee/list',
    params,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 保存员工（新增 / 编辑）
 * 接口：system/employee/save
 */
export interface SaveSystemEmployeeParams {
  id?: number | string; // 员工ID（编辑时必填）
  username: string; // 登录账号（4-20位字母数字）
  real_name: string; // 真实姓名（2-10位中文/字母）
  role_id?: number | string; // 角色ID（可选）
  dept_id?: number | string; // 部门ID
  phone?: string; // 手机号
  password?: string; // 密码（新增默认 123456，编辑不修改可不传）
  status?: number; // 状态（0 禁用 / 1 启用），默认 1（可选）
}

export const saveSystemEmployee = (data: SaveSystemEmployeeParams) => {
  return request.post<any>({
    url: '/api/system/employee/save',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 员工详情
 * 接口：system/employee/view
 */
export const getSystemEmployeeDetail = (id: number | string) => {
  return request.get<any>({
    url: '/api/system/employee/view',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取员工信息（别名）
 * 接口：system/employee/view
 */
export const getEmployeeInfo = (id: number | string) => {
  return getSystemEmployeeDetail(id);
};

export const deleteSystemUser = (id: number | string) => {
  return request.post<any>({
    url: '/api/system/employee/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/** 员工业绩目标：单月 */
export interface EmployeeMonthlyTargetMonth {
  month: number;
  target_amount: string;
}

/** GET system/employee/monthly-target 返回 data */
export interface EmployeeMonthlyTargetGetData {
  employee_id: number;
  real_name: string;
  year: number;
  months: EmployeeMonthlyTargetMonth[];
  year_total: string;
}

/**
 * 获取某员工指定年度 12 个月业绩目标
 * GET /api/system/employee/monthly-target?employee_id=&year=
 */
export const getEmployeeMonthlyTarget = (params: { employee_id: number | string; year: number | string }) => {
  return request.get<any>({
    url: '/api/system/employee/monthly-target',
    params,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 保存某员工指定年度 12 个月业绩目标（后端要求超管 data_scope=all）
 * POST /api/system/employee/monthly-target/save
 */
export const saveEmployeeMonthlyTarget = (data: {
  employee_id: number | string;
  year: number | string;
  /** 长度 12，依次为 1～12 月目标金额 */
  amounts: number[];
}) => {
  return request.post<any>({
    url: '/api/system/employee/monthly-target/save',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 获取当前用户信息
 * 接口：user/info
 */
export const getUserInfo = () => {
  // 模拟API调用，返回用户信息
  return Promise.resolve({
    code: 0,
    msg: '获取成功',
    data: {
      id: 1,
      username: 'zhangsan',
      name: '张三',
      department: '销售部',
      position: '销售经理',
      gender: 'male',
      birthday: '1990-01-01',
      address: '北京市朝阳区',
      phone: '13800138000',
      wechat: 'zhangsan123',
      landline: '010-88888888',
      employeeId: 'EMP001',
      email: 'zhangsan@example.com',
      school: '北京大学',
      graduationDate: '2012-06-30',
      education: 'undergraduate',
      major: '计算机科学与技术',
      remark: '这是一个备注信息',
      avatar: '',
    },
  });
};

/**
 * 提交头像（改为传URL）
 * 接口：/system/profile/avatar
 */

export const submitAvatarUrl = (avatar: string) => {
  return request.post<any>({
    url: '/api/system/profile/avatar',
    data: { avatar },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
export const uploadImageToDict = (data: FormData) => {
  return request.post<any>({
    url: '/api/dict/upload',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 修改密码
 * 接口：/system/profile/password
 */
export const modifyPassword = (data: { old_password: string; new_password: string; confirm_password: string }) => {
  return request.post<any>({
    url: '/api/system/profile/password',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/**
 * 更新用户资料
 * 接口：/system/profile/update
 */
export const updateUserProfile = (data: any) => {
  return request.post<any>({
    url: '/api/system/profile/update',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
