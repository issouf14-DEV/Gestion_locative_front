import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Bell, User, Menu, LogOut, Clock, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import { useLogout } from '@/lib/api/queries/auth';
import { getInitials } from '@/lib/utils/formatters';
import useNotifStore from '@/lib/store/notifStore';
import { useNotificationsNonLues } from '@/lib/api/queries/notifications';
import logobg from '@/assets/logobg.png';

const navItems = [
  { href: '/tenant/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/tenant/charges', icon: FileText, label: 'Mes charges' },
  { href: '/tenant/prolongation', icon: Clock, label: 'Prolongation' },
  { href: '/tenant/notifications', icon: Bell, label: 'Notifications' },
  { href: '/tenant/profil', icon: User, label: 'Mon profil' },
];

function NavItem({ item, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const { unreadCount } = useNotifStore();
  const showBadge = item.href === '/tenant/notifications' && unreadCount > 0;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-maroon-500 text-white shadow-sm'
          : 'text-navy-100 hover:bg-navy-700 hover:text-white'
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {showBadge && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Link>
  );
}

function Sidebar({ onClose }) {
  const { user } = useAuth();
  const { mutate: doLogout } = useLogout();
  useNotificationsNonLues();

  return (
    <div className="flex flex-col h-full bg-navy-800 border-r border-navy-700">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700 h-20">
        <Link to="/" className="flex items-center">
          <img src={logobg} alt="Gestion Locative" className="h-8 w-auto brightness-0 invert" />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} onClick={onClose} />
        ))}
        <div className="mt-4 pt-4 border-t border-navy-700">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 hover:bg-navy-700 hover:text-white transition-all"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            Retour a l'accueil
          </Link>
        </div>
      </nav>
      <div className="border-t border-navy-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 bg-navy-900 border border-navy-700">
            <AvatarFallback className="bg-navy-900 text-white text-sm">
              {getInitials(user?.nom, user?.prenoms)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.prenoms} {user?.nom}
            </p>
            <p className="text-xs text-navy-200 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-navy-700"
          onClick={() => doLogout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

// Barre de navigation en bas pour mobile
const bottomNavItems = [
  { href: '/tenant/dashboard',    icon: LayoutDashboard, label: 'Accueil' },
  { href: '/tenant/charges',      icon: FileText,         label: 'Charges' },
  { href: '/tenant/prolongation', icon: Clock,            label: 'Renouveler' },
  { href: '/tenant/notifications',icon: Bell,             label: 'Notifs' },
  { href: '/tenant/profil',       icon: User,             label: 'Profil' },
];

function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useNotifStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const showBadge = item.href === '/tenant/notifications' && unreadCount > 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-1 transition-colors relative',
                isActive ? 'text-maroon-600' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-maroon-500 text-white text-[9px] font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-maroon-600' : 'text-gray-400')}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-maroon-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function TenantLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="flex flex-col w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Drawer mobile (accès profil + déconnexion) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-navy-800 border-navy-700">
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-navy-800 border-b border-navy-700">
          <Link to="/" className="flex items-center">
            <img src={logobg} alt="Gestion Locative" className="h-7 w-auto brightness-0 invert" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}
            className="text-white hover:bg-navy-700 h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Contenu principal — padding-bottom pour la bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Barre de navigation mobile en bas */}
      <BottomNav />
    </div>
  );
}
