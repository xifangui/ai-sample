import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Divider, Steps, Table, message, Spin, Result } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logger from '../logger';

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
};

const OrderConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const shipping = JSON.parse(localStorage.getItem('checkout_shipping') || 'null');
  const payment  = JSON.parse(localStorage.getItem('checkout_payment')  || 'null');

  useEffect(() => {
    if (!shipping || !payment) {
      message.warning('配送先または支払い方法が未設定です');
      navigate('/shipping');
      return;
    }
    axios.get('/api/cart').then((res) => {
      setCartItems(res.data.data);
    }).catch((err) => {
      logger.error('[OrderConfirmPage] カート取得失敗', err);
      message.error('カートの取得に失敗しました');
    }).finally(() => setLoading(false));
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 500;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + shippingFee + tax;

  const placeOrder = async () => {
    if (!shipping || !payment) {
      message.warning('配送先または支払い方法が未設定です');
      navigate('/shipping');
      return;
    }
    if (cartItems.length === 0) {
      message.warning('カートが空です。商品を追加してください');
      navigate('/');
      return;
    }

    setPlacing(true);
    logger.info('[OrderConfirmPage] 注文確定');
    try {
      const body = {
        shipping_address: {
          postal_code: shipping.postal_code,
          prefecture: shipping.prefecture,
          city: shipping.city,
          address_line1: shipping.address_line1,
          address_line2: shipping.address_line2 || '',
          phone: shipping.phone,
        },
        payment_method: payment.method,
        items: cartItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      };
      const res = await axios.post('/api/orders', body);
      logger.info('[OrderConfirmPage] 注文成功', `order_number=${res.data.data.order_number}`);
      
      // カートをクリア
      for (const item of cartItems) {
        await axios.delete(`/api/cart/items/${item.id}`);
      }
      logger.info('[OrderConfirmPage] カートを削除しました');

      localStorage.removeItem('checkout_shipping');
      localStorage.removeItem('checkout_payment');
      
      setOrderNumber(res.data.data.order_number);
      setOrderCompleted(true);
    } catch (err: any) {
      logger.error('[OrderConfirmPage] 注文失敗', err);
      message.error('注文に失敗しました: ' + (err.response?.data?.message || err.message));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  // 注文完了画面
  if (orderCompleted) {
    const isNewAddress = !shipping?.address_id;
    const addressMessage = isNewAddress 
      ? '\nご入力いただいた配達先はプロフィールに自動保存されました。\n今後の注文でご利用いただけます。'
      : '';

    return (
      <div style={{ maxWidth: 640, margin: '40px auto' }}>
        <Result
          status="success"
          title="ご注文ありがとうございます！"
          subTitle={`注文番号: ${orderNumber}\n\nご注文はシステムに登録されました。\nご注文履歴から詳細を確認できます。${addressMessage}`}
          extra={[
            <Button type="primary" key="orders" size="large" onClick={() => navigate('/orders')} style={{ marginRight: 8 }}>
              購入履歴を確認
            </Button>,
            <Button key="home" size="large" onClick={() => navigate('/')}>
              ホームに戻る
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto' }}>
      <Steps current={2} style={{ marginBottom: 32 }} items={[
        { title: '配送先' },
        { title: '支払い方法' },
        { title: '注文確認' },
      ]} />
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Typography.Title level={3}>✅ 注文内容確認</Typography.Title>

        <Card size="small" style={{ marginBottom: 12 }}>
          <Typography.Text strong>📦 配送先</Typography.Text>
          <div style={{ fontSize: 13, color: '#595959', marginTop: 8, lineHeight: 1.8 }}>
            {shipping?.name} 様<br />
            〒{shipping?.postal_code}<br />
            {shipping?.prefecture}{shipping?.city}{shipping?.address_line1}
            {shipping?.address_line2 && <> {shipping.address_line2}</>}<br />
            TEL: {shipping?.phone}
          </div>
        </Card>

        <Card size="small" style={{ marginBottom: 12 }}>
          <Typography.Text strong>💳 支払い方法</Typography.Text>
          <div style={{ fontSize: 13, color: '#595959', marginTop: 8 }}>{payment?.label}</div>
        </Card>

        <Card size="small" style={{ marginBottom: 12 }}>
          <Typography.Text strong>🛒 注文商品</Typography.Text>
          <Table
            dataSource={cartItems.map((item) => ({ ...item, key: item.id, subtotal: item.price * item.quantity }))}
            columns={[
              { title: '商品名', dataIndex: 'name' },
              { title: '単価', dataIndex: 'price', render: (v: number) => `¥${v.toLocaleString()}`, align: 'right' },
              { title: '数量', dataIndex: 'quantity', align: 'center' },
              { title: '小計', dataIndex: 'subtotal', render: (v: number) => `¥${v.toLocaleString()}`, align: 'right' },
            ]}
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        </Card>

        <Divider />
        <div style={{ background: '#f0f2f5', borderRadius: 6, padding: 16 }}>
          {[
            { label: '小計', value: subtotal },
            { label: '配送料', value: shippingFee },
            { label: '消費税（10%）', value: tax },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>{label}</span>
              <span>¥{value.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: '#ff4d4f', borderTop: '1px solid #d9d9d9', paddingTop: 10, marginTop: 4 }}>
            <span>合計</span>
            <span>¥{total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <Button onClick={() => navigate('/payment')} style={{ flex: 1 }} size="large" disabled={placing}>戻る</Button>
          <Button type="primary" onClick={placeOrder} loading={placing} style={{ flex: 2 }} size="large" danger>
            注文を確定する
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
