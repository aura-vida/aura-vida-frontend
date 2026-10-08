import { useEffect, useState } from "react";
import { 
  getAdminUsers, 
  updateAdminUserStatus, 
  type AdminUser 
} from "@/lib/adminApi";
import { 
  Search, 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Wallet,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AuraPagination from "@/components/aura/AuraPagination";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" | "active" | "inactive"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async (p = page, q = searchTerm, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        page: p,
        limit: 10,
        search: q.trim() || undefined,
        status: status || undefined,
      });
      setUsers(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      toast.error(err.message || "Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm, statusFilter);
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchTerm, statusFilter);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const isCurrentlyActive = user.status !== "inactive";
    const nextStatus: "active" | "inactive" = isCurrentlyActive ? "inactive" : "active";

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    );
    setUpdatingId(user.id);

    try {
      await updateAdminUserStatus(user.id, nextStatus);
      if (nextStatus === "active") {
        toast.success(`${user.full_name || "User"}'s account is now Active.`);
      } else {
        toast.warning(
          `${user.full_name || "User"}'s account is Deactivated. They cannot log in.`
        );
      }
    } catch (err: any) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
      toast.error(err.message || "Failed to update user account status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const roleBadge = (role?: string | null) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
          <Shield className="size-3" /> Admin
        </span>
      );
    }
    if (role === "practitioner") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/15 text-accent border border-accent/25">
          <Sparkles className="size-3" /> Practitioner
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-foreground/80 border border-border/50">
        <Users className="size-3" /> Client
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header controls: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[2rem] bg-card border border-border shadow-soft">
        <div>
          <h2 className="font-display text-2xl text-foreground">Registered Users &amp; Clients</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage user accounts, check roles, and control active/inactive login permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name…"
              className="rounded-full h-10 pl-9 pr-4 text-xs w-48 sm:w-60 bg-secondary/50 border-border"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-full h-10 px-4 text-xs bg-secondary border border-border text-foreground cursor-pointer focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated Accounts</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(page, searchTerm, statusFilter)}
            disabled={loading}
            className="rounded-full h-10 px-3.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* User Statistics Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 text-xs text-muted-foreground">
        <div>
          Showing {users.length} of {totalCount} registered {totalCount === 1 ? "user" : "users"}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Active accounts can log in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-zinc-400" />
            <span>Inactive accounts blocked</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[2rem] bg-card border border-border shadow-soft overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-24 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-accent mb-3" />
            <p className="text-sm text-muted-foreground">Loading registered users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-24 text-center">
            <Users className="size-10 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="font-display text-xl text-foreground">No users found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No registered profiles match the search criteria or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6 font-medium">User Profile</th>
                  <th className="py-4 px-6 font-medium">Contact Details</th>
                  <th className="py-4 px-6 font-medium">System Role</th>
                  <th className="py-4 px-6 font-medium">Store Credit</th>
                  <th className="py-4 px-6 font-medium text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {users.map((u) => {
                  const isActive = u.status !== "inactive";
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-secondary/20 transition-colors ${
                        !isActive ? "opacity-75 bg-muted/10" : ""
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-full flex items-center justify-center font-medium text-xs border ${
                            isActive
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              {u.full_name || "Unnamed User"}
                              {!isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-500/15 text-zinc-500 uppercase font-semibold">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground/70 truncate max-w-[140px]">
                              ID: {u.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-xs">
                          {u.email ? (
                            <a
                              href={`mailto:${u.email}`}
                              className="flex items-center gap-1.5 text-foreground hover:text-accent transition-colors"
                            >
                              <Mail className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[180px]">{u.email}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-xs">No email synced</span>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                              <Phone className="size-3 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <div>{roleBadge(u.role)}</div>
                        {u.practitioner_slug && (
                          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                            @{u.practitioner_slug}
                          </div>
                        )}
                      </td>

                      {/* Store Credit */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Wallet className="size-3.5 text-accent shrink-0" />
                          <span>₹{(u.credit_inr || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </td>

                      {/* Active / Inactive Status Switch */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`text-xs font-medium ${
                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={isActive}
                            disabled={isUpdating}
                            onCheckedChange={() => handleToggleStatus(u)}
                            className="data-[state=checked]:bg-emerald-600"
                            aria-label={`Toggle active status for ${u.full_name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 pb-3">
          <AuraPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={10}
            itemName="users"
            disabled={loading}
            onPageChange={(p) => fetchUsers(p, searchTerm, statusFilter)}
          />
        </div>
      </div>
    </div>
  );
}
