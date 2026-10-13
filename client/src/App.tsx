import { BrowserRouter, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingNavbar } from './features/landing/components/LandingNavbar';
import { PendingInvitationsBanner } from './components/PendingInvitationsBanner';
import { InvitePopupModal } from './components/InvitePopupModal';
import { AppRoutes } from './routes/AppRoutes';

function Shell() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

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