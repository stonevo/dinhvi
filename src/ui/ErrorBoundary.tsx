import { Component, type ReactNode } from 'react';
import { t } from '../i18n';

/** Bắt lỗi khi hiển thị một trang, để hiện thông báo thay vì trang trắng. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Chuyển sang trang khác thì thử hiển thị lại.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="warning stack">
        <p>{t('error.page')}</p>
        <p className="small muted">{this.state.error.message}</p>
        <div className="row">
          <button type="button" onClick={() => window.location.reload()}>
            {t('error.reload')}
          </button>
        </div>
      </div>
    );
  }
}
