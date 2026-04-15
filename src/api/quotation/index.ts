/**
 * 报价产品相关接口
 */
import { request } from '@/utils/request';

/**
 * 获取产品分类列表
 * @returns {Promise} 返回产品分类列表
 */
export function getProductCategoryList() {
  return request.get<any>({
    url: '/api/customer-quotation/product/cate-list',
    method: 'get',
  });
}

/**
 * 根据分类ID获取产品列表
 * @param {string|number} cateId 分类ID
 * @returns {Promise} 返回产品列表
 */
export function getProductListByCate(params: any) {
  if (!params?.cate_id) {
    return Promise.reject(new Error('分类id不能为空'));
  }
  return request.get<any>({
    url: '/api/customer-quotation/product/list-by-cate',
    method: 'get',
    params: params || {},
  });
}

/**
 * 添加客户报价
 * @param {any} data 报价数据
 * @returns {Promise} 返回添加结果
 */
export function addCustomerQuotation(data: any) {
  return request.post<any>({
    url: '/api/customer-quotation/add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取报价列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回报价列表
 */
export function getQuotationList(params?: any) {
  return request.get<any>({
    url: '/api/customer-quotation/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取报价详情
 * @param {string|number} id 报价ID
 * @returns {Promise} 返回报价详情
 */
export function getQuotationDetail(id: string | number) {
  if (!id) {
    return Promise.reject(new Error('报价ID不能为空'));
  }
  return request.get<any>({
    url: '/api/customer-quotation/detail',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
/**
 * 获取客户报价列表
 * @param {string|number} id 客户ID
 * @returns {Promise} 返回客户报价列表
 */
export function getQuotationListByCustomer(params?: any) {
  if (!params?.customer_id) {
    return Promise.reject(new Error('客户ID不能为空'));
  }
  return request.get<any>({
    url: '/api/customer/quotation-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 报价转合同
 * @param {string|number} quotationId 报价ID
 * @returns {Promise} 返回转合同结果
 */
export function quotationToContract(quotationId: string | number) {
  if (!quotationId) {
    return Promise.reject(new Error('报价ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer-contract/quotation-to-contract',
    data: { quotation_id: quotationId },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 编辑客户报价
 * @param {any} data 报价数据
 * @returns {Promise} 返回编辑结果
 */
export function editCustomerQuotation(data: any) {
  return request.post<any>({
    url: '/api/customer-quotation/edit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 删除客户报价
 * @param {string|number} id 报价ID
 * @returns {Promise} 返回删除结果
 */
export function deleteCustomerQuotation(id: string | number) {
  if (!id) {
    return Promise.reject(new Error('报价ID不能为空'));
  }
  return request.post<any>({
    url: '/api/customer-quotation/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 报价审批
 * @param {any} data 审批参数 { id, approval_status, reject_reason?, approval_comment?, notify_user_ids?, notify_user_names? }
 * @returns {Promise} 返回审批结果
 */
export function quotationApproval(data: any) {
  return request.post<any>({
    url: '/api/customer-quotation/approval',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 生成报价PDF
 * @param {string|number} quotationId 报价ID
 * @returns {Promise} 返回生成结果
 */
export function generateQuotationPDF(quotationId: string | number) {
  if (!quotationId) {
    return Promise.reject(new Error('报价ID不能为空'));
  }
  return request.get<any>({
    url: `/api/quotation/word/generate?quotation_id=${quotationId}`,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
