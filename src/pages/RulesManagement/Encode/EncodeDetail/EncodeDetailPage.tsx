import { App, Button, Card, Form, Input } from 'antd';
import { type FC, useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';

const initialDetail: Encode.FormDetail = {
  id: 0,
  name_cn: '',
  name_en: null,
  encode_type: 1,
  comment: '',
  value: '',
};

const EncodeDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { message } = App.useApp();
  const nav = useNavigate();
  const { encodeApi } = useApi();
  const isNewEncode = useRef(id === 'NEW');
  const isInit = useRef(isNewEncode.current);

  const [detail, setDetail] = useState<Encode.FormDetail>(initialDetail);
  const fetchDetail = useCallback(
    async (id: string) => {
      const res = await encodeApi.getEncodeDetail({ id: Number(id) });
      if (!res.data.id) {
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

  const [form] = Form.useForm<Encode.FormDetail>();

  // 保存
  const onFinish = useCallback(async (values: Encode.FormDetail) => {
    const submitData: Encode.Detail = {
      ...values,
      value: JSON.parse(values.value),
    };
    if (isNewEncode.current) {
      console.log('新建码表:', submitData);
    } else {
      console.log('更新码表:', submitData);
    }
  }, []);
  if (!isInit.current && !isNewEncode.current && id) {
    fetchDetail(id);
  }

  if (!id || !isInit.current) return null;
  return (
    <Form
      name="encode-save"
      onFinish={onFinish}
      initialValues={detail}
      autoComplete="off"
      className="w-full h-full"
      form={form}
    >
      <ContentLayout
        breadcrumb={[
          {
            title: <Link to="/rules_management/encode">码表管理</Link>,
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
            <Form.Item<Encode.FormDetail>
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

            <Form.Item<Encode.FormDetail>
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
            <Form.Item<Encode.FormDetail>
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
          <Form.Item<Encode.FormDetail>
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

export default EncodeDetailPage;
