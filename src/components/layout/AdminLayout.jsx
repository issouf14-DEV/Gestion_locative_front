import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Home, Users, FileText, CreditCard,
  Receipt, Bell, Menu, X, LogOut, User, ChevronRight,
  Building2, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import { useLogout } from '@/lib/api/queries/auth';
import { getInitials } from '@/lib/utils/formatters';
import useNotifStore from '@/lib/store/notifStore';
import { useNotificationsNonLues } from '@/lib/api/queries/notifications';
import logobg from '@/assets/logobg.png';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/maisons', icon: Home, label: 'Maisons' },
  { href: '/admin/locataires', icon: Users, label: 'Locataires' },
  { href: '/admin/factures', icon: FileText, label: 'Factures SODECI' },
  { href: '/admin/loyers', icon: Banknote, label: 'Loyers' },
  { href: '/admin/depenses', icon: Receipt, label: 'Dépenses' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/admin/profil', icon: User, label: 'Mon Profil' },
];

function NavItem({ item, collapsed = false, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const { unreadCount } = useNotifStore();
  const showBadge = item.href === '/admin/notifications' && unreadCount > 0;

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
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {showBadge && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

function Sidebar({ onClose }) {
  const { user } = useAuth();
  const { mutate: doLogout } = useLogout();
  useNotificationsNonLues();

  const handleLogout = () => {
    doLogout();
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-navy-800 border-r border-navy-700">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700 h-20">
        <Link to="/" className="flex items-center">
          <img src={logobg} alt="Gestion Locative" className="h-10 w-auto brightness-0 invert" />
        </Link>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
      </ScrollArea>

      {/* Retour Accueil */}
      <div className="px-3 pb-2">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-navy-300 hover:text-white hover:bg-navy-700 transition-all"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Retour a l'accueil
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-navy-700 p-4">
        <Link to="/admin/profil" onClick={onClose} className="flex items-center gap-3 mb-3 group">
          <Avatar className="h-9 w-9 bg-navy-900 border border-navy-700 group-hover:border-maroon-400 transition-colors">
            <AvatarFallback className="bg-navy-900 text-white text-sm">
              {getInitials(user?.nom, user?.prenoms)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-maroon-300 transition-colors">
              {user?.prenoms} {user?.nom}
            </p>
            <p className="text-xs text-navy-200 truncate">{user?.email}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-navy-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <div className="flex flex-col w-64 fixed inset-y-0">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-navy-800 border-navy-700">
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-navy-800 border-b border-navy-700">
          <Link to="/" className="flex items-center">
            <img src={logobg} alt="Gestion Locative" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}
            className="text-white hover:bg-navy-700 h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
