import clsx from 'clsx';

export const FullLoading = () => {
  return (
    <div
      className={clsx(
        'flex w-full h-full flex-col gap-y-[8px] items-center justify-center visible',
      )}
    >
      <div className="i-line-md:loading-loop text-[36px] fg-secondary" />
      <span className="text-[14px] fg-secondary">Loading...</span>
    </div>
  );
};
