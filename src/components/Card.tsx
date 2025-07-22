import { Card } from 'antd';
import type { ReactNode } from 'react';

export const ScrollableCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Card
      title={title}
      className="w-full h-full overflow-auto pos-relative"
      styles={{
        header: {
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 10,
        },
      }}
    >
      {children}
    </Card>
  );
};
