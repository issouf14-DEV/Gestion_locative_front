import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useAuth from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNotificationsNonLues } from '@/lib/api/queries/notifications';
import useNotifStore from '@/lib/store/notifStore';
import AuthDialog from '@/components/auth/AuthDialog';
import logobg from '@/assets/logo_transparent.png';

export default function PublicHeader() {
  const { isAuthenticated, role } = useAuth();
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');

  // Fetch notification count only if authenticated
  useNotificationsNonLues({ enabled: isAuthenticated });

  const dashboardLink = role === 'ADMIN' ? '/admin/dashboard' : '/tenant/dashboard';
  const notifLink = role === 'ADMIN' ? '/admin/notifications' : '/tenant/notifications';

  const openLogin = () => { setAuthTab('login'); setAuthOpen(true); };
  const openRegister = () => { setAuthTab('register'); setAuthOpen(true); };

  return (
    <>
      <header className="fixed top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logobg} alt="Gestion Locative" className="h-14 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-maroon-500 transition-colors">
              Accueil
            </Link>

            {isAuthenticated && (
              <Link to={notifLink} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" title="Notifications">
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-maroon-500 text-white text-[10px] font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <Button variant="default" size="sm" className="bg-maroon-500 hover:bg-maroon-600" asChild>
                <Link to={dashboardLink}>
                  <User className="h-4 w-4 mr-2" />
                  Mon espace
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-maroon-500 hover:bg-maroon-50" onClick={openLogin}>
                  Se connecter
                </Button>
                <Button variant="default" size="sm" className="bg-maroon-500 hover:bg-maroon-600 text-white" onClick={openRegister}>
                  S'inscrire
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
              <Link to={notifLink} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-maroon-500 text-white text-[10px] font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-6">
                  <Link to="/" onClick={() => setOpen(false)} className="text-navy-800 font-medium py-2 border-b">
                    Accueil
                  </Link>
                  {isAuthenticated && (
                    <Link to={notifLink} onClick={() => setOpen(false)} className="text-navy-800 font-medium py-2 border-b flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  )}
                  {isAuthenticated ? (
                    <Button variant="maroon" asChild onClick={() => setOpen(false)} className="bg-maroon-500 hover:bg-maroon-600 text-white">
                      <Link to={dashboardLink}>Mon espace</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => { setOpen(false); openLogin(); }}>
                        Se connecter
                      </Button>
                      <Button variant="maroon" onClick={() => { setOpen(false); openRegister(); }} className="bg-maroon-500 hover:bg-maroon-600 text-white">
                        S'inscrire
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Auth Dialog */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </>
  );
}
