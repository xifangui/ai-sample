import { useEffect, useState } from 'react';
import { Table, Button, InputNumber, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logger from '../logger';

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    logger.info('[CartPage] カート取得');
    try {
      const res = await axios.get('/api/cart');
      setItems(res.data.data);
      logger.info('[CartPage] カート取得成功', `${res.data.data.length}件`);
    } catch (err: any) {
      logger.error('[CartPage] カート取得失敗', err);
    }
  }

  async function updateQuantity(itemId: number, value: number) {
    logger.info('[CartPage] 数量変更', `itemId=${itemId} quantity=${value}`);
    try {
      await axios.put(`/api/cart/items/${itemId}`, { quantity: value });
      fetchCart();
    } catch (err: any) {
      logger.error('[CartPage] 数量変更失敗', err);
    }
  }

  async function removeItem(itemId: number) {
    logger.info('[CartPage] 商品削除', `itemId=${itemId}`);
    try {
      await axios.delete(`/api/cart/items/${itemId}`);
      fetchCart();
    } catch (err: any) {
      logger.error('[CartPage] 商品削除失敗', err);
    }
  }

  async function placeOrder() {
    if (!items.length) {
      logger.warn('[CartPage] 注文試行: カートが空');
      return message.warning('カートが空です');
    }
    logger.info('[CartPage] 配送先入力へ遷移');
    navigate('/shipping');
  }

  const dataSource = items.map((item) => ({
    key: item.id,
    image_url: item.image_url,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity,
    action: item.id,
  }));

  const columns = [
    {
      title: '商品画像',
      dataIndex: 'image_url',
      width: 80,
      render: (url: string) =>
        url ? (
          <img src={url} alt="product" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 20 }}>🛍️</div>
        ),
    },
    { title: '商品名', dataIndex: 'name' },
    { title: '単価', dataIndex: 'price', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '数量',
      dataIndex: 'quantity',
      render: (value: number, record: any) => (
        <InputNumber min={1} value={value} onChange={(v) => updateQuantity(record.action, v as number)} />
      ),
    },
    { title: '小計', dataIndex: 'total', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '操作',
      dataIndex: 'action',
      render: (id: number) => <Button danger onClick={() => removeItem(id)}>削除</Button>,
    },
  ];

  return (
    <div>
      <Table dataSource={dataSource} columns={columns} pagination={false} />
      <Button type="primary" onClick={placeOrder} style={{ marginTop: 16 }}>注文確定</Button>
    </div>
  );
}
