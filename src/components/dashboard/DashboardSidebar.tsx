import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Vote, 
  BarChart3, 
  Shield, 
  HelpCircle, 
  LogOut,
  FileText,
  Info
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

const mainNavItems = [
  { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/dashboard' },
  { icon: Vote, label: 'ব্যালট', href: '/ballot' },
  { icon: BarChart3, label: 'ফলাফল', href: '/results' },
  { icon: Shield, label: 'নিরাপত্তা', href: '/security' },
];

const resourceItems = [
  { icon: HelpCircle, label: 'সাহায্য কেন্দ্র', href: '/help' },
  { icon: Info, label: 'আমাদের সম্পর্কে', href: '/about' },
  { icon: FileText, label: 'গোপনীয়তা নীতি', href: '/privacy' },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={bdVoteLogo} alt="BD Vote" className="h-9 w-auto shrink-0" />
          {!isCollapsed && (
            <div>
              <span className="font-bold text-lg text-foreground">BD Vote</span>
              <p className="text-xs text-muted-foreground">ব্লকচেইন ই-ভোটিং</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>প্রধান মেনু</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>রিসোর্স</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button variant="outline" className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}>
          <LogOut className="size-5" />
          {!isCollapsed && <span>লগ আউট</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
