/**
 * 办公物品相关接口
 */
import { request } from '@/utils/request';

/**
 * 添加物品
 * @param {any} data 物品数据
 * @returns {Promise} 返回添加结果
 */
export function addOfficeGoods(data: any) {
  return request.post<any>({
    url: '/api/office/goods/add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 编辑物品
 * @param {any} data 物品数据（需包含id）
 * @returns {Promise} 返回编辑结果
 */
export function editOfficeGoods(data: any) {
  return request.post<any>({
    url: '/api/office/goods/edit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取物品详情
 * @param {string|number} id 物品ID
 * @returns {Promise} 返回物品详情
 */
export function getOfficeGoodsDetail(id: string | number) {
  return request.get<any>({
    url: '/api/office/goods/detail',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取物品列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回物品列表
 */
export function getOfficeGoodsList(params?: any) {
  return request.get<any>({
    url: '/api/office/goods/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 借出物品
 * @param {any} data 借出数据（goods_id, borrow_num, remark）
 * @returns {Promise} 返回借出结果
 */
export function borrowOfficeGoods(data: any) {
  return request.post<any>({
    url: '/api/office/goods/borrow',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取出入库记录列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回出入库记录列表
 */
export function getOfficeGoodsRecordList(params?: any) {
  return request.get<any>({
    url: '/api/office/goods/record/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取会议列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回会议列表
 */
export function getOfficeMeetingList(params?: any) {
  return request.get<any>({
    url: '/api/office/meeting/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 添加会议
 * @param {any} data 会议数据（title, content, remark）
 * @returns {Promise} 返回添加结果
 */
export function addOfficeMeeting(data: any) {
  return request.post<any>({
    url: '/api/office/meeting/add',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 编辑会议
 * @param {any} data 会议数据（需包含id）
 * @returns {Promise} 返回编辑结果
 */
export function editOfficeMeeting(data: any) {
  return request.post<any>({
    url: '/api/office/meeting/edit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 删除会议
 * @param {string|number} id 会议ID
 * @returns {Promise} 返回删除结果
 */
export function deleteOfficeMeeting(id: string | number) {
  return request.post<any>({
    url: '/api/office/meeting/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 删除物品
 * @param {string|number} id 物品ID
 * @returns {Promise} 返回删除结果
 */
export function deleteOfficeGoods(id: string | number) {
  return request.post<any>({
    url: '/api/office/goods/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
export function getOfficeGoodsAuditBorrowList(params?: any) {
  return request.get<any>({
    url: '/api/office/goods/audit/borrow/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
// 物品借用审批：通过/拒绝
export function auditOfficeGoods(data: {
  record_id: string | number;
  audit_status: string | number;
  audit_remark?: string;
}) {
  return request.post<any>({
    url: '/api/office/goods/audit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

export function getOfficeGoodsAuditReturnList(params?: any) {
  return request.get<any>({
    url: '/api/office/goods/audit/return/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
export function returnOfficeGoods(data: { goods_id: string | number; return_num: number; remark?: string }) {
  return request.post<any>({
    url: '/api/office/goods/return',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 撤销物品操作
 * @param {any} data 撤销数据（record_id）
 * @returns {Promise} 返回撤销结果
 */
export function cancelOfficeGoods(data: { record_id: string | number }) {
  return request.post<any>({
    url: '/api/office/goods/cancel',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 续借物品
 * @param {any} data 续借数据（original_record_id）
 * @returns {Promise} 返回续借结果
 */
export function renewOfficeGoods(data: { original_record_id: string | number }) {
  return request.post<any>({
    url: '/api/office/goods/renew',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
