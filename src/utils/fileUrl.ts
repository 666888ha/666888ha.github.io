/** 将接口返回的相对路径（如 /storage/...）转为可访问的完整 URL，与 BaseUpload 中逻辑一致 */
export function resolveFileUrl(path: string | undefined | null): string {
  if (path == null || path === '') return '';
  const p = String(path).trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p) || p.startsWith('data:')) return p;
  const base = import.meta.env.VITE_API_URL || '';
  const normalized = p.startsWith('/') ? p : `/${p}`;
  return base ? `${base}${normalized}` : normalized;
}
