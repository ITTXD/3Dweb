import { AppProvider } from './context/AppContext';
import UploadScreen from './components/UploadScreen';
import ViewerScreen from './components/ViewerScreen';
import SettingsDrawer from './components/SettingsDrawer';
import OrderForm from './components/OrderForm';
import AdminScreen from './components/AdminScreen';
import { useApp } from './context/AppContext';

function AppContent() {
  const { screen, showOrderForm } = useApp();
  return (
    <>
      {screen === 'upload' && <UploadScreen />}
      {screen === 'viewer' && <ViewerScreen />}
      <SettingsDrawer />
      {showOrderForm && <OrderForm />}
    </>
  );
}

export default function App() {
  const path = window.location.pathname;
  const isAdminRoute = path === '/admin' || path === '/admin/' || path === '/admin.html';

  if (isAdminRoute) {
    return <AdminScreen />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
