import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, Avatar, Select, message, Card, Table, Modal, Divider, Space } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import logger from '../logger';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const PAYMENT_METHODS = [
  { label: 'クレジットカード', value: 'credit_card' },
  { label: 'コンビニ決済', value: 'convenience' },
  { label: '銀行振込', value: 'bank_transfer' },
  { label: '代金引換', value: 'cash_on_delivery' },
];

const ProfileEditPage: React.FC = () => {
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadAddresses();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
      const user = res.data.data;
      setUserData(user);
      form.setFieldsValue({
        username: user.name,
        email: user.email,
        phone: user.phone,
        payment_method: user.preferred_payment_method || 'credit_card',
      });
    } catch (err) {
      logger.error('[ProfileEditPage] ユーザーデータロード失敗', err);
      message.error('プロフィール読み込みに失敗しました');
    }
  };

  const loadAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(res.data.data);
    } catch (err) {
      logger.error('[ProfileEditPage] 配達先読み込み失敗', err);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/users/profile', 
        { name: values.username, phone: values.phone, preferred_payment_method: values.payment_method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data.data;
      localStorage.setItem('user', JSON.stringify({ id: updated.id, email: updated.email, name: updated.name, role: userData.role }));
      message.success('プロフィールを更新しました');
    } catch (err: any) {
      logger.error('[ProfileEditPage] 更新失敗', err);
      message.error('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (values: any) => {
    setAddressLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users/addresses', values, { headers: { Authorization: `Bearer ${token}` } });
      message.success('配達先を追加しました');
      setAddressModalVisible(false);
      addressForm.resetFields();
      loadAddresses();
    } catch (err: any) {
      logger.error('[ProfileEditPage] 配達先追加失敗', err);
      message.error(err.response?.data?.message || '配達先追加に失敗しました');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    Modal.confirm({
      title: '削除確認',
      content: 'この配達先を削除しますか？',
      okText: '削除',
      cancelText: 'キャンセル',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          message.success('配達先を削除しました');
          loadAddresses();
        } catch (err) {
          message.error('削除に失敗しました');
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar size={64}>{userData?.name?.[0] || 'U'}</Avatar>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>{userData?.name || 'ユーザー'}</Typography.Title>
          <Typography.Text type="secondary">{userData?.email}</Typography.Text>
        </div>
      </div>

      {/* プロフィール編集 */}
      <Card title="👤 プロフィール" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="ユーザー名" name="username" rules={[{ required: true, message: 'ユーザー名を入力してください' }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item label="メールアドレス" name="email" rules={[{ required: true, message: 'メールアドレスを入力してください' }]}>
            <Input disabled size="large" />
          </Form.Item>
          <Form.Item label="電話番号" name="phone">
            <Input size="large" placeholder="例：09012345678" />
          </Form.Item>
          <Form.Item label="デフォルト支払い方法" name="payment_method">
            <Select size="large">
              {PAYMENT_METHODS.map((m) => (
                <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ flex: 1 }} size="large">更新</Button>
            <Button onClick={() => form.resetFields()} style={{ flex: 1 }} size="large">キャンセル</Button>
          </div>
        </Form>
      </Card>

      <Divider />

      {/* 配達先管理 */}
      <Card 
        title="📍 配達先管理" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddressModalVisible(true)}>追加</Button>}
      >
        {addresses.length > 0 ? (
          <Table
            dataSource={addresses.map((a) => ({ key: a.id, ...a }))}
            columns={[
              { 
                title: '配達先',
                dataIndex: 'address_line1',
                render: (_, record: any) => (
                  <div>
                    <div>{record.prefecture}{record.city}{record.address_line1}</div>
                    {record.address_line2 && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.address_line2}</div>}
                  </div>
                ),
              },
              { title: '郵便番号', dataIndex: 'postal_code', width: 100 },
              { title: '電話', dataIndex: 'phone', width: 120 },
              {
                title: '操作',
                width: 80,
                render: (_, record: any) => (
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteAddress(record.id)}
                  >
                    削除
                  </Button>
                ),
              },
            ]}
            pagination={false}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '40px 0' }}>配達先がまだ登録されていません</div>
        )}
      </Card>

      {/* 配達先追加モーダル */}
      <Modal
        title="配達先を追加"
        open={addressModalVisible}
        onCancel={() => {
          setAddressModalVisible(false);
          addressForm.resetFields();
        }}
        footer={null}
      >
        <Form form={addressForm} layout="vertical" onFinish={handleAddAddress}>
          <Form.Item label="郵便番号" name="postal_code" rules={[{ required: true, message: '郵便番号を入力してください' }]}>
            <Input placeholder="例：123-4567" />
          </Form.Item>
          <Form.Item label="都道府県" name="prefecture" rules={[{ required: true, message: '都道府県を選択してください' }]}>
            <Select placeholder="選択してください">
              {PREFECTURES.map((p) => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="市区町村" name="city" rules={[{ required: true, message: '市区町村を入力してください' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="住所" name="address_line1" rules={[{ required: true, message: '住所を入力してください' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="建物・部屋番号など" name="address_line2">
            <Input />
          </Form.Item>
          <Form.Item label="電話番号" name="phone">
            <Input placeholder="例：09012345678" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAddressModalVisible(false);
                addressForm.resetFields();
              }}>キャンセル</Button>
              <Button type="primary" htmlType="submit" loading={addressLoading}>追加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileEditPage;
