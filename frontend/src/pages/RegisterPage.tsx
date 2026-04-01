import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logger from '../logger';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    logger.info('[RegisterPage] ユーザー登録試行', values.email);
    try {
      await axios.post('/api/auth/register', values);
      logger.info('[RegisterPage] ユーザー登録成功', values.email);
      message.success('登録成功。ログインしてください。');
      navigate('/login');
    } catch (err: any) {
      logger.error('[RegisterPage] ユーザー登録失敗', err);
      message.error('登録失敗: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form name="register" onFinish={onFinish} style={{ maxWidth: 400 }}>
      <Form.Item name="email" rules={[{ required: true, message: 'Emailを入力してください' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: 'パスワードを入力してください' }]}>
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Form.Item name="name" rules={[{ required: true, message: '名前を入力してください' }]}>
        <Input placeholder="名前" />
      </Form.Item>
      <Form.Item name="phone">
        <Input placeholder="電話番号" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>登録</Button>
      </Form.Item>
    </Form>
  );
}
