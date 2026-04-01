import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, InputNumber, Select, message, Tabs, Drawer, Image, Divider, Spin } from 'antd';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logger from '../logger';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name: string;
  stock: number;
  image_url?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_name?: string;
}

interface OrderItem {
  product_id: number;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (!token || role !== 'admin') {
      message.error('管理者権限が必要です');
      navigate('/');
      return;
    }
    setLoading(true);
    Promise.all([fetchStats(), fetchProducts(), fetchCategories(), fetchOrders(), fetchMonthlySummary()])
      .finally(() => setLoading(false));
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get('/api/admin/stats/users'),
        axios.get('/api/admin/stats/products'),
        axios.get('/api/admin/stats/orders'),
      ]);
      setStats({
        users: usersRes.data.data.count,
        products: productsRes.data.data.count,
        orders: ordersRes.data.data.count,
        revenue: ordersRes.data.data.revenue,
      });
    } catch (err) {
      logger.error('[AdminDashboard] 統計取得失敗', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products');
      setProducts(res.data.data);
    } catch (err) {
      logger.error('[AdminDashboard] 商品取得失敗', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data.data);
    } catch (err) {
      logger.error('[AdminDashboard] カテゴリ取得失敗', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders/recent');
      logger.log('[AdminDashboard] 注文取得成功:', res.data.data.length, '件');
      setOrders(res.data.data);
    } catch (err) {
      logger.error('[AdminDashboard] 注文取得失敗', err);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const res = await axios.get('/api/admin/stats/monthly-summary');
      setMonthlySummary(res.data.data);
      logger.info('[AdminDashboard] 月別統計取得成功', res.data.data.length, '件');
    } catch (err) {
      logger.error('[AdminDashboard] 月別統計取得失敗', err);
    }
  };

  const viewOrder = async (orderId: number) => {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(res.data.data);
      setDrawerVisible(true);
    } catch (err) {
      logger.error('[AdminDashboard] 注文詳細取得失敗', err);
    }
  };

  const showProductModal = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
    setProductModalVisible(true);
  };

  const saveProduct = async (values: any) => {
    try {
      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, values);
        message.success('商品を更新しました');
      } else {
        await axios.post('/api/admin/products', values);
        message.success('商品を追加しました');
      }
      setProductModalVisible(false);
      fetchProducts();
    } catch (err: any) {
      message.error('エラーが発生しました');
      logger.error('[AdminDashboard] 商品保存失敗', err);
    }
  };

  const deleteProduct = async (id: number) => {
    Modal.confirm({
      title: '削除確認',
      content: 'この商品を削除しますか？',
      okText: '削除',
      cancelText: 'キャンセル',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await axios.delete(`/api/admin/products/${id}`);
          message.success('商品を削除しました');
          fetchProducts();
        } catch (err) {
          message.error('削除に失敗しました');
        }
      },
    });
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* ダッシュボード */}
        <Tabs.TabPane tab="📊 ダッシュボード" key="dashboard">
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="ユーザー数" value={stats.users} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="商品数" value={stats.products} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="注文数" value={stats.orders} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="売上高"
                  value={stats.revenue}
                  prefix="¥"
                  precision={0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="📋 最近の注文" style={{ marginBottom: 24 }}>
            <Table
              dataSource={orders.map((o) => ({ key: o.id, ...o }))}
              columns={[
                { title: '注文番号', dataIndex: 'order_number' },
                { title: 'ユーザー', dataIndex: 'user_name' },
                { title: '金額', dataIndex: 'total_amount', render: (v: number) => `¥${v.toLocaleString()}` },
                {
                  title: 'ステータス',
                  dataIndex: 'status',
                  render: (v: string) => <span style={{ color: v === 'completed' ? '#52c41a' : '#faad14' }}>{v}</span>,
                },
                { title: '日時', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleDateString('ja-JP') },
                {
                  title: '操作',
                  render: (_, record: any) => <Button type="link" onClick={() => viewOrder(record.id)}>詳細</Button>,
                },
              ]}
              pagination={false}
            />
          </Card>

          <Card title="📊 月別統計">
            <Table
              dataSource={monthlySummary.map((item) => ({
                key: item.month,
                month: new Date(item.month).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit' }),
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
            />
          </Card>
        </Tabs.TabPane>

        {/* 商品管理 */}
        <Tabs.TabPane tab="📦 商品管理" key="products">
          <Button type="primary" style={{ marginBottom: 16 }} onClick={() => showProductModal()}>
            新しい商品を追加
          </Button>
          <Table
            dataSource={products.map((p) => ({ key: p.id, ...p }))}
            columns={[
              {
                title: '画像',
                dataIndex: 'image_url',
                width: 80,
                render: (url: string) => (
                  url ? <Image src={url} width={60} height={60} style={{ objectFit: 'cover' }} /> : <div style={{ width: 60, height: 60, background: '#f0f2f5' }} />
                ),
              },
              { title: '商品名', dataIndex: 'name' },
              { title: 'カテゴリ', dataIndex: 'category_name' },
              { title: '価格', dataIndex: 'price', render: (v: number) => `¥${v.toLocaleString()}` },
              { title: '在庫', dataIndex: 'stock' },
              {
                title: '操作',
                render: (_, record: any) => (
                  <span style={{ display: 'flex', gap: 8 }}>
                    <Button type="link" onClick={() => showProductModal(record)}>編集</Button>
                    <Button type="link" danger onClick={() => deleteProduct(record.id)}>削除</Button>
                  </span>
                ),
              },
            ]}
            pagination={false}
          />
        </Tabs.TabPane>

        {/* 購入履歴 */}
        <Tabs.TabPane tab="🛒 購入履歴" key="orders">
          <Table
            dataSource={orders.map((o) => ({ key: o.id, ...o }))}
            columns={[
              { title: '注文番号', dataIndex: 'order_number' },
              { title: 'ユーザー', dataIndex: 'user_name' },
              { title: '金額', dataIndex: 'total_amount', render: (v: number) => `¥${v.toLocaleString()}` },
              {
                title: 'ステータス',
                dataIndex: 'status',
                render: (v: string) => (
                  <span style={{ color: v === 'completed' ? '#52c41a' : v === 'shipped' ? '#1890ff' : '#faad14', fontWeight: 600 }}>
                    {v === 'completed' ? '配送完了' : v === 'shipped' ? '発送済み' : '処理中'}
                  </span>
                ),
              },
              { title: '日時', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleDateString('ja-JP') },
              {
                title: '詳細',
                render: (_, record: any) => <Button type="link" onClick={() => viewOrder(record.id)}>表示</Button>,
              },
            ]}
            pagination={false}
          />
        </Tabs.TabPane>

        {/* 売上統計 */}

      </Tabs>

      {/* 注文詳細ドロワー */}
      <Drawer
        title={`注文番号: ${selectedOrder?.order?.order_number || ''}`}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>ステータス</div>
              <span style={{ color: selectedOrder.order.status === 'completed' ? '#52c41a' : '#faad14', fontWeight: 600 }}>
                {selectedOrder.order.status === 'completed' ? '配送完了' : '処理中'}
              </span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>合計金額</div>
              <div style={{ fontSize: 18, color: '#ff4d4f', fontWeight: 700 }}>¥{selectedOrder.order.total_amount.toLocaleString()}</div>
            </div>
            <Divider />
            <div style={{ fontWeight: 600, marginBottom: 12 }}>商品一覧</div>
            {selectedOrder.items.map((item: OrderItem) => (
              <div key={item.product_id} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e8e8e8' }}>
                {item.image_url ? (
                  <Image src={item.image_url} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 80, height: 80, background: '#f0f2f5', borderRadius: 4 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>¥{item.unit_price.toLocaleString()} × {item.quantity}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ff4d4f' }}>¥{(item.unit_price * item.quantity).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* 商品編集モーダル */}
      <Modal
        title={editingProduct ? '商品を編集' : '新しい商品を追加'}
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={saveProduct}>
          <Form.Item label="商品名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="説明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="価格" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item label="カテゴリ" name="category_id" rules={[{ required: true }]}>
            <Select placeholder="選択">
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="在庫" name="stock" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
