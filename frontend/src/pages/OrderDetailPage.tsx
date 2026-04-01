import React from 'react';
import { Card, Typography, Button, Divider } from 'antd';

const OrderDetailPage: React.FC = () => (
  <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', padding: 32, borderRadius: 8 }}>
    <Typography.Title level={3}>注文詳細</Typography.Title>
    <Card style={{ marginBottom: 12 }}>
      <Typography.Text strong>📅 注文情報</Typography.Text>
      <div style={{ fontSize: 12, color: '#595959', marginTop: 8 }}>
        注文日時: 2024年1月15日 14:30<br />配送完了日: 2024年1月17日 10:15<br />配送業者: ヤマト運輸<br />追跡番号: 1234-5678-9012
      </div>
    </Card>
    <Card style={{ marginBottom: 12 }}>
      <Typography.Text strong>📦 配送先</Typography.Text>
      <div style={{ fontSize: 12, color: '#595959', marginTop: 8 }}>
        〒123-4567<br />東京都渋谷区道玄坂1-2-3<br />山田太郎 様<br />TEL: 090-1234-5678
      </div>
    </Card>
    <Card style={{ marginBottom: 12 }}>
      <Typography.Text strong>🛒 注文商品</Typography.Text>
      <div style={{ fontSize: 12, color: '#595959', marginTop: 8 }}>
        商品名サンプル A × 1 - ¥12,800<br />商品名サンプル B × 2 - ¥17,000<br />商品名サンプル C × 1 - ¥15,200
      </div>
    </Card>
    <Divider />
    <div style={{ background: '#f0f2f5', borderRadius: 6, padding: 15, marginTop: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span>小計</span>
        <span>¥44,500</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span>配送料</span>
        <span>¥500</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span>消費税</span>
        <span>¥4,500</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#ff4d4f', borderTop: '1px solid #d9d9d9', paddingTop: 8 }}>
        <span>合計</span>
        <span>¥49,500</span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
      <Button block>領収書発行</Button>
      <Button block>再注文</Button>
    </div>
  </div>
);

export default OrderDetailPage;
