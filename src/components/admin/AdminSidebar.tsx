import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Upload,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Shield,
  MapPin,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import bdVoteLogo from "@/assets/bd-vote-logo.png";

const navItems = [
  { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/admin' },
  { icon: Upload, label: 'ভোটার আপলোড', href: '/admin/upload' },
  { icon: Users, label: 'ভোটার তালিকা', href: '/admin/voters' },
  { icon: UserCheck, label: 'প্রার্থী', href: '/admin/candidates' },
  { icon: MapPin, label: 'নির্বাচনী এলাকা', href: '/admin/constituencies' },
  { icon: AlertTriangle, label: 'ঘটনা রিপোর্ট', href: '/admin/incidents' },
  { icon: FileText, label: 'অডিট লগ', href: '/admin/audit-logs' },
  { icon: Settings, label: 'সেটিংস', href: '/admin/settings' },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3 sm:p-4">
        <Link to="/admin" className="flex items-center gap-2 sm:gap-3">
          <img src={bdVoteLogo} alt="BD Vote" className="h-9 w-auto shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg text-foreground truncate block">অ্যাডমিন প্যানেল</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">BD Vote ম্যানেজমেন্ট</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-xs">
            <Shield className="size-3 sm:size-4" />
            <span className={isCollapsed ? 'sr-only' : ''}>অ্যাডমিন মেনু</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="h-10 sm:h-11"
                  >
                    <Link to={item.href}>
                      <item.icon className="size-4 sm:size-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 sm:p-4">
        <Button 
          variant="outline" 
          className={cn(
            "w-full h-9 sm:h-10 text-sm",
            isCollapsed ? "justify-center px-2" : "justify-start gap-2 sm:gap-3"
          )}
          asChild
        >
          <Link to="/">
            <LogOut className="size-4 sm:size-5" />
            {!isCollapsed && <span>মূল সাইটে ফিরুন</span>}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
