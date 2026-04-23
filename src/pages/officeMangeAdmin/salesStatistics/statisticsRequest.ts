/** 统计页公共：后端 snake_case 筛选参数 */
export function statisticsScope(deptId?: string | number, userId?: string | number) {
  const p: Record<string, string | number> = {};
  if (deptId !== undefined && deptId !== null && deptId !== '') p.dept_id = deptId as number;
  if (userId !== undefined && userId !== null && userId !== '') p.user_id = userId as number;
  return p;
}

export function monthRangeParams(monthRange: string[]) {
  if (!monthRange?.[0] || !monthRange?.[1]) return {};
  return { month_start: monthRange[0], month_end: monthRange[1] };
}

/** 筛选区月份可能清空时，回退到默认区间，保证请求参数完整 */
export function effectiveMonthRange(monthRange: string[] | undefined, fallback: () => string[]): string[] {
  if (monthRange?.length === 2 && monthRange[0] && monthRange[1]) {
    return [monthRange[0], monthRange[1]];
  }
  return fallback();
}
