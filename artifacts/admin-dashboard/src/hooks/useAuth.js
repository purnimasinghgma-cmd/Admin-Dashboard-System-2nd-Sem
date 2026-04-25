import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
  });
  return {
    user: data,
    role: data?.role,
    isLoading,
    isAdmin: data?.role === "admin",
    isManager: data?.role === "manager",
    isUser: data?.role === "user",
    canManageUsers: data?.role === "admin",
    canEditProducts: data?.role === "admin" || data?.role === "manager",
    canEditOrders: data?.role === "admin" || data?.role === "manager",
  };
}

export function useSwitchRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role) => api.switchRole(role),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
