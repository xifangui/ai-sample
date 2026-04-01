import React, { useState, useEffect } from 'react';
import { Form, Radio, Button, Typography, Alert, Steps, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logger from '../logger';

const PAYMENT_OPTIONS = [
  { value: 'credit_card',   label: 'クレジットカード',     note: 'Visa, Mastercard, JCB' },
  { value: 'convenience',   label: 'コンビニ決済',         note: 'セブン-イレブン、ファミリーマート等' },
  { value: 'bank_transfer', label: '銀行振込',             note: '振込手数料はお客様負担' },
  { value: 'cash_on_delivery', label: '代金引換',          note: '手数料330円' },
];

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'クレジットカード決済',
  convenience: 'コンビニ決済',
  bank_transfer: '銀行振込',
  cash_on_delivery: '代金引換',
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>('credit_card');

  useEffect(() => {
    loadPreferredPayment();
  }, []);

  const loadPreferredPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      const preferredMethod = res.data.data.preferred_payment_method || 'credit_card';
      setSelected(preferredMethod);
    } catch (err) {
      logger.error('[PaymentPage] 推奨支払方法読込失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = () => {
    localStorage.setItem('checkout_payment', JSON.stringify({
      method: selected,
      label: PAYMENT_LABELS[selected],
    }));
    navigate('/order-confirm');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 540, margin: '40px auto' }}>
      <Steps current={1} style={{ marginBottom: 32 }} items={[
        { title: '配送先' },
        { title: '支払い方法' },
        { title: '注文確認' },
      ]} />
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Typography.Title level={3}>💳 支払い方法</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="payment">
            <Radio.Group value={selected} onChange={(e) => setSelected(e.target.value)} style={{ width: '100%' }}>
              {PAYMENT_OPTIONS.map((opt) => (
                <div key={opt.value} onClick={() => setSelected(opt.value)} style={{
                  border: `2px solid ${selected === opt.value ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: 8, padding: '12px 16px', marginBottom: 10, cursor: 'pointer',
                  background: selected === opt.value ? '#e6f7ff' : '#fff',
                }}>
                  <Radio value={opt.value}>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>{opt.note}</span>
                  </Radio>
                </div>
              ))}
            </Radio.Group>
          </Form.Item>
          <Alert type="info" showIcon style={{ marginBottom: 16 }}
            message="選択された支払い方法によって、配送までの日数が変わる場合があります。" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate('/shipping')} style={{ flex: 1 }} size="large">戻る</Button>
            <Button type="primary" htmlType="submit" style={{ flex: 2 }} size="large">次へ（注文確認）</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default PaymentPage;
