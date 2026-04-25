import { useGetCurrentUser } from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";

export function useCurrentUser() {
  const { data: user, isLoading, error } = useGetCurrentUser();

  const isAdmin = user?.role === UserRole.admin;
  const isManager = user?.role === UserRole.manager;
  const isNormalUser = user?.role === UserRole.user;

  const canEditUsers = isAdmin;
  const canManageProducts = isAdmin || isManager;
  const canDeleteProducts = isAdmin;
  const canViewSales = true;
  const canEditOrders = isAdmin || isManager;

  return {
    user,
    isLoading,
    error,
    isAdmin,
    isManager,
    isNormalUser,
    canEditUsers,
    canManageProducts,
    canDeleteProducts,
    canViewSales,
    canEditOrders,
  };
}
