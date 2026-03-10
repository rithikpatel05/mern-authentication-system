import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from './redux/authSlice';

export default function DebugRedux() {
  const auth = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  return (
    <div style={{ position: 'fixed', right: 10, bottom: 10, width: 300, background: 'white', border: '1px solid #ddd', padding: 12, borderRadius: 6, zIndex: 9999 }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Redux Debug</h4>
      <pre style={{ maxHeight: 120, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>{JSON.stringify(auth, null, 2)}</pre>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => dispatch(loginSuccess({ token: 'debug-token', user: { email: 'debug@local', username: 'debug', plan: 'GOLD' } }))}
          style={{ flex: 1, padding: 8 }}
        >
          Dispatch Login
        </button>

        <button
          onClick={() => dispatch(logout())}
          style={{ flex: 1, padding: 8, background: '#eee' }}
        >
          Dispatch Logout
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Store available as <code>window.__APP_STORE__</code></p>
    </div>
  );
}
