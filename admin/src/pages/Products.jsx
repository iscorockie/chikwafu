import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Modal } from "../components/UI";

const emptyForm = {
  name: "",
  brand: "",
  category: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  description: "",
  images: "",
  isNewArrival: false,
  isFeatured: false,
  isFlashSale: false,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/products", { params: { search, limit: 100 } })
      .then((r) => setProducts(r.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand,
      category: p.category?._id || p.category,
      price: p.price,
      compareAtPrice: p.compareAtPrice || "",
      stock: p.stock,
      description: p.description,
      images: (p.images || []).join(", "),
      isNewArrival: p.isNewArrival,
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
    });
    setModalOpen(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : 0,
      stock: Number(form.stock),
      images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-ink-400">{products.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-ink-200 rounded-lg px-3 py-2">
            <Search size={15} className="text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="outline-none text-sm" />
          </div>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Tags</th>
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-ink-400">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-ink-400">{p.brand}</p>
                  </td>
                  <td>{p.category?.name}</td>
                  <td>
                    <span className="font-semibold">${p.price.toFixed(2)}</span>
                    {p.compareAtPrice > 0 && <span className="text-xs text-ink-400 line-through ml-1">${p.compareAtPrice.toFixed(2)}</span>}
                  </td>
                  <td>
                    <span className={p.stock === 0 ? "text-red-500 font-semibold" : ""}>{p.stock}</span>
                  </td>
                  <td className="space-x-1">
                    {p.isFeatured && <span className="badge bg-gold-50 text-gold-600">Featured</span>}
                    {p.isNewArrival && <span className="badge bg-teal-50 text-teal-600">New</span>}
                    {p.isFlashSale && <span className="badge bg-red-50 text-red-600">Flash</span>}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-ink-500 hover:text-teal-600">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(p._id)} className="text-ink-500 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
            <input name="name" required value={form.name} onChange={onChange} placeholder="Product Name" className="input md:col-span-2" />
            <input name="brand" value={form.brand} onChange={onChange} placeholder="Brand" className="input" />
            <select name="category" required value={form.category} onChange={onChange} className="input">
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input name="price" type="number" step="0.01" required value={form.price} onChange={onChange} placeholder="Price" className="input" />
            <input name="compareAtPrice" type="number" step="0.01" value={form.compareAtPrice} onChange={onChange} placeholder="Compare-at Price (optional)" className="input" />
            <input name="stock" type="number" required value={form.stock} onChange={onChange} placeholder="Stock" className="input" />
            <input name="images" value={form.images} onChange={onChange} placeholder="Image URLs, comma separated" className="input md:col-span-2" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" rows={3} className="input md:col-span-2" />
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={onChange} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isNewArrival" checked={form.isNewArrival} onChange={onChange} /> New Arrival
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFlashSale" checked={form.isFlashSale} onChange={onChange} /> Flash Sale
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">{editing ? "Save Changes" : "Create Product"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
