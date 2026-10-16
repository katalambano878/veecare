'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Module Filtering State
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const authTimeout = window.setTimeout(() => {
      if (!cancelled && pathname !== '/admin/login') {
        console.error('[Admin] Auth check timed out');
        setIsLoading(false);
        router.push('/admin/login?error=session_expired');
      }
    }, 15_000);

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (pathname === '/admin/login') {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!session) {
          if (!cancelled) setIsLoading(false);
          router.push('/admin/login');
          return;
        }

        // Ensure auth cookie is set (in case user already had a session from before)
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;

        // Check user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Failed to fetch user profile');
          if (!cancelled) setIsLoading(false);
          router.push('/admin/login');
          return;
        }

        // Only allow admin and staff roles
        if (profile.role !== 'admin' && profile.role !== 'staff') {
          console.warn('User does not have admin/staff role');
          document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
          await supabase.auth.signOut();
          if (!cancelled) setIsLoading(false);
          router.push('/admin/login?error=unauthorized');
          return;
        }

        if (!cancelled) {
          setUser(session.user);
          setUserRole(profile.role);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Admin] Auth check failed:', err);
        if (!cancelled) {
          setIsLoading(false);
          router.push('/admin/login?error=session_expired');
        }
      } finally {
        window.clearTimeout(authTimeout);
      }
    }

    checkAuth();

    // Keep cookie in sync when session refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
      }
      if (event === 'SIGNED_OUT') {
        document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
        document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; Secure';
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Fetch Modules Effect
  useEffect(() => {
    async function fetchModules() {
      try {
        const { data, error } = await supabase.from('store_modules').select('id, enabled');
        if (error) {
          console.warn('Error fetching modules:', error);
          return;
        }
        if (data) {
          setEnabledModules(data.filter((m: any) => m.enabled).map((m: any) => m.id));
        }
      } catch (err) {
        console.warn('Fetch modules failed:', err);
      }
    }
    fetchModules();
  }, []);

  // Screen size check for initial state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Only set to false if it's currently true? 
        // Actually, let's just default to open on desktop, closed on mobile on mount only
      }
    };

    // Set initial state based on width
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    // Optional: Auto-close on resize to mobile? For now, leave as is.
  }, []);

  const handleLogout = async () => {
    // Clear auth cookies set during login
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0; SameSite=Lax; Secure';
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-cocoa">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-auto object-contain opacity-90" />
          <p className="text-sm font-medium">Loading admin…</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'ri-dashboard-line',
      path: '/admin',
      exact: true
    },
    {
      title: 'Orders',
      icon: 'ri-shopping-bag-line',
      path: '/admin/orders',
      badge: ''
    },
    {
      title: 'POS System',
      icon: 'ri-store-3-line',
      path: '/admin/pos'
    },
    {
      title: 'Products',
      icon: 'ri-box-3-line',
      path: '/admin/products'
    },
    {
      title: 'Categories',
      icon: 'ri-folder-line',
      path: '/admin/categories'
    },
    {
      title: 'Customers',
      icon: 'ri-group-line',
      path: '/admin/customers'
    },
    {
      title: 'Reviews',
      icon: 'ri-chat-smile-2-line',
      path: '/admin/reviews'
    },
    {
      title: 'Inventory',
      icon: 'ri-stack-line',
      path: '/admin/inventory'
    },
    {
      title: 'Analytics',
      icon: 'ri-bar-chart-line',
      path: '/admin/analytics'
    },
    {
      title: 'Coupons',
      icon: 'ri-coupon-2-line',
      path: '/admin/coupons'
    },
    {
      title: 'Loyalty',
      icon: 'ri-trophy-line',
      path: '/admin/loyalty'
    },
    {
      title: 'Affiliates',
      icon: 'ri-share-forward-line',
      path: '/admin/affiliates'
    },
    {
      title: 'Customer Insights',
      icon: 'ri-user-search-line',
      path: '/admin/customer-insights',
      moduleId: 'customer-insights'
    },
    {
      title: 'Notifications',
      icon: 'ri-notification-3-line',
      path: '/admin/notifications',
      moduleId: 'notifications'
    },
    {
      title: 'SMS Debugger',
      icon: 'ri-message-2-line',
      path: '/admin/test-sms'
    },
    {
      title: 'Buy SMS',
      icon: 'ri-bank-card-line',
      path: '/admin/sms-credit'
    },
    {
      title: 'Email Debugger',
      icon: 'ri-mail-send-line',
      path: '/admin/test-email'
    },

    {
      title: 'Blog',
      icon: 'ri-article-line',
      path: '/admin/blog',
      moduleId: 'blog'
    },
    {
      title: 'Modules',
      icon: 'ri-puzzle-line',
      path: '/admin/modules'
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    // @ts-ignore
    if (!item.moduleId) return true;
    // @ts-ignore
    return enabledModules.includes(item.moduleId);
  });

  // Special layout for Login Page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden glass-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile: Transform / Desktop: Width transition */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-brand-espresso border-r border-brand-cocoa/20 transition-all duration-300
          w-52
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isSidebarOpen ? 'lg:w-52' : 'lg:w-0 lg:overflow-hidden'}
          lg:translate-x-0
        `}
      >
        <div className="h-full px-3 py-4 overflow-y-auto text-sm">
          <Link href="/admin" className="flex items-center gap-2 mb-5 px-1.5 cursor-pointer group">
            <Logo className="h-8 w-auto max-w-[110px] object-contain brightness-0 invert opacity-95 group-hover:opacity-100 transition-opacity" />
            <span className="text-[9px] font-semibold tracking-[0.18em] text-brand-nude/80 uppercase shrink-0">
              Admin
            </span>
          </Link>

          <nav className="space-y-0.5">
            {visibleMenuItems.map((item) => {
              const isActive = item.exact ? pathname === item.path : pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} // Close on mobile click
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive
                    ? 'bg-brand-champagne/25 text-brand-nude font-semibold'
                    : 'text-brand-nude/75 hover:bg-white/10 hover:text-brand-nude'
                    }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <i className={`${item.icon} text-base w-4 h-4 flex items-center justify-center`}></i>
                    <span className="text-[13px]">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 pt-5 border-t border-white/15">
            <Link
              href="/"
              target="_blank"
              onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 text-brand-nude/75 hover:bg-white/10 hover:text-brand-nude rounded-md transition-colors cursor-pointer"
            >
              <i className="ri-external-link-line text-base w-4 h-4 flex items-center justify-center"></i>
              <span className="text-[13px]">View Store</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ml-0 ${isSidebarOpen ? 'lg:ml-52' : 'lg:ml-0'}`}>
        <header className="bg-white/90 backdrop-blur-sm border-b border-brand-nude sticky top-0 z-30 shadow-sm">
          <div className="px-3 py-2.5 lg:px-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 flex items-center justify-center text-brand-cocoa hover:text-brand-espresso hover:bg-brand-nude/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className={`${isSidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} text-lg`}></i>
            </button>

            <div className="flex items-center space-x-1.5 lg:space-x-3">
              <button className="relative w-8 h-8 flex items-center justify-center text-brand-cocoa hover:text-brand-espresso hover:bg-brand-nude/40 rounded-lg transition-colors cursor-pointer">
                <i className="ri-notification-3-line text-lg"></i>
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-1.5 lg:px-2 py-1.5 hover:bg-brand-nude/30 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center bg-brand-nude text-brand-espresso rounded-full font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-brand-espresso capitalize">{userRole || 'Admin'}</p>
                    <p className="text-[11px] text-brand-cocoa/70 max-w-[100px] truncate">{user?.email}</p>
                  </div>
                  <i className="ri-arrow-down-s-line text-gray-600 text-sm"></i>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors border-t border-gray-200 text-left cursor-pointer text-sm"
                    >
                      <i className="ri-logout-box-line text-red-600 w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-red-600">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 lg:p-4 text-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
