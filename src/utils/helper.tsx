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

export const downloadFile = (response: AxiosResponse<Blob>) => {
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;

  const disposition = response.headers['content-disposition'] || '';
  if (disposition) {
    // 如果响应头中有 Content-Disposition，则从中提取文件名
    const match = disposition.match(/filename="(.+)"/);
    if (match?.[1]) {
      a.download = match[1];
    } else {
      a.download = 'download_file'; // 默认文件名
    }
  } else {
    a.download = 'download_file'; // 默认文件名
  }
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
