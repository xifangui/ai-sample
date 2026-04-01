import { useState } from 'react';
import { Form, Input, Button, message, Alert } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', values);
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, name: user.name }));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      message.success('ログイン成功');
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        message.error('ログイン失敗: ' + err.response.data.message);
      } else {
        setError('サーバーに接続できません');
        message.error('ログイン失敗: サーバーに接続できません');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center' }}>ログイン</h2>
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
          <Input placeholder="Email" autoComplete="email" disabled={loading} />
        </Form.Item>
        <Form.Item
          name="password"
          label="パスワード"
          rules={[{ required: true, message: 'パスワードを入力してください' }]}
        >
          <Input.Password placeholder="Password" autoComplete="current-password" disabled={loading} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            ログイン
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
