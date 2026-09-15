import { service } from '@/utils/service';
import type { AxiosResponse } from 'axios';

export const formatSecondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const secondString = `${minutes > 0 ? secs.toString().padStart(2, '0') : secs.toString()} 秒`;
  const minuteString =
    minutes > 0
      ? `${hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString()} 分`
      : '';
  const hourString = hours > 0 ? `${hours.toString()} 小时` : '';

  return `${hourString} ${minuteString} ${secondString}`.trim() || '0秒';
};

export const formatCountToString = (count?: number): string => {
  if (count === undefined || count === null) return '-';
  const r = count.toString().split('').reverse();
  const formatted = r.reduce((acc, digit, index) => {
    return (
      acc + digit + ((index + 1) % 3 === 0 && index !== r.length - 1 ? ',' : '')
    );
  }, '');
  return formatted.split('').reverse().join('');
};

/**
 * 从 `Content-Disposition` 响应头解析文件名。
 *
 * 优先取 RFC 5987 的扩展参数 `filename*=charset''<百分号编码>`（中文等非 ASCII 文件名走这里，
 * 服务端会同时给出 ASCII 回退名，回退名中的非 ASCII 字符已被替换，不能直接使用）；
 * 其次回退到 `filename="..."`；均解析不到时返回 `undefined`。
 *
 * @param disposition `Content-Disposition` 响应头的原始值
 * @returns 解析出的文件名，解析失败返回 `undefined`
 */
export const parseContentDispositionFileName = (
  disposition?: string | null,
): string | undefined => {
  if (!disposition) return undefined;

  // filename*=UTF-8''%E4%B8%AD%E6%96%87.docx（`charset'language'value`，语言段可省略）
  const extended = /filename\*\s*=\s*([^;]+)/i.exec(disposition);
  if (extended?.[1]) {
    const value = extended[1].trim().replace(/^["']|["']$/g, '');
    const segments = value.split("'");
    const encoded = segments.length >= 3 ? segments.slice(2).join("'") : value;
    try {
      const decoded = decodeURIComponent(encoded);
      if (decoded) return decoded;
    } catch {
      // 百分号编码非法时忽略，继续尝试普通 filename
    }
  }

  // filename="中文.docx"、filename=中文.docx（排除 filename*= 形式）
  const plain = /(?:^|;)\s*filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(
    disposition,
  );
  const raw = plain?.[1] ?? plain?.[2];
  return raw?.trim() || undefined;
};

export const downloadFile = (response: AxiosResponse<Blob>) => {
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;

  // 优先使用 filename*（支持中文文件名），回退到 filename，均解析不到时给默认名
  a.download =
    parseContentDispositionFileName(response.headers['content-disposition']) ??
    'download_file';
  a.click();

  // 释放 URL 对象和移除 a 元素
  URL.revokeObjectURL(url);
  a.remove();
};

export const generateCurlExample = (
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, any>,
): string => {
  const url = service.defaults.baseURL + path;
  const { api_key, ...rest } = params ?? {};

  let curl = '';
  if (method === 'POST') {
    curl += `curl -X ${method} '${url}' \\\n`;
  } else if (method === 'GET') {
    const queryParams = new URLSearchParams(rest).toString();
    curl += `curl -X ${method} '${url}?${queryParams}' \\\n`;
  }
  curl += `  -H 'Content-Type: application/json' \\\n`;

  if (api_key) {
    curl += `  -H 'Authorization: ${api_key}' \\\n`;
  }

  if (method === 'POST' && rest && Object.keys(rest).length > 0) {
    const dataString = JSON.stringify(rest, null, 2)
      .split('\n')
      .map((line, idx) => (idx === 0 ? `${line}` : `  ${line}`))
      .join('\n');
    curl += `  -d '${dataString}'`;
  }

  return curl;
};

export const enumMapToOptions = <T extends Record<string, string>>(
  enumMap: T,
): { value: keyof T; label: string }[] => {
  return Object.entries(enumMap).map(([k, v]) => ({
    value: k as keyof T,
    label: v,
  }));
};
