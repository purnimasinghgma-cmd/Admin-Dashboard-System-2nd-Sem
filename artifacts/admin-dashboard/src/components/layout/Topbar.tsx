import { useLocation } from "wouter";
import { Bell, Search, Menu } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSwitchRole, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Topbar() {
  const [location] = useLocation();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const switchRole = useSwitchRole();

  const handleRoleSwitch = (role: string) => {
    switchRole.mutate(
      { data: { role: role as UserRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({
            title: "Role switched",
            description: `Now viewing as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          });
        },
      }
    );
  };

  const pageTitle = () => {
    switch (location) {
      case "/": return "Dashboard";
      case "/sales": return "Sales & Orders";
      case "/users": return "User Management";
      case "/products": return "Products Catalog";
      case "/analytics": return "Analytics";
      case "/settings": return "Settings";
      default: return "";
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 shadow-sm">
      <SidebarTrigger className="shrink-0 md:hidden" />
      <div className="flex items-center gap-2 flex-1">
        <h1 className="font-semibold text-lg tracking-tight hidden md:block">{pageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>

        <Select value={user?.role} onValueChange={handleRoleSwitch}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
