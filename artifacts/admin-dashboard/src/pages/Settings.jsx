import { useCurrentUser, useSwitchRole } from "../hooks/useAuth.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";

export default function Settings() {
  const { user, role } = useCurrentUser();
  const switchRole = useSwitchRole();

  if (!user)
    return <div className="text-sm text-[var(--color-muted)]">Loading...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Profile" subtitle="Your account details" />
        <CardBody className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-full bg-white"
          />
          <div>
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-[var(--color-muted)]">
              {user.email}
            </div>
            <div className="mt-2">
              <Badge variant={user.role}>{user.role}</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Active role" subtitle="Switch demo role" />
        <CardBody>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            This dashboard supports three roles. Switch to see how the UI
            adapts.
          </p>
          <div className="flex gap-2">
            {["admin", "manager", "user"].map((r) => (
              <button
                key={r}
                onClick={() => switchRole.mutate(r)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition ${
                  role === r
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                    : "border-[var(--color-border)] bg-white hover:bg-[var(--color-bg)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="About this project" />
        <CardBody className="text-sm text-[var(--color-muted)]">
          <p>
            NexusOps is a school project demonstrating a multi-role admin
            dashboard. The entire stack is built in plain JavaScript with React,
            Express, and PostgreSQL.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
