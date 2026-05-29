import { areaTree } from '@/utils/area';

/** 根据区县 adcode（6 位，与级联 value 一致）反查 [省, 市, 区] code */
export function findCascaderPathByAdcode(adcode: string | number | undefined): string[] | null {
  if (adcode == null || adcode === '') return null;
  const code = String(adcode);
  for (const p of areaTree) {
    for (const c of p.children || []) {
      for (const co of c.children || []) {
        if (String(co.value) === code) {
          return [String(p.value), String(c.value), String(co.value)];
        }
      }
    }
  }
  return null;
}
