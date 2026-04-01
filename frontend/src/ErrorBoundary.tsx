import React from 'react';
import { Alert, Button } from 'antd';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    import('./logger').then(({ default: logger }) => {
      logger.error('[ErrorBoundary] 画面エラー: ' + error.message, error.stack + '\nComponent Stack:' + info.componentStack);
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <Alert
            type="error"
            showIcon
            message="画面でエラーが発生しました"
            description={
              <>
                <p>{this.state.error.message}</p>
                <details style={{ marginTop: 8, cursor: 'pointer' }}>
                  <summary>詳細(スタックトレース)</summary>
                  <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', marginTop: 8 }}>
                    {this.state.error.stack}
                  </pre>
                </details>
                <Button
                  style={{ marginTop: 12 }}
                  onClick={() => this.setState({ error: null })}
                >
                  再試行
                </Button>
              </>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
