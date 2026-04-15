// 日期格式化
export function parseTime(time: any, pattern?: string) {
  if (arguments.length === 0 || !time) {
    return null;
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}';
  let date;
  if (typeof time === 'object') {
    date = time;
  } else {
    if (typeof time === 'string' && /^\d+$/.test(time)) {
      time = Number.parseInt(time);
    } else if (typeof time === 'string') {
      time = time
        .replace(new RegExp(/-/g), '/')
        .replace('T', ' ')
        .replace(new RegExp(/\.\d{3}/g), '');
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000;
    }
    date = new Date(time);
  }
  const formatObj: { [key: string]: any } = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  };
  return format.replace(/\{([ymdhisa])+\}/g, (result: string, key: string) => {
    let value = formatObj[key];
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value];
    }
    if (result.length > 0 && value < 10) {
      value = `0${value}`;
    }
    return value || 0;
  });
}

/**
 * 添加日期范围
 * @param params
 * @param dateRange
 * @param propName
 */
export const addDateRange = (params: any, dateRange: any[], propName?: string) => {
  const search = params;
  search.params =
    typeof search.params === 'object' && search.params !== null && !Array.isArray(search.params) ? search.params : {};
  dateRange = Array.isArray(dateRange) ? dateRange : [];
  if (typeof propName === 'undefined') {
    search.params.beginTime = dateRange[0];
    search.params.endTime = dateRange[1];
  } else {
    search.params[`begin${propName}`] = dateRange[0];
    search.params[`end${propName}`] = dateRange[1];
  }
  return search;
};

// 回显数据字典
export const selectDictLabel = (datas: any, value: number | string) => {
  if (value === undefined) {
    return '';
  }
  const actions: Array<string | number> = [];
  Object.keys(datas).some((key) => {
    if (datas[key].value == `${value}`) {
      actions.push(datas[key].label);
      return true;
    }
  });
  if (actions.length === 0) {
    actions.push(value);
  }
  return actions.join('');
};

// 回显数据字典（字符串数组）
export const selectDictLabels = (datas: any, value: any, separator: any) => {
  if (value === undefined || value.length === 0) {
    return '';
  }
  if (Array.isArray(value)) {
    value = value.join(',');
  }
  const actions: any[] = [];
  const currentSeparator = undefined === separator ? ',' : separator;
  const temp = value.split(currentSeparator);
  Object.keys(value.split(currentSeparator)).some((val) => {
    let match = false;
    Object.keys(datas).some((key) => {
      if (datas[key].value == `${temp[val]}`) {
        actions.push(datas[key].label + currentSeparator);
        match = true;
      }
    });
    if (!match) {
      actions.push(temp[val] + currentSeparator);
    }
  });
  return actions.join('').substring(0, actions.join('').length - 1);
};

// 字符串格式化(%s )
export function sprintf(str: string) {
  if (arguments.length !== 0) {
    let flag = true;
    let i = 1;
    str = str.replace(/%s/g, function () {
      const arg = arguments[i++];
      if (typeof arg === 'undefined') {
        flag = false;
        return '';
      }
      return arg;
    });
    return flag ? str : '';
  }
}

// 转换字符串，undefined,null等转化为""
export const parseStrEmpty = (str: any) => {
  if (!str || str == 'undefined' || str == 'null') {
    return '';
  }
  return str;
};

// 数据合并
export const mergeRecursive = (source: any, target: any) => {
  for (const p in target) {
    try {
      if (target[p].constructor == Object) {
        source[p] = mergeRecursive(source[p], target[p]);
      } else {
        source[p] = target[p];
      }
    } catch (e) {
      console.log(e);
      source[p] = target[p];
    }
  }
  return source;
};

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export const handleTree = <T>(data: any[], id?: string, parentId?: string, children?: string): T[] => {
  const config: {
    id: string;
    parentId: string;
    childrenList: string;
  } = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children',
  };

  const childrenListMap: any = {};
  const tree: T[] = [];
  for (const d of data) {
    const id = d[config.id];
    childrenListMap[id] = d;
    if (!d[config.childrenList]) {
      d[config.childrenList] = [];
    }
  }

  for (const d of data) {
    const parentId = d[config.parentId];
    const parentObj = childrenListMap[parentId];
    if (!parentObj) {
      tree.push(d);
    } else {
      parentObj[config.childrenList].push(d);
    }
  }
  return tree;
};

