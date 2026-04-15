import { request } from '@/utils/request';

/**
 * 字典选项项
 */
export interface DictOptionItem {
  label: string; // 显示文本
  value: string | number; // 值
  [key: string]: any; // 其他扩展字段
}

/**
 * 获取字典选项
 * @param type 字典类型（必填）
 * @returns 字典选项列表
 */
export const getDictOptions = (type: string, withAll?: boolean) => {
  return request.get<any>({
    url: '/api/dict/options',
    params: {
      type, // 字典类型参数
      with_all: withAll, // 是否包含全部选项
    },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
