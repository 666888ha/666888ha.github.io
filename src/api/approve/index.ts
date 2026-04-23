import { request } from '@/utils/request';

// 审批待办列表查询参数
export interface TodoListParams {
  page?: number;
  limit?: number;
  approval_type?: string; // 审批类型，如：customer
  [key: string]: any; // 其他筛选字段按需透传
}

// 审批待办列表（GET方式，用于客户审批等）
export const getApprovalTodoList = (params?: TodoListParams) => {
  return request.get<any>({
    url: '/api/approval/todo-list',
    params: params || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 审批待办列表（POST方式，用于合同审批等）
export const postApprovalTodoList = (data?: TodoListParams) => {
  return request.post<any>({
    url: '/api/approval/todo-list',
    data: data || {},
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

/** 审批待办列表导出 CSV（GET；参数与 todo-list 一致，可传 ids） */
export const exportApprovalTodoList = (params?: Record<string, any>) => {
  return request.get<Blob>({
    url: '/api/approval/export-todo',
    params: params || {},
    responseType: 'blob',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
