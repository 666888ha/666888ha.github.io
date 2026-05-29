/**
 * 客户阶段（客户状态）展示：接口可能返回数字 1–7、字符串 "1" 或历史键 customer_jieduan1 等，需与数据字典/本地回退表一致。
 */
export type CustomerJieduanTheme = 'primary' | 'warning' | 'success' | 'default' | 'danger';

const THEME_BY_KEY: Record<string, CustomerJieduanTheme> = {
  '1': 'primary',
  '2': 'warning',
  '3': 'primary',
  '4': 'warning',
  '5': 'success',
  '6': 'success',
  '7': 'default',
  customer_jieduan1: 'primary',
  customer_jieduan2: 'warning',
  customer_jieduan3: 'primary',
  customer_jieduan4: 'warning',
  customer_jieduan5: 'success',
  customer_jieduan6: 'success',
  customer_jieduan7: 'default',
};

const LABEL_FALLBACK: Record<string, string> = {
  '1': '了解产品',
  '2': '正在跟进',
  '3': '正在试用',
  '4': '准备购买',
  '5': '准备付款',
  '6': '已经购买',
  '7': '暂时搁置',
  customer_jieduan1: '了解产品',
  customer_jieduan2: '正在跟进',
  customer_jieduan3: '正在试用',
  customer_jieduan4: '准备购买',
  customer_jieduan5: '准备付款',
  customer_jieduan6: '已经购买',
  customer_jieduan7: '暂时搁置',
};

function normKey(status: string | number | null | undefined): string {
  if (status === null || status === undefined || status === '') {
    return '';
  }
  return String(status);
}

/**
 * 列表/详情行：优先用后端直出的状态文案，否则用字典或本地回退表解析 customer_jieduan 码。
 */
export function getListRowCustomerJieduanLabel(
  row: { customer_jieduan?: string | number; customer_jieduan_text?: string; customerJieduanText?: string },
  dictOptions?: Array<{ label: string; value: string | number }>,
): string {
  const t = row.customer_jieduan_text ?? row.customerJieduanText;
  if (t != null && String(t).trim() !== '') {
    return String(t);
  }
  return getCustomerJieduanLabel(row.customer_jieduan, dictOptions);
}

export function getCustomerJieduanLabel(
  status: string | number | null | undefined,
  dictOptions?: Array<{ label: string; value: string | number }>,
): string {
  const key = normKey(status);
  if (!key) {
    return '未知状态';
  }
  if (dictOptions?.length) {
    const hit = dictOptions.find((o) => String(o.value) === key);
    if (hit?.label) {
      return hit.label;
    }
  }
  return LABEL_FALLBACK[key] || '未知状态';
}

export function getCustomerJieduanTheme(status: string | number | null | undefined): CustomerJieduanTheme {
  const key = normKey(status);
  if (!key) {
    return 'default';
  }
  return THEME_BY_KEY[key] || 'default';
}

/** 将 /api/dict/options 返回项规范为 { label, value }，便于与列表中的码匹配 */
export function mapDictOptionsToSelect(data: any[]): Array<{ label: string; value: string | number }> {
  return (data || [])
    .map((item: any) => ({
      label: item.label || item.dictLabel || item.name || '',
      value: item.value ?? item.dictValue ?? item.code ?? '',
    }))
    .filter((item) => item.label && item.value !== '' && item.value !== undefined);
}
