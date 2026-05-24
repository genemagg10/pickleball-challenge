"use client";

import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; isAdmin: boolean };

export function UserAdmin({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();

  async function toggleAdmin(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isAdmin: !u.isAdmin }),
    });
    router.refresh();
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Admin</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-slate-200">
              <td className="p-3">{u.name}</td>
              <td className="p-3 text-slate-600">{u.email}</td>
              <td className="p-3">{u.isAdmin ? "Yes" : "No"}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => toggleAdmin(u)}
                  disabled={u.id === currentUserId}
                  className="btn-secondary"
                  title={u.id === currentUserId ? "Can't change your own admin" : undefined}
                >
                  {u.isAdmin ? "Revoke admin" : "Make admin"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
