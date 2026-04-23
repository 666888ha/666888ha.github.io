/**
 * tp8crm 销售统计接口（与后端 route statistics 组一致）
 * 请求路径带 /api 前缀，由 Vite 代理去掉 /api 转发到 PHP
 */
import { request } from '@/utils/request';

const opt = {
  requestOptions: {
    isTransformResponse: false as const,
    withToken: true,
  },
};

export type StatisticsScope = {
  dept_id?: number | string;
  user_id?: number | string;
};

function cleanParams(p: Record<string, any>) {
  const o: Record<string, any> = {};
  Object.keys(p).forEach((k) => {
    const v = p[k];
    if (v !== undefined && v !== null && v !== '') {
      o[k] = v;
    }
  });
  return o;
}

/**
 * 合并部门、人员筛选（后端 snake_case）。
 * 注意：统计接口普遍写成 `withScope(params)` 单参，此时必须把 base 里的 dept_id/user_id 原样保留；
 * 若再写 `dept_id: scope?.dept_id` 会在未传第二参时用 undefined 覆盖掉筛选条件。
 */
export function withScope(base: Record<string, any>, scope?: StatisticsScope) {
  const o: Record<string, any> = { ...base };
  if (scope != null) {
    if (scope.dept_id !== undefined && scope.dept_id !== null && scope.dept_id !== '') {
      o.dept_id = scope.dept_id;
    }
    if (scope.user_id !== undefined && scope.user_id !== null && scope.user_id !== '') {
      o.user_id = scope.user_id;
    }
  }
  return cleanParams(o);
}

/** 销售预测 */
export const getSalesForecast = (params: StatisticsScope & { base_month?: string }) =>
  request.get<any>({ url: '/api/statistics/sales-forecast', params: withScope(params), ...opt } as any);

/** 销售漏斗 */
export const getSalesFunnel = (params: StatisticsScope & { month_start?: string; month_end?: string; year?: number }) =>
  request.get<any>({ url: '/api/statistics/sales-funnel', params: withScope(params), ...opt } as any);

/** 销售漏斗报表（客户明细，阶段与漏斗分析一致） */
export const getSalesFunnelReport = (params: StatisticsScope & { month_start?: string; month_end?: string; year?: number }) =>
  request.get<any>({ url: '/api/statistics/sales-funnel-report', params: withScope(params), ...opt } as any);

/** 业务新增汇总 */
export const getBusinessAdditionSummary = (
  params: StatisticsScope & { tab?: string; month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/business-addition-summary', params: withScope(params), ...opt } as any);

/** 跟进记录汇总 */
export const getFollowRecordSummary = (
  params: StatisticsScope & { tab?: string; month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/follow-record-summary', params: withScope(params), ...opt } as any);

/** 业务综合统计 */
export const getBusinessComprehensive = (
  params: StatisticsScope & { month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/business-comprehensive', params: withScope(params), ...opt } as any);

/** 业务增长 */
export const getBusinessGrowth = (
  params: StatisticsScope & {
    metric?: string;
    growth_type?: string;
    years?: string;
  },
) => request.get<any>({ url: '/api/statistics/business-growth', params: withScope(params), ...opt } as any);

/** 业绩目标完成度 */
export const getGoalCompletion = (params: StatisticsScope & { tab?: string; year?: number }) =>
  request.get<any>({ url: '/api/statistics/goal-completion', params: withScope(params), ...opt } as any);

/** 回款计划汇总 */
export const getPaymentPlanSummary = (params: StatisticsScope & { year?: number }) =>
  request.get<any>({ url: '/api/statistics/payment-plan-summary', params: withScope(params), ...opt } as any);

/** 产品销量 */
export const getProductSales = (
  params: StatisticsScope & {
    tab?: string;
    month_start?: string;
    month_end?: string;
    year?: number;
    product_cate_id?: string | number;
    product_id?: string | number;
  },
) => request.get<any>({ url: '/api/statistics/product-sales', params: withScope(params), ...opt } as any);

/** 业绩完成度排名 */
export const getRankingPerformanceCompletion = (
  params: StatisticsScope & {
    dimension?: string;
    year?: number;
    start_date?: string;
    end_date?: string;
  },
) => request.get<any>({ url: '/api/statistics/ranking/performance-completion', params: withScope(params), ...opt } as any);

/** 成交数据排名 */
export const getRankingTransactionData = (
  params: StatisticsScope & {
    dimension?: string;
    year?: number;
    start_date?: string;
    end_date?: string;
  },
) => request.get<any>({ url: '/api/statistics/ranking/transaction-data', params: withScope(params), ...opt } as any);

/** 回款排名 */
export const getRankingPaymentCollection = (
  params: StatisticsScope & { dimension?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/ranking/payment-collection', params: withScope(params), ...opt } as any);

/** 转化率排名 */
export const getRankingConversionRate = (params: StatisticsScope & { year?: number }) =>
  request.get<any>({ url: '/api/statistics/ranking/conversion-rate', params: withScope(params), ...opt } as any);

/** 利润率排名 */
export const getRankingProfitMargin = (
  params: StatisticsScope & {
    dimension?: string;
    year?: number;
    start_date?: string;
    end_date?: string;
  },
) => request.get<any>({ url: '/api/statistics/ranking/profit-margin', params: withScope(params), ...opt } as any);

/** 跟进拜访排名 */
export const getRankingFollowVisit = (
  params: StatisticsScope & { dimension?: string; year?: number; follow_type?: string },
) => request.get<any>({ url: '/api/statistics/ranking/follow-visit', params: withScope(params), ...opt } as any);

/** 客户属性分析 */
export const getCustomerAttributeAnalysis = (
  params: StatisticsScope & { month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/customer/attribute-analysis', params: withScope(params), ...opt } as any);

/** 客户区域分布 */
export const getCustomerRegionalDistribution = (
  params: StatisticsScope & { month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/customer/regional-distribution', params: withScope(params), ...opt } as any);

/** 客户成交 TOP10 */
export const getCustomerTransactionTop10 = (
  params: StatisticsScope & { month_start?: string; month_end?: string; year?: number },
) => request.get<any>({ url: '/api/statistics/customer/transaction-top10', params: withScope(params), ...opt } as any);

/** 客户成交率 */
export const getCustomerTransactionRate = (params: StatisticsScope & { year?: number }) =>
  request.get<any>({ url: '/api/statistics/customer/transaction-rate', params: withScope(params), ...opt } as any);
