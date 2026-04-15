/**
 * 用户信息
 */
export interface UserInfo {
  user: UserVO;
  roles: string[];
  permissions: string[];
}

/**
 * 用户查询对象类型
 */
export interface UserQuery {
  userName?: string;
  nickName?: string;
  phonenumber?: string;
  leaderId?: number | string;
  status?: string;
  deptId?: string | number;
  roleId?: string | number;
  userIds?: string | number | (string | number)[] | undefined;
  employeStatus?: string;
}

/**
 * 用户返回对象
 */
export interface UserVO {
  userId: number;
  tenantId: string;
  leaderId?: number | string;
  deptId: number;
  userName: string;
  nickName: string;
  userType: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  avatarUrl: string;
  delFlag: string;
  loginIp: string;
  loginDate: string;
  remark: string;
  deptName: string;
  roleIds: any;
  postIds: any;
  roleId: any;
  admin: boolean;
  rankId?: string;
  rankName?: string;
  postName?: string;
  rankLevel?: string;
  otherDeptId?: any;
  isUpdatePassword?: string;
  legalSubjectId?: string;
  legalSubjectName?: string;
}

/**
 * 用户表单类型
 */
export interface UserForm {
  leaderId?: number | string;
  id?: number;
  userId?: string;
  deptId?: number;
  userName: string;
  nickName?: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex?: string;
  status: string;
  remark?: string;
  postIds: string[];
  roleIds: string[];
  rankId?: string;
  employeStatus?: string;
  otherDeptId?: any;
  legalSubjectId?: string;
}

export interface UserInfoVO {
  user: UserVO;
  leaderId?: number | string;
  roleIds: string[];
  postIds: string[];
  roleGroup: string;
  postGroup: string;
  rankId?: string;
  otherDeptId?: any;
  legalSubjectName?: string;
}

export interface ResetPwdForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
