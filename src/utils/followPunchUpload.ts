import { MessagePlugin } from 'tdesign-vue-next';

import { uploadImageToDict } from '@/api/system/user';

/** 跟进打卡时间 Y-m-d H:i:s */
export function formatNowDateTime(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}

/** 仅允许相机/相册选图（优先唤起拍照），用户取消返回 null */
export function pickCameraImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    input.onchange = () => {
      const f = input.files?.[0] ?? null;
      resolve(f);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
  });
}

/** 上传到字典通用接口，返回可访问的 file_url */
export async function uploadDictImageToUrl(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', file);
  const raw = await uploadImageToDict(fd);
  const body = raw as { code?: number; data?: { file_url?: string }; msg?: string };
  if (body?.code === 0 || body?.code === 200) {
    const u = body.data?.file_url;
    return u ? String(u) : null;
  }
  MessagePlugin.error(body?.msg || '上传失败');
  return null;
}
