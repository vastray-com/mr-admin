import { App, Button, Form, Input, Modal } from 'antd';
import { type FC, useCallback } from 'react';
import { MyForm } from '@/components/MyForm';
import { useApi } from '@/hooks/useApi';
import type { AxiosError } from 'axios';
import type { User } from '@/typing/user';

type ChangePwdModalProps = {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
};

export const ChangePwdModal: FC<ChangePwdModalProps> = ({
  open,
  onClose,
  onFinish,
}) => {
  const { userApi } = useApi();
  const { message } = App.useApp();

  const [form] = Form.useForm<User.ChangePwdParams>();

  const _onFinish = useCallback((values: User.ChangePwdParams) => {
    console.log('修改密码表单提交成功：', values);
    userApi
      .changePwd(values)
      .then((res) => {
        if (res.code === 200) {
          message.success('密码修改成功，请重新登录');
          onFinish?.();
          onClose();
        } else {
          message.error(`密码修改失败：${res.message || '未知错误'}`);
        }
      })
      .catch((e) => {
        const err = e as AxiosError<APIRes<null>>;
        message.error(
          `密码修改失败：${err.response?.data?.message || '未知错误'}`,
        );
      });
  }, []);

  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="修改密码"
      width={480}
      footer={null}
      destroyOnHidden
    >
      <MyForm<User.ChangePwdParams>
        className="mt-[20px]"
        name="change-pwd-form"
        form={form}
        onFinish={_onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item<User.ChangePwdParams>
          label="原密码"
          name="opwd"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '原密码不能为空',
            },
          ]}
        >
          <Input.Password placeholder="输入原密码" />
        </Form.Item>

        <Form.Item<User.ChangePwdParams>
          label="新密码"
          name="npwd"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '新密码不能为空',
            },
          ]}
        >
          <Input.Password placeholder="输入原密码" />
        </Form.Item>
        <Form.Item<User.ChangePwdParams>
          label="确认新密码"
          name="re_npwd"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '确认新密码不能为空',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('npwd') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="再次输入新密码" />
        </Form.Item>

        <Form.Item noStyle>
          <div className="flex items-center justify-center mt-[36px]">
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </div>
        </Form.Item>
      </MyForm>
    </Modal>
  );
};
