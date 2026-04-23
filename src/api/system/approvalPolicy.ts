import { request } from '@/utils/request';

const opt = {
  requestOptions: {
    isTransformResponse: false as const,
    withToken: true,
  },
};

/** GET /api/system/approval-policy 返回的 data（金额阈值为元，与报价/合同总金额单位一致） */
export interface ApprovalPolicyData {
  customer_need_approval: number;
  follow_need_approval: number;
  quotation_need_approval: number;
  quotation_auto_pass_below_amount: string | number;
  contract_need_approval: number;
  contract_auto_pass_below_amount: string | number;
  /** 仅 data_scope=all 时可保存 */
  can_edit: boolean;
}

export type ApprovalPolicySavePayload = {
  customer_need_approval: number;
  follow_need_approval: number;
  quotation_need_approval: number;
  quotation_auto_pass_below_amount: number | string;
  contract_need_approval: number;
  contract_auto_pass_below_amount: number | string;
};

export function getApprovalPolicy() {
  return request.get<any>({ url: '/api/system/approval-policy' }, opt);
}

export function saveApprovalPolicy(data: ApprovalPolicySavePayload) {
  return request.post<any>({ url: '/api/system/approval-policy/save', data }, opt);
}
