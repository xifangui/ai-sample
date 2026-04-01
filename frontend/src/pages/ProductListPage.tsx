import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Input, Select, message } from 'antd';
import axios from 'axios';
import logger from '../logger';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id?: number;
  category_name: string;
  image_url?: string;
  stock: number;
};

type Category = {
  id: number;
  name: string;
};

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchCategories() {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data.data);
    } catch (err: any) {
      logger.error('[ProductListPage] カテゴリ取得失敗', err);
    }
  }

  async function fetchProducts() {
    const params = new URLSearchParams();
    if (search) params.append('keyword', search);
    if (selectedCategory) params.append('category', String(selectedCategory));
    const q = params.toString() ? `?${params.toString()}` : '';
    logger.info('[ProductListPage] 商品取得', q || 'all');
    try {
      const res = await axios.get(`/api/products${q}`);
      const list = res.data.data.products || res.data.data;
      setProducts(list);
      logger.info('[ProductListPage] 商品取得成功', `${list.length}件`);
    } catch (err: any) {
      logger.error('[ProductListPage] 商品取得失敗', err);
      message.error('商品の取得に失敗しました: ' + (err.response?.data?.message || err.message));
    }
  }

  const handleSearch = () => fetchProducts();
  const handleCategoryChange = (catId: number | null) => {
    setSelectedCategory(catId);
  };

  async function addToCart(productId: number) {
    logger.info('[ProductListPage] カートに追加', `productId=${productId}`);
    try {
      await axios.post('/api/cart/items', { product_id: productId, quantity: 1 });
      logger.info('[ProductListPage] カート追加成功', `productId=${productId}`);
      message.success('カートに追加しました');
    } catch (err: any) {
      logger.error('[ProductListPage] カート追加失敗', err);
      message.error('カート追加に失敗しました');
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  return (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>🏷️ カテゴリ</div>
            <Button
              block
              type={selectedCategory === null ? 'primary' : 'default'}
              onClick={() => handleCategoryChange(null)}
              style={{ marginBottom: 8 }}
              size="small"
            >
              すべて ({products.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                block
                type={selectedCategory === cat.id ? 'primary' : 'default'}
                onClick={() => handleCategoryChange(cat.id)}
                style={{ marginBottom: 8 }}
                size="small"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </Col>
        <Col xs={24} sm={18}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Input.Search
                placeholder="キーワードで検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={handleSearch}
                enterButton
                size="large"
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            {products.map((p) => (
              <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    p.image_url
                      ? <img alt={p.name} src={p.image_url} style={{ height: 180, objectFit: 'cover' }} />
                      : <div style={{ height: 180, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 40 }}>🛍️</div>
                  }
                  actions={[
                    <Button type="primary" onClick={() => addToCart(p.id)} disabled={p.stock <= 0} style={{ margin: '0 8px' }}>カートに追加</Button>
                  ]}
                >
                  <Card.Meta
                    title={<span style={{ fontSize: 14 }}>{p.name}</span>}
                    description={
                      <>
                        <div style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>¥{Number(p.price).toLocaleString()}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>{p.category_name}</div>
                        <div style={{ fontSize: 12, color: '#595959', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: p.stock > 0 ? '#52c41a' : '#ff4d4f' }}>在庫: {p.stock > 0 ? `${p.stock}点` : '売り切れ'}</div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
