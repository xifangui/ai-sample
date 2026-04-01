import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Select, Steps, Tabs, message, Spin, Card, Radio } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logger from '../logger';

const { Option } = Select;

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

const ShippingPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedAddressId(res.data.data[0].id);
        setActiveTab('saved');
      } else {
        setActiveTab('new');
      }
    } catch (err) {
      logger.error('[ShippingPage] 配達先読込失敗', err);
      setActiveTab('new');
    } finally {
      setLoading(false);
    }
  }

  const onFinish = (values: any) => {
    localStorage.setItem('checkout_shipping', JSON.stringify({
      postal_code: values.postal,
      prefecture: values.prefecture,
      city: values.city,
      address_line1: values.address,
      address_line2: values.address2 || '',
      phone: values.phone,
    }));
    navigate('/payment');
  };

  const handleSavedAddressSelect = () => {
    if (!selectedAddressId) {
      message.error('配達先を選択してください');
      return;
    }
    const selected = addresses.find(a => a.id === selectedAddressId);
    localStorage.setItem('checkout_shipping', JSON.stringify({
      address_id: selected.id,
      postal_code: selected.postal_code,
      prefecture: selected.prefecture,
      city: selected.city,
      address_line1: selected.address_line1,
      address_line2: selected.address_line2 || '',
      phone: selected.phone,
    }));
    navigate('/payment');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 540, margin: '40px auto' }}>
      <Steps current={0} style={{ marginBottom: 32 }} items={[
        { title: '配送先' },
        { title: '支払い方法' },
        { title: '注文確認' },
      ]} />
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Typography.Title level={3}>📦 配送先情報</Typography.Title>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'saved',
            label: '✅ 保存済みから選択',
            children: (
              <div>
                {addresses.length > 0 ? (
                  <div>
                    <Radio.Group value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} style={{ width: '100%' }}>
                      {addresses.map((addr) => (
                        <div key={addr.id} style={{ marginBottom: 12 }}>
                          <Radio value={addr.id}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{addr.prefecture}{addr.city}{addr.address_line1}</div>
                              <div style={{ fontSize: 12, color: '#8c8c8c' }}>〒{addr.postal_code} 📞 {addr.phone}</div>
                            </div>
                          </Radio>
                        </div>
                      ))}
                    </Radio.Group>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <Button onClick={() => navigate('/cart')} style={{ flex: 1 }} size="large">戻る</Button>
                      <Button type="primary" onClick={handleSavedAddressSelect} style={{ flex: 2 }} size="large">次へ（支払い方法）</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '40px 0' }}>
                    <Card><div>保存済み配達先がありません。新規入力タブから入力してください。</div></Card>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'new',
            label: '➕ 新規入力',
            children: (
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item label="郵便番号" name="postal" rules={[
                  { required: true, message: '郵便番号を入力してください' },
                  { pattern: /^\d{3}-?\d{4}$/, message: '正しい形式で入力してください（例: 123-4567）' },
                ]}>
                  <Input placeholder="123-4567" size="large" maxLength={8} />
                </Form.Item>
                <Form.Item label="都道府県" name="prefecture" rules={[{ required: true, message: '都道府県を選択してください' }]}>
                  <Select placeholder="選択してください" size="large" showSearch>
                    {PREFECTURES.map((p) => <Option key={p} value={p}>{p}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item label="市区町村" name="city" rules={[{ required: true, message: '市区町村を入力してください' }]}>
                  <Input placeholder="渋谷区" size="large" />
                </Form.Item>
                <Form.Item label="番地・建物名" name="address" rules={[{ required: true, message: '番地を入力してください' }]}>
                  <Input placeholder="道玄坂1-2-3 ○○ビル4F" size="large" />
                </Form.Item>
                <Form.Item label="建物名・部屋番号（任意）" name="address2">
                  <Input placeholder="（任意）" size="large" />
                </Form.Item>
                <Form.Item label="電話番号" name="phone" rules={[
                  { required: true, message: '電話番号を入力してください' },
                  { pattern: /^[\d\-+() ]{7,15}$/, message: '正しい電話番号を入力してください' },
                ]}>
                  <Input placeholder="090-1234-5678" size="large" />
                </Form.Item>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button onClick={() => navigate('/cart')} style={{ flex: 1 }} size="large">戻る</Button>
                  <Button type="primary" htmlType="submit" style={{ flex: 2 }} size="large">次へ（支払い方法）</Button>
                </div>
              </Form>
            ),
          },
        ]} />
      </div>
    </div>
  );
};

export default ShippingPage;
