import { Breadcrumb } from 'antd';
import clsx from 'clsx';
import type { FC, ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  breadcrumb?: { title: ReactNode }[];
  action?: ReactNode;
  children: ReactNode;
};

export const ContentLayout: FC<Props> = ({
  title,
  action,
  children,
  breadcrumb,
}) => {
  const showTitleBar = !!title || !!action;
  return (
    <div className="h-full w-full">
      {showTitleBar && (
        <div
          className={clsx(
            'bg-white px-[20px] flex flex-col justify-center',
            breadcrumb ? 'h-[88px] ' : 'h-[64px]',
          )}
        >
          {breadcrumb && (
            <div className="mb-[8px]">
              <Breadcrumb items={breadcrumb} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <h1 className="text-[20px] font-medium">{title}</h1>
            <div>{action}</div>
          </div>
        </div>
      )}

      <div
        className={clsx(
          showTitleBar
            ? breadcrumb
              ? 'h-[calc(100%_-_88px)]'
              : 'h-[calc(100%_-_64px)]'
            : 'h-full',
          'p-[20px]',
        )}
      >
        <div className="w-full h-full overflow-auto">{children}</div>
      </div>
    </div>
  );
};
