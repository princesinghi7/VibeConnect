import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100svh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px 36px', maxWidth: 1180, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
