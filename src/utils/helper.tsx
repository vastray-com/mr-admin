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
