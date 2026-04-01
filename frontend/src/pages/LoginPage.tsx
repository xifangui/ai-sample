
import { useState } from 'react';
import { Form, Input, Button, message, Alert } from 'antd';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logger from '../logger';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    logger.info('[LoginPage] ログイン試行', values.email);
    try {
      const res = await axios.post('/api/auth/login', values);
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, name: user.name }));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.info('[LoginPage] ログイン成功', `email=${user.email} role=${user.role}`);
      message.success('ログイン成功');
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        const msg = err.response.data.message;
        setError(msg);
        message.error('ログイン失敗: ' + msg);
      } else {
        setError('サーバーに接続できません');
        message.error('ログイン失敗: サーバーに接続できません');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 340, width: '100%', maxWidth: 400 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>ログイン</h2>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            label="メールアドレス"
            rules={[
              { required: true, message: 'Emailを入力してください' },
              { type: 'email', message: '有効なメールアドレスを入力してください' },
            ]}
          >
            <Input placeholder="Email" autoComplete="email" disabled={loading} size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="パスワード"
            rules={[{ required: true, message: 'パスワードを入力してください' }]}
          >
            <Input.Password placeholder="Password" autoComplete="current-password" disabled={loading} size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              ログイン
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/register" style={{ color: '#1890ff' }}>新規登録はこちら</Link>
        </div>
      </div>
    </div>
  );
}
