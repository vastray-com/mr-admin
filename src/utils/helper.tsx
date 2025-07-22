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
