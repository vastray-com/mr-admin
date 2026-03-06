import { Form } from 'antd';
import type { FormLayout } from 'antd/es/form/Form';
import type { FormInstance } from 'antd/es/form/hooks/useForm';
import type { ReactNode } from 'react';

type Props<T> = {
  name: string;
  form: FormInstance<T>;
  onFinish?: (v: T) => void;
  layout?: FormLayout;
  requiredMark?: boolean;
  className?: string;
  // styles?: FormStylesType;
  children: ReactNode;
};

export const MyForm = <T,>({
  name,
  form,
  onFinish,
  layout,
  requiredMark,
  className,
  children,
}: Props<T>) => {
  return (
    <Form<T>
      className={className}
      form={form}
      name={name}
      onFinish={onFinish}
      onFinishFailed={(v) => {
        console.log(`表单 ${name} 提交失败：`, v);
      }}
      autoComplete="off"
      layout={layout}
      requiredMark={requiredMark}
      styles={layout === 'vertical' ? { label: { height: '20px' } } : undefined}
      size="large"
    >
      {children}
    </Form>
  );
};
