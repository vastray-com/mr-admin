import { App, Button, Card, Form, Input } from 'antd';
import { type FC, useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';

const initialDetail: EncodeTable.FormDetail = {
  uid: '',
  name_cn: '',
  name_en: null,
  encode_type: 1,
  comment: '',
  value: '',
};

const EncodeTableDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { message } = App.useApp();
  const nav = useNavigate();
  const { encodeApi } = useApi();
  const isNewEncode = useRef(uid === 'NEW');
  const isInit = useRef(isNewEncode.current);

  const [detail, setDetail] = useState<EncodeTable.FormDetail>(initialDetail);
  const fetchDetail = useCallback(
    async (uid: string) => {
      const res = await encodeApi.getEncodeDetail({ uid });
      if (!res.data.uid) {
        console.error('未找到对应的码表详情');
        message.error('未找到对应的码表详情, 请检查 ID 是否正确');
        nav(-1);
        return;
      }
      console.log('拉取码表详情成功:', res);
      setDetail({
        ...res.data,
        value: JSON.stringify(res.data.value, null, 2),
      });
      isInit.current = true;
    },
    [encodeApi.getEncodeDetail, message.error, nav],
  );

  const [form] = Form.useForm<EncodeTable.FormDetail>();

  // 保存
  const onFinish = useCallback(
    async (detail: EncodeTable.FormDetail, values: EncodeTable.FormDetail) => {
      const submitData: EncodeTable.Detail = {
        ...detail,
        ...values,
        value: JSON.parse(values.value),
      };
      if (isNewEncode.current) {
        console.log('新建码表:', submitData);
        const res = await encodeApi.createEncode(submitData);
        console.log('新建码表成功:', res);
      } else {
        console.log('更新码表:', submitData);
        const res = await encodeApi.updateEncode(submitData);
        console.log('更新码表成功:', res);
      }
    },
    [encodeApi],
  );
  if (!isInit.current && !isNewEncode.current && uid) {
    fetchDetail(uid);
  }

  if (!uid || !isInit.current) return null;
  return (
    <Form
      name="encode-save"
      onFinish={(v) => onFinish(detail, v)}
      initialValues={detail}
      autoComplete="off"
      className="w-full h-full"
      form={form}
    >
      <ContentLayout
        breadcrumb={[
          {
            title: <Link to="/rule_management/encode_table">码表管理</Link>,
          },
          { title: '编辑码表' },
        ]}
        title={isNewEncode.current ? '新建码表' : '编辑码表'}
        action={
          <Button htmlType="submit" type="primary">
            保存
          </Button>
        }
      >
        <Card className="h-[220px]" title="基本信息">
          <div className="flex items-center gap-x-[24px] mb-[8px]">
            <Form.Item<EncodeTable.FormDetail>
              label="码表名称"
              name="name_cn"
              className="w-[50%]"
              rules={[
                { required: true, message: '请输入码表名称' },
                { whitespace: true, message: '码表名称不能为空' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item<EncodeTable.FormDetail>
              label="英文名称"
              name="name_en"
              className="w-[50%]"
              rules={[
                { required: true, message: '请输入英文名称' },
                { whitespace: true, message: '英文名称不能为空' },
              ]}
            >
              <Input />
            </Form.Item>
          </div>

          <div className="flex items-center gap-x-[24px]">
            <Form.Item<EncodeTable.FormDetail>
              label="码表备注"
              name="comment"
              className="w-[100%]"
            >
              <Input />
            </Form.Item>
          </div>
        </Card>

        <Card
          title="码表内容"
          className="h-[calc(100%_-_220px_-_24px)] mt-[24px]"
          classNames={{ body: 'h-[calc(100%_-_56px)]' }}
        >
          <Form.Item<EncodeTable.FormDetail>
            name="value"
            className="w-[100%]"
            label={null}
            rules={[
              { required: true, message: '请输入码表内容' },
              { whitespace: true, message: '码表内容不能为空' },
              {
                validator: (_, value) => {
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e) {
                    console.error('码表内容必须是有效的 JSON 格式:', e);
                    return Promise.reject('码表内容必须是有效的 JSON 格式');
                  }
                },
              },
            ]}
          >
            <Input.TextArea autoSize={{ minRows: 10 }} />
          </Form.Item>
        </Card>
      </ContentLayout>
    </Form>
  );
};

export default EncodeTableDetailPage;
