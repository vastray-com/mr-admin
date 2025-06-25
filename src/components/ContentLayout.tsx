import clsx from 'clsx';
import type { FC, ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export const ContentLayout: FC<Props> = ({ title, action, children }) => {
  const showTitleBar = !!title || !!action;
  return (
    <div className="h-full">
      {showTitleBar && (
        <div className="h-[64px] bg-white px-[20px] flex items-center justify-between">
          <h1 className="text-[20px] font-medium">{title}</h1>
          <div>{action}</div>
        </div>
      )}

      <div
        className={clsx(
          showTitleBar ? 'h-[calc(100%_-_64px)]' : 'h-full',
          'p-[20px]',
        )}
      >
        <div className="w-full h-full">{children}</div>
      </div>
    </div>
  );
};
