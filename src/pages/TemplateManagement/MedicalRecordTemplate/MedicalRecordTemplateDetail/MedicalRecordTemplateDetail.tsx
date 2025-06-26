import { Button, Card, Form, Input, InputNumber, Select } from 'antd';
import { type FC, useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import {
  MedicalTemplateFieldDescType,
  MedicalTemplateStatus,
  MedicalTemplateType,
  medicalTemplateFieldDescTypeOptions,
  medicalTemplateFieldTypeOptions,
  medicalTemplateTypeOptions,
} from '@/typing/enum';
import { service } from '@/utils/service';
import type { MedicalRecordTemplate } from '@/typing/medicalRecordTemplate';

const initialDetail: MedicalRecordTemplate.Detail = {
  comment: '',
  id: 'xxxx',
  mr_node_id: 'yyyy',
  mr_type: MedicalTemplateType.Outpatient,
  name_cn: '',
  name_en: '',
  sort_index: 0,
  status: MedicalTemplateStatus.Enabled,
  update_time: 'zzzz',
  fields: [],
};

const MedicalRecordTemplateDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNewTemplate = useRef(id === 'NEW');
  const isInit = useRef(isNewTemplate.current);

  const [detail, setDetail] =
    useState<MedicalRecordTemplate.Detail>(initialDetail);
  const fetchDetail = useCallback(async (id: string) => {
    const res = await service.get('/314100093', { params: { id } });
    console.log('拉取病历模板详情成功:', res);
    setDetail(res.data);
    isInit.current = true;
  }, []);

  const [form] = Form.useForm<MedicalRecordTemplate.Detail>();

  // 保存
  const onFinish = useCallback(async (values: MedicalRecordTemplate.Detail) => {
    console.log('保存病历模板:', values);
  }, []);
  if (!isInit.current && !isNewTemplate.current && id) {
    fetchDetail(id);
  }

  // 滚动
  const fieldsScrollEl = useRef<HTMLDivElement | null>(null);

  if (!id || !isInit.current) return null;
  return (
    <Form
      name="medical-record-template-save"
      onFinish={onFinish}
      initialValues={detail}
      autoComplete="off"
      className="w-full h-full"
      form={form}
    >
      <ContentLayout
        breadcrumb={[
          {
            title: (
              <Link to="/template_management/medical_record_template">
                病历模版
              </Link>
            ),
          },
          { title: '编辑模版' },
        ]}
        title={isNewTemplate.current ? '新建病历模板' : '编辑病历模板'}
        action={
          <Button htmlType="submit" type="primary">
            保存
          </Button>
        }
      >
        <Card className="h-[220px]" title="基本信息">
          <div className="flex items-center gap-x-[24px] mb-[8px]">
            <Form.Item<MedicalRecordTemplate.Detail>
              label="规则名称"
              name="name_cn"
              className="w-[36%]"
              rules={[
                { required: true, message: '请输入规则名称' },
                { whitespace: true, message: '规则名称不能为空' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item<MedicalRecordTemplate.Detail>
              label="英文名称"
              name="name_en"
              className="w-[36%]"
              rules={[
                { required: true, message: '请输入英文名称' },
                { whitespace: true, message: '英文名称不能为空' },
              ]}
            >
              <Input />
            </Form.Item>
          </div>

          <div className="flex items-center gap-x-[24px]">
            <Form.Item<MedicalRecordTemplate.Detail>
              label="所属分类"
              name="mr_type"
              className="w-[16%]"
              rules={[
                { required: true, message: '请选择所属分类' },
                {
                  type: 'enum',
                  enum: medicalTemplateTypeOptions.map((item) => item.value),
                  message: '请选择正确的所属分类',
                },
              ]}
            >
              <Select options={medicalTemplateTypeOptions} />
            </Form.Item>
            <Form.Item<MedicalRecordTemplate.Detail>
              label="排序权重"
              name="sort_index"
              className="w-[16%]"
            >
              <InputNumber precision={0} />
            </Form.Item>
            <Form.Item<MedicalRecordTemplate.Detail>
              label="模版备注"
              name="comment"
              className="w-[38%]"
            >
              <Input />
            </Form.Item>
          </div>
        </Card>

        <Card
          title="字段设置"
          className="h-[calc(100%_-_220px_-_24px)] mt-[24px]"
          classNames={{ body: 'h-[calc(100%_-_56px)]' }}
        >
          <div className="h-full w-full">
            <Form.List name="fields">
              {(fields, { add, remove, move }) => (
                <div
                  ref={fieldsScrollEl}
                  className="h-full w-full rounded-2xl overflow-auto pos-relative"
                >
                  <table className="w-full">
                    <thead className="sticky top-0 z-1">
                      <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                        <td>数据项</td>
                        <td>定义</td>
                        <td>字段名称</td>
                        <td>类型</td>
                        <td>长度</td>
                        <td>值描述类型</td>
                        <td>字段值描述</td>
                        <td>操作</td>
                      </tr>
                    </thead>

                    <tbody>
                      {fields.map(({ key, name, ...restField }) => (
                        <tr
                          key={key}
                          className="b-b-1 b-divider children:(pt-[24px] px-[16px])"
                        >
                          <td>
                            <Form.Item
                              {...restField}
                              name={[name, 'data_name']}
                              rules={[
                                { required: true, message: '请输入名称' },
                                { whitespace: true, message: '请输入名称' },
                              ]}
                            >
                              <Input placeholder="请输入数据项名称" />
                            </Form.Item>
                          </td>

                          <td>
                            <Form.Item
                              {...restField}
                              name={[name, 'data_define']}
                              rules={[
                                { required: true, message: '请输入数据项定义' },
                                {
                                  whitespace: true,
                                  message: '请输入数据项定义',
                                },
                              ]}
                            >
                              <Input placeholder="请输入数据项定义" />
                            </Form.Item>
                          </td>

                          <td>
                            <Form.Item
                              {...restField}
                              name={[name, 'field_name']}
                              rules={[
                                { required: true, message: '请输入字段名称' },
                                { whitespace: true, message: '请输入字段名称' },
                              ]}
                            >
                              <Input placeholder="请输入字段名称" />
                            </Form.Item>
                          </td>

                          <td className="w-[120px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'field_type']}
                              rules={[
                                { required: true, message: '请选择字段类型' },
                                {
                                  type: 'enum',
                                  enum: medicalTemplateFieldTypeOptions.map(
                                    (item) => item.value,
                                  ),
                                  message: '请选择正确的字段类型',
                                },
                              ]}
                            >
                              <Select
                                placeholder="请选择字段类型"
                                options={medicalTemplateFieldTypeOptions}
                              />
                            </Form.Item>
                          </td>

                          <td className="w-[120px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'field_len']}
                              rules={[
                                { required: true, message: '请输入长度' },
                              ]}
                            >
                              <InputNumber
                                placeholder="请输入长度"
                                precision={0}
                              />
                            </Form.Item>
                          </td>

                          <td className="w-[120px]">
                            <Form.Item
                              {...restField}
                              name={[name, 'field_desc_type']}
                              rules={[
                                { required: true, message: '请选择值描述类型' },
                                {
                                  type: 'enum',
                                  enum: medicalTemplateFieldDescTypeOptions.map(
                                    (item) => item.value,
                                  ),
                                  message: '请选择正确的值描述类型',
                                },
                              ]}
                            >
                              <Select
                                placeholder="请选择值描述类型"
                                options={medicalTemplateFieldDescTypeOptions}
                              />
                            </Form.Item>
                          </td>

                          <td className="w-[160px]">
                            <Form.Item
                              noStyle
                              shouldUpdate={(prev, curr) =>
                                prev.fields?.[name]?.field_desc_type !==
                                curr.fields?.[name]?.field_desc_type
                              }
                            >
                              {() =>
                                form.getFieldValue([
                                  'fields',
                                  name,
                                  'field_desc_type',
                                ]) === MedicalTemplateFieldDescType.DimTable ? (
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'dim_table_id']}
                                    rules={[
                                      {
                                        type: 'enum',
                                        enum: [123, 456],
                                        message: '请选择正确的码表',
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="请选择码表"
                                      options={[
                                        { value: 123, label: 'ICD-10' },
                                        { value: 456, label: 'ICD-20' },
                                      ]}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'field_desc']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入值描述',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请输入值描述',
                                      },
                                    ]}
                                  >
                                    <Input placeholder="请输入" />
                                  </Form.Item>
                                )
                              }
                            </Form.Item>
                          </td>

                          <td className="pt-0 w-[180px]">
                            <Button
                              size="small"
                              type="link"
                              onClick={() => move(name, name - 1)}
                              disabled={name === 0}
                            >
                              上移
                            </Button>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => move(name, name + 1)}
                              disabled={name === fields.length - 1}
                            >
                              下移
                            </Button>
                            <Button
                              size="small"
                              type="link"
                              danger
                              onClick={() => remove(name)}
                            >
                              删除
                            </Button>
                          </td>
                        </tr>
                      ))}

                      <tr>
                        <td colSpan={99} className="py-[12px]">
                          <Button
                            type="dashed"
                            size="large"
                            onClick={() => {
                              add();
                              setTimeout(() => {
                                fieldsScrollEl.current?.scrollBy({
                                  top: fieldsScrollEl.current?.scrollHeight,
                                  left: 0,
                                  behavior: 'smooth',
                                });
                              }, 0);
                            }}
                            block
                          >
                            <i className="i-icon-park-outline:plus text-[16px]" />
                            <span>新增一行</span>
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </Form.List>
          </div>
        </Card>
      </ContentLayout>
    </Form>
  );
};

export default MedicalRecordTemplateDetailPage;
