import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import type { DataProject } from '@/typing/dataProject';

// 未显式写 LIMIT 时，执行 SQL 默认返回的最大行数
const DEFAULT_LIMIT = 200;

const DataViewDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { message } = App.useApp();
  const { dataProjectApi } = useApi();

  const [view, setView] = useState<DataProject.View | null>(null);
  const [project, setProject] = useState<DataProject.Item | null>(null);
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<DataProject.ViewQueryResult | null>(
    null,
  );

  const savedSql = view?.sql ?? '';
  const dirty = sql.trim() !== savedSql.trim();

  // 执行指定 SQL 并将结果写入数据区（用于首次加载、手动执行、保存后回显）
  const executeSql = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        message.warning('SQL 不能为空');
        return;
      }
      setExecuting(true);
      try {
        const res = await dataProjectApi.executeViewSql({
          sql: trimmed,
          limit: DEFAULT_LIMIT,
        });
        if (res.code === 200) {
          setResult(res.data);
        } else {
          setResult(null);
          message.error(res.message || '执行失败');
        }
      } catch (e) {
        console.error('执行视图 SQL 失败:', e);
        setResult(null);
        message.error('执行失败，请检查 SQL 是否正确');
      } finally {
        setExecuting(false);
      }
    },
    [dataProjectApi, message],
  );

  const loadView = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await dataProjectApi.getViewDetail(uid);
      if (res.code !== 200) {
        message.error(res.message || '获取视图详情失败');
        return;
      }
      setView(res.data);
      setSql(res.data.sql ?? '');
      if (res.data.project_uid) {
        const projectRes = await dataProjectApi.getDetail(res.data.project_uid);
        if (projectRes.code === 200) {
          setProject(projectRes.data);
        }
      }
      if (res.data.sql) {
        await executeSql(res.data.sql);
      }
    } catch (e) {
      console.error('获取视图详情失败:', e);
      message.error('获取视图详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dataProjectApi, executeSql, message, uid]);

  useEffect(() => {
    loadView();
  }, [loadView]);

  const onSave = useCallback(async () => {
    if (!view) return;
    const trimmed = sql.trim();
    if (!trimmed) {
      message.warning('SQL 不能为空');
      return;
    }
    setSaving(true);
    try {
      const res = await dataProjectApi.updateView({
        uid: view.uid,
        sql: trimmed,
      });
      if (res.code === 200) {
        message.success('保存成功');
        setView({ ...view, sql: trimmed });
        await executeSql(trimmed);
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (e) {
      console.error('保存视图 SQL 失败:', e);
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [executeSql, message, sql, view]);

  const onReset = useCallback(() => {
    setSql(savedSql);
  }, [savedSql]);

  const infoItems = useMemo(() => {
    if (!view) return [];
    return [
      { key: 'name', label: '视图名称', children: view.name },
      {
        key: 'project',
        label: '所属项目',
        children: project ? (
          <Link to={`/data_project/detail/${view.project_uid}`}>
            {project.name}
          </Link>
        ) : (
          '-'
        ),
      },
      {
        key: 'db',
        label: 'Doris 数据库',
        children: project?.doris_database || '-',
      },
      { key: 'comment', label: '描述', children: view.comment || '-' },
      {
        key: 'creator',
        label: '创建人',
        children: view.creator_name || '-',
      },
      {
        key: 'updated',
        label: '更新时间',
        children: view.updated_at
          ? dayjs(view.updated_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
      },
    ];
  }, [project, view]);

  if (!uid) {
    return <div className="p-[20px]">缺少视图 ID</div>;
  }

  return (
    <ContentLayout
      title="数据视图详情"
      breadcrumb={[
        { title: <Link to="/data_project/list">数据项目</Link> },
        {
          title: view?.project_uid ? (
            <Link to={`/data_project/detail/${view.project_uid}`}>
              项目详情
            </Link>
          ) : (
            '项目详情'
          ),
        },
        { title: '视图详情' },
      ]}
    >
      <Card title="视图信息" loading={loading && !view}>
        <Descriptions bordered size="small" column={3} items={infoItems} />
      </Card>

      <Card
        className="mt-[16px]"
        title="视图 SQL"
        extra={
          dirty ? <Tag color="orange">已修改未保存</Tag> : <Tag>已保存</Tag>
        }
      >
        <Input.TextArea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={10}
          style={{ fontFamily: 'monospace' }}
          placeholder="SELECT ...（仅支持单条 SELECT / WITH 查询）"
        />
        <div className="mt-[12px] flex items-center gap-[8px]">
          <Button
            type="primary"
            onClick={() => executeSql(sql)}
            loading={executing}
          >
            执行当前 SQL
          </Button>
          <Button onClick={onSave} loading={saving} disabled={!dirty}>
            保存
          </Button>
          <Button onClick={onReset} disabled={!dirty}>
            重置
          </Button>
          <Typography.Text type="secondary">
            仅支持单条 SELECT / WITH 查询；未写 LIMIT 时默认最多返回{' '}
            {DEFAULT_LIMIT} 行
          </Typography.Text>
        </div>
      </Card>

      <Card
        className="mt-[16px]"
        title={`数据${result ? `（${result.count} 行）` : ''}`}
        extra={
          <Button
            size="small"
            onClick={() => executeSql(sql)}
            loading={executing}
          >
            刷新
          </Button>
        }
      >
        <Table<Record<string, any>>
          loading={executing}
          scroll={{ x: true }}
          dataSource={result?.rows}
          rowKey={(_, index) => `row-${index}`}
          locale={{
            emptyText: (
              <Empty description="暂无数据，点击「执行当前 SQL」检索" />
            ),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 行`,
          }}
        >
          {result?.columns.map((column) => (
            <Table.Column
              key={column.value}
              dataIndex={column.value}
              title={column.label}
              ellipsis
              render={(value: any) =>
                value === null || value === undefined || value === ''
                  ? '-'
                  : String(value)
              }
            />
          ))}
        </Table>
      </Card>
    </ContentLayout>
  );
};

export default DataViewDetailPage;
