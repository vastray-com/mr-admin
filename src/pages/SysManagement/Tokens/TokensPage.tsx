import { App, Button, Card, Form, Input, Modal, Table } from 'antd';
import { useCallback, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import type { AxiosError } from 'axios';

const TokensPage = () => {
  const { sysApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<Tokens.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: sysApi.getTokenList,
    setData: setData,
  });

  // 新建 token
  const [form] = Form.useForm<Tokens.CreateParams>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    form.resetFields();
    setShowCreateModal(true);
  };

  const onAction = useCallback(
    (uid: string, action: 'delete') => {
      console.log(`执行操作：${action}，token ID：${uid}`);
      if (action === 'delete') {
        sysApi
          .deleteToken({ uid })
          .then((res) => {
            if (res.code === 200) {
              message.success(`操作成功`);
              // 刷新任务列表
              refresh();
            } else {
              message.error(`操作失败：${res.message}`);
            }
          })
          .catch((err) => {
            console.error(`操作任务失败：`, err);
            message.error('操作任务失败，请稍后重试');
          });
      }
    },
    [sysApi, refresh, message.error, message.success],
  );

  const onFinish = useCallback(
    async (values: Tokens.CreateParams) => {
      console.log('提交的新 token 数据：', values);
      try {
        const res = await sysApi.createToken(values);
        if (res.code === 200) {
          message.success('token 创建成功');
          setShowCreateModal(false);
          form.resetFields();
          // 刷新任务列表
          refresh();
        } else {
          message.error(`创建 token 失败：${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('创建 token 失败：', e);
        message.error(
          `创建 token 失败: ${e.response?.data.message || e.message}`,
        );
      }
    },
    [sysApi, refresh, form.resetFields, message],
  );

  return (
    <>
      <ContentLayout
        title="API 令牌列表"
        action={
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建 API 令牌
          </Button>
        }
      >
        <Card>
          <Table<Tokens.Token>
            dataSource={data}
            rowKey="uid"
            pagination={false}
          >
            <Table.Column title="token 名称" dataIndex="name" />
            <Table.Column title="token 描述" dataIndex="description" />
            <Table.Column title="token 值" dataIndex="value" />
            <Table.Column
              title="操作"
              key="action"
              width={280}
              render={(_, record: Tokens.Token) => (
                <>
                  <Button
                    type="link"
                    danger
                    onClick={() => onAction(record.uid, 'delete')}
                  >
                    删除
                  </Button>
                </>
              )}
            />
          </Table>

          <div className="mt-[20px] flex justify-end">
            <PaginationComponent />
          </div>
        </Card>
      </ContentLayout>

      <Modal
        centered
        onCancel={() => setShowCreateModal(false)}
        open={showCreateModal}
        title="新建 token"
        width={830}
        footer={null}
      >
        <Form<Tokens.CreateParams>
          className="mt-[36px]"
          form={form}
          name="new-task-form"
          onFinish={onFinish}
          onFinishFailed={(v) => {
            console.log('表单提交失败：', v);
          }}
          autoComplete="off"
          labelCol={{ span: 4 }}
        >
          <Form.Item<Tokens.CreateParams>
            label="名称"
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'token 名称不能为空',
              },
            ]}
          >
            <Input placeholder="输入名称" />
          </Form.Item>

          <Form.Item<Tokens.CreateParams> label="描述" name="description">
            <Input placeholder="输入描述" />
          </Form.Item>

          <Form.Item noStyle>
            <div className="flex items-center justify-center mt-[36px]">
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TokensPage;
