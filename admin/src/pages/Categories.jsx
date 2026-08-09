import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Modal } from "../components/UI";

const ICONS = ["backpack", "headphones", "watch", "wallet", "gamepad", "glasses", "luggage", "speaker"];
const emptyForm = { name: "", icon: "backpack", itemCount: 0, featured: true, description: "" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => api.get("/categories").then((r) => setCategories(r.data));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon, itemCount: c.itemCount, featured: c.featured, description: c.description || "" });
    setModalOpen(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, itemCount: Number(form.itemCount) };
      if (editing) {
        await api.put(`/categories/${editing._id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/categories", payload);
        toast.success("Category created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {categories.map((c) => (
          <div key={c._id} className="card p-5">
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-ink-400 mb-4">{c.itemCount}+ items</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="btn-secondary flex-1 py-1.5">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => remove(c._id)} className="btn-danger py-1.5 px-3">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <input name="name" required value={form.name} onChange={onChange} placeholder="Category Name" className="input" />
            <select name="icon" value={form.icon} onChange={onChange} className="input">
              {ICONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <input name="itemCount" type="number" value={form.itemCount} onChange={onChange} placeholder="Item Count" className="input" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" rows={2} className="input" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" checked={form.featured} onChange={onChange} /> Show on homepage
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">{editing ? "Save Changes" : "Create Category"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
