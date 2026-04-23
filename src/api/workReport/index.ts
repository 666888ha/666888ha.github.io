/**
 * 工作报告相关接口
 */
import { request } from '@/utils/request';

/**
 * 获取工作报告列表
 * @param {any} params 查询参数
 * @returns {Promise} 返回工作报告列表
 */
export function getWorkReportList(params?: any) {
  return request.get<any>({
    url: '/api/work-report/list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/** 工作报告列表导出 CSV（筛选与 list 一致；可传 ids） */
export function exportWorkReportList(params?: Record<string, any>) {
  return request.get<Blob>({
    url: '/api/work-report/export',
    params: params || {},
    responseType: 'blob',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 提交工作报告
 * @param {any} data 工作报告数据
 * @returns {Promise} 返回提交结果
 */
export function submitWorkReport(data: any) {
  return request.post<any>({
    url: '/api/work-report/submit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取报告统计
 * @param {any} params 查询参数
 * @returns {Promise} 返回报告统计数据
 */
export function getWorkReportStat(params?: any) {
  return request.get<any>({
    url: '/api/work-report/stat',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 获取工作报告详情
 * @param {string|number} id 报告ID
 * @returns {Promise} 返回报告详情
 */
export function getWorkReportDetail(id: string | number) {
  return request.get<any>({
    url: '/api/work-report/detail',
    params: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 删除工作报告
 * @param {string|number} id 报告ID
 * @returns {Promise} 返回删除结果
 */
export function deleteWorkReport(id: string | number) {
  return request.post<any>({
    url: '/api/work-report/delete',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 编辑工作报告
 * @param {any} data 工作报告数据（需包含id）
 * @returns {Promise} 返回编辑结果
 */
export function editWorkReport(data: any) {
  return request.post<any>({
    url: '/api/work-report/edit',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}

/**
 * 审批工作报告
 * @param {any} data 审批数据（需包含id和comment）
 * @returns {Promise} 返回审批结果
 */
export function approveWorkReport(data: any) {
  return request.post<any>({
    url: '/api/work-report/approve',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
}
