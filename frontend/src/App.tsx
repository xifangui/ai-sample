import { Layout, Menu, Typography, Button, Space } from 'antd';
import { Route, Routes, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductListPage from './pages/ProductListPage';
import CartPage from './pages/CartPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ProfileEditPage from './pages/ProfileEditPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ShippingPage from './pages/ShippingPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmPage from './pages/OrderConfirmPage';

const { Header, Content, Footer } = Layout;

function App() {
  const [role, setRole] = useState<'user' | 'admin' | null | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole === 'user' || storedRole === 'admin') {
      setRole(storedRole as 'user' | 'admin');
    } else {
      setRole(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setRole(null);
    navigate('/login');
  };

  if (role === undefined) {
    return <Layout style={{ minHeight: '100vh' }} />;
  }

  const selectedMenuKey =
    location.pathname.startsWith('/cart') ? 'cart' :
    location.pathname.startsWith('/orders') ? 'orders' :
    location.pathname.startsWith('/profile') ? 'profile' :
    location.pathname.startsWith('/statistics') ? 'statistics' :
    'products';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingInline: 24 }}>
        <div style={{ color: '#fff', marginRight: 24 }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>商品購入履歴照会</Typography.Title>
        </div>
        <Menu theme="dark" mode="horizontal" selectedKeys={[selectedMenuKey]} style={{ flex: 1 }}>
          {role === 'user' && (
            <>
              <Menu.Item key="products"><Link to="/">商品一覧</Link></Menu.Item>
              <Menu.Item key="cart"><Link to="/cart">カート</Link></Menu.Item>
              <Menu.Item key="orders"><Link to="/orders">購入履歴</Link></Menu.Item>
              <Menu.Item key="profile"><Link to="/profile">プロフィール</Link></Menu.Item>
            </>
          )}
          {role === 'admin' && (
            <>
              <Menu.Item key="products"><Link to="/">商品一覧</Link></Menu.Item>
              <Menu.Item key="orders"><Link to="/orders">購入履歴</Link></Menu.Item>
              <Menu.Item key="statistics"><Link to="/statistics">統計情報</Link></Menu.Item>
            </>
          )}
        </Menu>
        <Space style={{ color: '#fff' }}>
          {role && (
            <Button type="primary" onClick={handleLogout}>ログアウト</Button>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#fff' }}>
        <Routes>
          <Route path="/" element={role ? <ProductListPage /> : <Navigate to="/login" replace />} />
          <Route path="/cart" element={role ? <CartPage /> : <Navigate to="/login" replace />} />
          <Route path="/orders" element={role ? <OrderHistoryPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={role ? <ProfileEditPage /> : <Navigate to="/login" replace />} />
          <Route path="/statistics" element={role === 'admin' ? <StatisticsPage /> : <Navigate to="/login" replace />} />
          <Route path="/shipping" element={role ? <ShippingPage /> : <Navigate to="/login" replace />} />
          <Route path="/payment" element={role ? <PaymentPage /> : <Navigate to="/login" replace />} />
          <Route path="/order-confirm" element={role ? <OrderConfirmPage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={role ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={role ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/admin" element={role === 'admin' ? <AdminDashboardPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>AI Sample ようこそ</Footer>
    </Layout>
  );
}

export default App;
