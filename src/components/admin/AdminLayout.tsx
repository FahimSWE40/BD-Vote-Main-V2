import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useRequireAdmin } from '@/hooks/use-admin-auth';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const { isAdmin, isLoading, signOut, userEmail } = useRequireAdmin();

  if (isLoading) {
    return <PageLoader />;
  }

  // useRequireAdmin handles redirect, but we need to prevent rendering during redirect
  if (!isAdmin) {
    return <PageLoader />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
              <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <SidebarTrigger className="-ml-1 shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  {actions}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {userEmail && (
                      <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline truncate max-w-[150px]">
                        {userEmail}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">লগআউট</span>
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
