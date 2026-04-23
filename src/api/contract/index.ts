/**
 * 合同相关接口
 */
import { request } from '@/utils/request';

/**
 * 获取合同列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回合同列表
 */
export function getContractList(params?: any) {
  return request.get<any>({
    url: '/api/customer-contract/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/** 合同列表导出 CSV（筛选与 list 一致；可传 ids 仅导出选中） */
export function exportContractList(params?: Record<string, any> & { ids?: string }) {
  return request.get<Blob>({
    url: '/api/customer-contract/export',
    params: params || {},
    responseType: 'blob',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/** 合同导入模板 CSV */
export function downloadContractImportTemplate() {
  return request.get<Blob>({
    url: '/api/customer-contract/import-template',
    responseType: 'blob',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/** 合同 CSV 导入 */
export function importContractCsv(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return request.post<any>({
    url: '/api/customer-contract/import',
    data: fd,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 添加合同
 * @param {any} data 合同数据
 * @returns {Promise} 返回添加结果
 */
export function addContract(data: any) {
  return request.post<any>({
    url: '/api/customer-contract/add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 合同详情
 * @param {string|number} id 合同ID
 */
export function getContractDetail(id: string | number) {
  return request.get<any>({
    url: '/api/customer-contract/detail',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 编辑合同
 * @param {any} data 合同数据（需包含id）
 */
export function editContract(data: any) {
  return request.post<any>({
    url: '/api/customer-contract/edit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 删除合同
 * @param {string|number} id 合同ID
 */
export function deleteContract(id: string | number) {
  return request.post<any>({
    url: '/api/customer-contract/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 报价转合同
 * @param {any} data 合同数据（需包含quotation_id）
 * @returns {Promise} 返回转合同结果
 */
export function quotationToContract(data: any) {
  return request.post<any>({
    url: '/api/customer-contract/quotation-to-contract',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 合同审批接口参数
 */
export interface ContractApprovalParams {
  id: number | string; // 合同ID（必填）
  approval_status: number; // 审批状态：1-通过，2-否决（必填）
  reject_reason?: string; // 否决原因（否决时必填，1-1000字）
  approval_comment?: string; // 审批点评（通过时必填，1-1000字）
  notify_user_ids?: string; // 通知人员ID（通过时必填），格式：1,2
  notify_user_names?: string; // 通知人员名称（通过时必填），格式：张三，李四
}

/**
 * 合同审批
 * @param data 审批参数
 */
export function contractApproval(data: ContractApprovalParams) {
  return request.post<any>({
    url: '/api/customer-contract/approval',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 撤销审批
 * @param id 合同ID
 */
export function revokeContractApproval(id: string | number) {
  return request.post<any>({
    url: '/api/customer-contract/revoke-approval',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 提交审批
 * @param id 合同ID
 */
export function submitContractApproval(id: string | number) {
  return request.post<any>({
    url: '/api/customer-contract/submit-approval',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 转他人审批接口参数
 */
export interface TransferApprovalParams {
  id: number | string; // 合同ID（必填）
  approver_ids: Array<string | number>; // 审批人ID列表（必填）
  reason: string; // 转交原因（必填，1-300字）
}

/**
 * 转他人审批
 * @param data 转交参数
 */
export function transferContractApproval(data: TransferApprovalParams) {
  return request.post<any>({
    url: '/api/customer-contract/transfer-approval',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取客户合同列表
 * @param {string|number} id 客户ID
 * @returns {Promise} 返回客户合同列表
 */
export function getContractListByCustomer(params: any) {
  if (!params.customer_id) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.get<any>({
    url: '/api/customer/contract-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 合同验收
 * @param {string|number} id 合同ID
 * @returns {Promise} 返回验收结果
 */
export function contractAcceptance(id: string | number) {
  return request.post<any>({
    url: '/api/customer-contract/acceptance',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 生成合同Word文档
 * @param {string|number} contractId 合同ID
 * @returns {Promise} 返回生成结果
 */
export function generateContractWord(contractId: string | number) {
  if (!contractId) {
    return Promise.reject(new Error('合同ID不能为空'));
  }
  return request.get<any>({
    url: `/api/contract/word/generate?contract_id=${contractId}`,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