/**
 * 参数处理
 * @param {*} params  参数
 */
export const tansParams = (params: any) => {
  let result = '';
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    const part = `${encodeURIComponent(propName)}=`;
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            const params = `${propName}[${key}]`;
            const subPart = `${encodeURIComponent(params)}=`;
            result += `${subPart + encodeURIComponent(value[key])}&`;
          }
        }
      } else {
        result += `${part + encodeURIComponent(value)}&`;
      }
    }
  }
  return result;
};

// 返回项目路径
export const getNormalPath = (p: string): string => {
  if (p.length === 0 || !p || p === 'undefined') {
    return p;
  }
  const res = p.replace('//', '/');
  if (res[res.length - 1] === '/') {
    return res.slice(0, res.length - 1);
  }
  return res;
};

// 验证是否为blob格式
export const blobValidate = (data: any) => {
  return data.type !== 'application/json';
};
// 获取审批状态文本
export const getApprovalStatusText = (status: number | undefined | null) => {
  if (status === 0) return '待审批';
  if (status === 1) return '已通过';
  if (status === 2) return '已驳回';
  return '未知';
};
/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) {
    return false;
  }

  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    // 如果 Clipboard API 失败，尝试降级方案
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      return false;
    }
  }
};
export const extractColumnField = (columns: any[], fieldName: string) => {
  // 校验输入是否为有效数组，避免空值/非数组导致报错
  if (!Array.isArray(columns) || columns.length === 0) {
    console.warn('输入的列配置数组为空或不是有效数组');
    return [];
  }

  // 遍历数组，提取指定字段的值（过滤掉字段不存在/值为空的情况）
  return columns
    .map((item) => item[fieldName]) // 提取目标字段
    .filter((value) => value !== undefined && value !== null); // 过滤无效值
};

/**
 * 数字转中文大写
 * @param amount 金额数字
 * @returns 中文大写金额字符串
 */
export const amountToChinese = (amount: number | string): string => {
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const cnIntRadice = ['', '拾', '佰', '仟'];
  const cnIntUnits = ['', '万', '亿', '兆'];
  const cnDecUnits = ['角', '分', '毫', '厘'];
  const cnInteger = '整';
  const cnIntLast = '元';
  const maxNum = 999999999999999.9999;
  let IntegerNum: string;
  let DecimalNum: string;
  let ChineseStr = '';
  let parts: string[];

  // 转换为数字
  const numAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  if (numAmount === 0 || isNaN(numAmount)) {
    return cnNums[0] + cnIntLast + cnInteger;
  }
  if (numAmount > maxNum) {
    return '';
  }

  const amountStr = numAmount.toString();
  if (!amountStr.includes('.')) {
    IntegerNum = amountStr;
    DecimalNum = '';
  } else {
    parts = amountStr.split('.');
    IntegerNum = parts[0];
    DecimalNum = parts[1].substr(0, 4);
  }

  if (Number.parseInt(IntegerNum, 10) > 0) {
    let zeroCount = 0;
    const IntLen = IntegerNum.length;
    for (let i = 0; i < IntLen; i++) {
      const n = IntegerNum.substr(i, 1);
      const p = IntLen - i - 1;
      const q = Math.floor(p / 4);
      const m = p % 4;
      if (n === '0') {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          ChineseStr += cnNums[0];
        }
        zeroCount = 0;
        ChineseStr += cnNums[Number.parseInt(n)] + cnIntRadice[m];
      }
      if (m === 0 && zeroCount < 4) {
        ChineseStr += cnIntUnits[q];
      }
    }
    ChineseStr += cnIntLast;
  }

  if (DecimalNum !== '') {
    const decLen = DecimalNum.length;
    for (let i = 0; i < decLen; i++) {
      const n = DecimalNum.substr(i, 1);
      if (n !== '0') {
        ChineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }
  }
  if (ChineseStr === '') {
    ChineseStr += cnNums[0] + cnIntLast + cnInteger;
  } else if (DecimalNum === '') {
    ChineseStr += cnInteger;
  }
  return ChineseStr;
};

export default {
  handleTree,
};
