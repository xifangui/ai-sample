import React from 'react';
import { Card, Typography, Button, Tag } from 'antd';

const ProductDetailPage: React.FC = () => (
  <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 8 }}>
    <Card>
      <div style={{ height: 180, background: 'linear-gradient(135deg, #e0e7ff 0%, #cfd9ff 100%)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', marginBottom: 16 }}>商品画像</div>
      <Typography.Title level={4}>高品質ワイヤレスイヤホン</Typography.Title>
      <div style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 700, marginBottom: 15 }}>¥12,800</div>
      <div style={{ marginBottom: 8 }}>
        <Tag color="blue">電子機器</Tag>
        <Tag color="green">在庫あり</Tag>
        <Tag>2-3営業日配送</Tag>
      </div>
      <Typography.Paragraph style={{ background: '#f0f2f5', borderRadius: 4, padding: 12, fontSize: 13, color: '#595959' }}>
        高音質と快適な装着感を実現したワイヤレスイヤホン。最大24時間の連続再生が可能で、IPX7の防水性能を備えています。
      </Typography.Paragraph>
      <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
        <Button type="primary" block>🛒 カートに追加</Button>
        <Button>❤️</Button>
      </div>
    </Card>
  </div>
);

export default ProductDetailPage;
