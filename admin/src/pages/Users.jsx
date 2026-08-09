import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/users").then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleRole = async (u) => {
    const role = u.role === "admin" ? "customer" : "admin";
    try {
      await api.put(`/users/${u._id}`, { role });
      toast.success(`${u.name} is now ${role}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? "disabled" : "enabled"}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <div className="card overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-400">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <button onClick={() => toggleRole(u)} className={`badge ${u.role === "admin" ? "bg-gold-100 text-gold-700" : "bg-ink-100 text-ink-600"}`}>
                      {u.role}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => toggleActive(u)} className={`badge ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.isActive ? "active" : "disabled"}
                    </button>
                  </td>
                  <td className="text-ink-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => remove(u._id)} className="text-ink-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
