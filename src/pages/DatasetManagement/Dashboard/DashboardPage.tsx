import { App, Button, Card, DatePicker, Form, Select, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { type FC, useCallback, useEffect, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { DashboardContent } from '@/pages/DatasetManagement/Dashboard/DashboardContent';
import { ENUM_VARS } from '@/typing/enum';
import {
  WarehouseOverviewRelativeTime,
  WarehouseOverviewTimeType,
} from '@/typing/enum/warehouse';
import type { Warehouse } from '@/typing/warehose';

const deptList = [
  '全部科室',
  '神经外科',
  '胃肠外科',
  '消化内科',
  '介入放射科',
  '呼吸与危重症医学科',
  '产科',
  '重症医学科',
  'EICU',
  '肿瘤科',
  '风湿免疫科',
  '血液科',
  '创伤中心',
  '特需病房',
  '血管外科',
  '内分泌代谢科',
  '发热病房科',
  '脊柱外科',
  '感染性疾病科',
  '整形烧伤科',
  '眼科',
  '肿瘤放射治疗科',
  '骨关节科',
  '肿瘤科(生物治疗中心)',
  '胸外科',
  '创伤骨科',
  '脑血管病科',
  '呼吸与危重症医学科',
  '肝胆胰外科',
  '泌尿外科',
  '皮肤科',
  '心血管内科',
  '颌面外科',
  '中西医结合科',
  '疼痛科',
  '妇科',
  '耳鼻咽喉科',
  '血液科',
  '肾内科',
  '老年医学科',
  '创伤中心',
  '创伤骨科',
  '中西医结合科',
  '重症医学科',
  '甲状腺外科小儿外科',
  '心脏大血管外科',
  '神经内科',
  '眼科',
  '颈肩腰腿痛专病中心',
  '内分泌代谢科',
  '耳鼻咽喉科',
  '胸外科',
  '乳腺外科',
  '皮肤科',
  '疼痛科',
  '泌尿外科',
  '妇科',
  '胃肠外科',
  '眼科',
  '肿瘤科',
  '整形烧伤科',
  '急诊病房',
  '肝脏肿瘤专病中心',
  '产科',
  '介入放射科',
  '儿科',
  '骨关节科',
];

type TimeFilterForm = {
  timeType: WarehouseOverviewTimeType;
  relative: WarehouseOverviewRelativeTime;
  range: [Dayjs, Dayjs];
  dept: string;
};

const relativeTimeToRange = (
  r: WarehouseOverviewRelativeTime,
): [Dayjs, Dayjs] => {
  const now = dayjs();
  switch (r) {
    case WarehouseOverviewRelativeTime.CurWeek:
      return [now.isoWeekday(1), now.endOf('day')];
    case WarehouseOverviewRelativeTime.CurMonth:
      return [now.startOf('month'), now.endOf('day')];
    case WarehouseOverviewRelativeTime.CurYear:
      return [now.startOf('year'), now.endOf('day')];
    default:
      return [now, now];
  }
};

const DashboardPage: FC = () => {
  const { message } = App.useApp();
  const { warehouseApi } = useApi();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Warehouse.DashboardData | null>(null);

  const [filterForm] = Form.useForm<TimeFilterForm>();
  const timeType = Form.useWatch('timeType', filterForm);

  // 拉取数据
  const fetchData = useCallback(async (values: TimeFilterForm) => {
    setLoading(true);
    console.log('拉取数据：', values);
    const range =
      values.timeType === WarehouseOverviewTimeType.Relative
        ? relativeTimeToRange(values.relative)
        : values.range;

    const params: Warehouse.GetDashboardDataParams = {
      date_start: range[0].format('YYYY-MM-DD'),
      date_end: range[1].format('YYYY-MM-DD'),
      department_name: values.dept,
    };

    console.log('获取数据总览参数：', params);

    try {
      const res = await warehouseApi.getDashboardData(params);
      console.log('获取总览数据结果：', res);
      if (res.code === 200) {
        message.success('获取总览数据成功');
        setData(res.data);
      } else {
        message.error(`获取总览数据失败：${res.message}`);
      }
    } catch (e) {
      console.error('获取总览数据失败：', e);
      message.error('获取总览数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 查询提交
  const onFinish = useCallback((values: TimeFilterForm) => {
    fetchData(values);
  }, []);

  // 首次加载
  useEffect(() => {
    fetchData(filterForm.getFieldsValue());
  }, []);

  return (
    <ContentLayout title="数据总览">
      <Card>
        <Form<TimeFilterForm>
          layout="inline"
          form={filterForm}
          name="filter-overview-form"
          onFinish={onFinish}
          onFinishFailed={(v) => {
            console.log('表单提交失败：', v);
          }}
          initialValues={{
            timeType: WarehouseOverviewTimeType.Relative,
            relative: WarehouseOverviewRelativeTime.CurWeek,
            dept: deptList[0],
            range: null,
          }}
        >
          <Form.Item<TimeFilterForm>
            label="科室"
            name="dept"
            className="w-[240px]"
          >
            <Select
              showSearch
              options={deptList.map((d) => ({ label: d, value: d }))}
            />
          </Form.Item>

          <Form.Item<TimeFilterForm>
            label="过滤方式"
            name="timeType"
            className="w-[240px]"
          >
            <Select options={ENUM_VARS.WAREHOUSE.OVERVIEW_TIME_TYPE_OPT} />
          </Form.Item>

          <Form.Item<TimeFilterForm>
            label="时间范围"
            name="relative"
            className="w-[380px]"
            hidden={timeType === WarehouseOverviewTimeType.Range}
            rules={[
              {
                required: timeType === WarehouseOverviewTimeType.Relative,
                message: '请选择时间',
              },
            ]}
          >
            <Select options={ENUM_VARS.WAREHOUSE.OVERVIEW_RELATIVE_TIME_OPT} />
          </Form.Item>

          <Form.Item<TimeFilterForm>
            label="时间范围"
            name="range"
            className="w-[380px]"
            hidden={timeType === WarehouseOverviewTimeType.Relative}
            rules={[
              {
                required: timeType === WarehouseOverviewTimeType.Range,
                message: '请选择时间范围',
              },
            ]}
          >
            <DatePicker.RangePicker
              className="w-full"
              disabledDate={(current) =>
                current && current > dayjs().endOf('day')
              }
            />
          </Form.Item>

          <Form.Item<TimeFilterForm>>
            <Button htmlType="submit" type="primary">
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Spin spinning={loading} tip="查询数据中...">
        <Card
          styles={{
            body: {
              height: 'calc(100vh - 48px - 64px - 20px - 80px - 16px - 24px',
              overflow: 'auto',
            },
          }}
          className="mt-[16px]"
        >
          <DashboardContent data={data} />
        </Card>
      </Spin>
    </ContentLayout>
  );
};

export default DashboardPage;
