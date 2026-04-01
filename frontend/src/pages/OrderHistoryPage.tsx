import { useEffect, useState } from 'react';
import { Table, message, Drawer, Button, Image, Divider } from 'antd';
import axios from 'axios';
import logger from '../logger';

type OrderItem = {
  product_id: number;
  name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_name?: string;
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
    fetchOrders();
  }, []);

  async function checkAdminRole() {
    try {
      const res = await axios.get('/api/users/profile');
      setIsAdmin(res.data.data.role === 'admin');
    } catch (err) {
      logger.error('[OrderHistoryPage] ロール確認失敗', err);
    }
  }

  async function fetchOrders() {
    logger.info('[OrderHistoryPage] 注文履歴取得');
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data.data);
      logger.info('[OrderHistoryPage] 注文履歴取得成功', `${res.data.data.length}件`);
    } catch (err: any) {
      logger.error('[OrderHistoryPage] 注文履歴取得失敗', err);
      message.error('注文履歴の取得に失敗しました');
    }
  }

  async function viewOrder(orderId: number) {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(res.data.data);
      setDrawer(true);
    } catch (err: any) {
      logger.error('[OrderHistoryPage] 注文詳細取得失敗', err);
      message.error('注文詳細の取得に失敗しました');
    }
  }

  const columns = [
    { title: '注文番号', dataIndex: 'order_number' },
    ...(isAdmin ? [{ title: '顧客名', dataIndex: 'user_name' }] : []),
    { title: '合計金額', dataIndex: 'total_amount', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: 'ステータス',
      dataIndex: 'status',
      render: (v: string) => (
        <span style={{
          color: v === 'completed' ? '#52c41a' : v === 'pending' ? '#faad14' : '#1890ff',
          fontWeight: 600,
        }}>
          {v === 'completed' ? '配送完了' : v === 'pending' ? '処理中' : v === 'shipped' ? '発送済み' : v}
        </span>
      ),
    },
    {
      title: '作成日',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('ja-JP'),
    },
    {
      title: '操作',
      render: (_value: unknown, record: any) => (
        <Button type="link" onClick={() => viewOrder(record.id)}>詳細</Button>
      ),
    },
  ];

  return (
    <div>
      <Table dataSource={orders.map((o) => ({ key: o.id, ...o }))} columns={columns} pagination={false} />
      <Drawer
        title={`注文番号: ${selectedOrder?.order?.order_number || ''}`}
        onClose={() => setDrawer(false)}
        open={drawer}
        width={500}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>ステータス</div>
              <span style={{
                color: selectedOrder.order.status === 'completed' ? '#52c41a' : '#faad14',
                fontWeight: 600,
              }}>
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
                  <div style={{ width: 80, height: 80, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 30 }}>🛍️</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                    ¥{item.unit_price.toLocaleString()} × {item.quantity}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ff4d4f' }}>
                    ¥{(item.unit_price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
