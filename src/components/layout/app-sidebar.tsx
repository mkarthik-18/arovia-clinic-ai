import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AroviaLogo } from "@/components/brand/logo";
import { bottomNav, mainNav, type NavItem } from "@/lib/nav";

function NavList({ items }: { items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className="h-9 text-[13px] font-medium text-sidebar-foreground transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
            >
              <Link to={item.to} onClick={() => setOpenMobile(false)}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <Link to="/" aria-label="Arovia Clinic AI home">
          <AroviaLogo collapsed={collapsed} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-wide uppercase">Clinic</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavList items={mainNav} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <NavList items={bottomNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <span className="grid size-8 place-items-center rounded-full bg-teal-soft text-xs font-semibold text-teal-soft-foreground">
              AC
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium text-foreground">Arovia Clinic</div>
              <div className="truncate text-[11px] text-muted-foreground">Open · Demo workspace</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
