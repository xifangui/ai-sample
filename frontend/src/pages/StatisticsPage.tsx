import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Table, message, Spin } from 'antd';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import logger from '../logger';

const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0 });
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 統計情報取得
      const statsRes = await axios.get('/api/admin/stats/orders');
      setStats({
        revenue: statsRes.data.data.revenue,
        orders: statsRes.data.data.count,
      });

      // 月別統計取得
      const monthRes = await axios.get('/api/admin/stats/monthly-summary');
      const formattedMonthly = monthRes.data.data.map((item: any) => ({
        ...item,
        month: new Date(item.month).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit' }),
      }));
      setMonthlySummary(formattedMonthly);
      logger.info('[StatisticsPage] 月別統計取得成功', formattedMonthly.length, '件');

      // カテゴリ別統計取得
      const categoryRes = await axios.get('/api/admin/stats/by-category');
      setCategoryStats(categoryRes.data.data);
      logger.info('[StatisticsPage] カテゴリ別統計取得成功');
    } catch (err) {
      logger.error('[StatisticsPage] データ取得失敗', err);
      message.error('統計情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 8 }}>
      <Typography.Title level={3}>📊 購入統計</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 5 }}>総購入金額</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>¥{stats.revenue.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 5 }}>総注文数</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.orders}件</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="📈 月別売上推移">
            {monthlySummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: any) => value.toLocaleString()} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="total_amount" stroke="#ff4d4f" name="売上（¥）" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="order_count" stroke="#1890ff" name="注文数" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '40px 0' }}>データがありません</div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🏷️ カテゴリ別売上">
            {categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.category_name}: ¥${(entry.total_amount || 0).toLocaleString()}`}
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#ff4d4f', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `¥${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '40px 0' }}>データがありません</div>
            )}
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5} style={{ marginTop: 20, marginBottom: 16 }}>月別統計詳細</Typography.Title>
      <Card>
        <Table
          dataSource={monthlySummary.map((item) => ({
            key: item.month,
            month: item.month,
            users_created: item.users_created,
            products_created: item.products_created,
            order_count: item.order_count,
            total_amount: item.total_amount,
          }))}
          columns={[
            { title: '月', dataIndex: 'month', width: 100 },
            { title: '新規ユーザー数', dataIndex: 'users_created', width: 120 },
            { title: '新規商品数', dataIndex: 'products_created', width: 120 },
            { title: '注文数', dataIndex: 'order_count', width: 100 },
            { title: '売上高', dataIndex: 'total_amount', render: (v: number) => `¥${v.toLocaleString()}` },
          ]}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default StatisticsPage;
