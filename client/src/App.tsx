import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { useGetMeQuery } from './api/authApi';
import { updateUser, logout } from './features/auth/authSlice';
import { connectSocket, disconnectSocket } from './sockets/socket';
import { Navbar } from './components/Navbar';
import { LandingNavbar } from './features/landing/components/LandingNavbar';
import { PendingInvitationsBanner } from './components/PendingInvitationsBanner';
import { InvitePopupModal } from './components/InvitePopupModal';
import { AppRoutes } from './routes/AppRoutes';

function Shell() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);

  const { data: meData, error: meError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (meData?.data && (!user || user._id !== meData.data._id)) {
      dispatch(updateUser(meData.data));
    }
  }, [meData, user, dispatch]);

  useEffect(() => {
    if (meError && (meError as any).status === 401) {
      dispatch(logout());
    }
  }, [meError, dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col font-sans">
      {isLanding ? <LandingNavbar /> : <Navbar />}
      {!isLanding && <PendingInvitationsBanner />}
      <InvitePopupModal />
      <main className="flex-1">
        <AppRoutes />
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;