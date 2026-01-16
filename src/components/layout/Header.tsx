import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { TECH_SESSION_KEY, MANAGER_AUTH_KEY } from '../../lib/constants';
import { removeStorageItem } from '../../lib/utils';

interface HeaderProps {
  variant: 'tech' | 'manager';
  title?: string;
  subtitle?: string;
}

export default function Header({ variant, title, subtitle }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (variant === 'tech') {
      removeStorageItem(TECH_SESSION_KEY);
      navigate('/tech');
    } else {
      removeStorageItem(MANAGER_AUTH_KEY);
      navigate('/manager');
    }
  };

  const techLinks = [
    { to: '/tech/request', label: 'New Request' },
    { to: '/tech/history', label: 'My Requests' },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard' },
    { to: '/manager/techs', label: 'Manage Techs' },
  ];

  const links = variant === 'tech' ? techLinks : managerLinks;

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gc-red rounded flex items-center justify-center font-bold text-sm">
                GC
              </div>
              <span className="font-heading text-xl hidden sm:block">
                REFURB TRACKER
              </span>
            </Link>
            {title && (
              <div className="hidden md:block border-l border-gray-700 pl-4">
                <p className="text-sm text-gray-400">{subtitle}</p>
                <p className="font-semibold">{title}</p>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'bg-gc-red text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'bg-gc-red text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
