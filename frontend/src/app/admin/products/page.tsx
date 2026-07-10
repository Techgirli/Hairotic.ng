'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, X, AlertCircle } from 'lucide-react';

interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  attributes: any;
  inventory: { quantity: number } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  category: { name: string; id: string };
  collection: { name: string; id: string } | null;
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // New Product Form Data
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    collectionId: '',
    status: 'DRAFT',
    variantSku: '',
    variantPrice: '',
    variantComparePrice: '',
    variantLength: '18',
    variantStock: '10',
  });

  // Edit Product Form Data
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    collectionId: '',
    status: 'DRAFT',
    price: '',
    compareAtPrice: '',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: RequestInit = { credentials: 'include' };
      const [prodRes, catRes, colRes] = await Promise.all([
        fetch(`${API_URL}/admin/products`, headers),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/collections`),
      ]);

      if (!prodRes.ok) throw new Error('Failed to load products');
      
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const colData = await colRes.json();

      setProducts(prodData);
      setCategories(catData);
      setCollections(colData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = newProductForm;
    if (!f.name || !f.categoryId || !f.variantSku || !f.variantPrice) {
      alert('Please fill in product name, category, variant SKU, and variant price.');
      return;
    }

    try {
      // Setup attributes
      const attributes = { length: f.variantLength };
      
      // Calculate prices in kobo (multiply NGN by 100)
      const priceInKobo = Math.round(parseFloat(f.variantPrice) * 100);
      const comparePriceInKobo = f.variantComparePrice
        ? Math.round(parseFloat(f.variantComparePrice) * 100)
        : null;

      const body = {
        name: f.name,
        description: f.description,
        categoryId: f.categoryId,
        collectionId: f.collectionId || null,
        status: f.status,
        variants: [
          {
            sku: f.variantSku,
            price: priceInKobo,
            compareAtPrice: comparePriceInKobo,
            attributes,
            quantity: parseInt(f.variantStock) || 0,
            lowStockThreshold: 5,
            images: ['/Logo/photo_2023-09-25_16-13-56.jpg'], // default image
          },
        ],
      };

      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to create product');
      }

      setShowAddModal(false);
      setNewProductForm({
        name: '',
        description: '',
        categoryId: '',
        collectionId: '',
        status: 'DRAFT',
        variantSku: '',
        variantPrice: '',
        variantComparePrice: '',
        variantLength: '18',
        variantStock: '10',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    const defaultVariant = product.variants[0];
    setEditProductForm({
      name: product.name,
      description: product.description,
      categoryId: product.category.id,
      collectionId: product.collection?.id || '',
      status: product.status,
      price: defaultVariant ? (defaultVariant.price / 100).toString() : '',
      compareAtPrice: defaultVariant && defaultVariant.compareAtPrice ? (defaultVariant.compareAtPrice / 100).toString() : '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      const f = editProductForm;
      const priceInKobo = f.price ? Math.round(parseFloat(f.price) * 100) : undefined;
      const comparePriceInKobo = f.compareAtPrice ? Math.round(parseFloat(f.compareAtPrice) * 100) : null;

      const body = {
        name: f.name,
        description: f.description,
        categoryId: f.categoryId,
        collectionId: f.collectionId || null,
        status: f.status,
        price: priceInKobo,
        compareAtPrice: comparePriceInKobo,
      };

      const res = await fetch(`${API_URL}/admin/products/${editProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to update product');
      }

      setShowEditModal(false);
      setEditProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteClick = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product? This will also purge variants and inventory.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Products Management</h1>
          <p className="text-[13px] text-[#6B7280]">Browse the storefront catalog and publish new drops.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-5 bg-[#E56717] hover:bg-[#C65A12] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] flex items-center gap-2 text-[14px] font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Failed to load products list: {error}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-white border border-[#222222]/5 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F4] text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5">
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Variants</th>
                <th className="py-4 px-6">Default Price</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/5 text-[13px]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    {loading ? 'Fetching catalogs...' : 'No products found in database.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const defaultVariant = product.variants[0];
                  return (
                    <tr key={product.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-[#222222]">{product.name}</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">/{product.slug}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-[#222222]">
                          {product.category?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-0.5 rounded-[12px] text-[10px] font-extrabold uppercase tracking-wider ${
                          product.status === 'PUBLISHED'
                            ? 'bg-[#22C55E]/10 text-[#22C55E]'
                            : 'bg-[#6B7280]/10 text-[#6B7280]'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-[#6B7280]">
                          {product.variants.length} SKU(s)
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-[#E56717]">
                        {defaultVariant ? `₦${(defaultVariant.price / 100).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-2 border border-[#222222]/5 rounded-[10px] hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] transition-all cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="p-2 border border-[#222222]/5 rounded-[10px] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/5 text-[#6B7280] hover:text-[#EF4444] transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-[24px] border border-[#222222]/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4">
              <h2 className="text-[20px] font-extrabold uppercase tracking-wide">Publish New catalog product</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-[#FAF7F4] rounded-[8px] cursor-pointer">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              
              {/* Core Details */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold uppercase tracking-widest text-[#E56717] border-b border-[#222222]/5 pb-1">1. Product Core Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Bouncing Curly Bundles"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Status</label>
                    <select
                      value={newProductForm.status}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter bundle quality details, grade attributes, etc."
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Category</label>
                    <select
                      required
                      value={newProductForm.categoryId}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Collection (Optional)</label>
                    <select
                      value={newProductForm.collectionId}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, collectionId: e.target.value }))}
                      className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    >
                      <option value="">None</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Variant Details */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold uppercase tracking-widest text-[#E56717] border-b border-[#222222]/5 pb-1">2. Initial SKU Variant</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Variant SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., HR-CURLY-18"
                      value={newProductForm.variantSku}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, variantSku: e.target.value }))}
                      className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Length (Inches)</label>
                    <select
                      value={newProductForm.variantLength}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, variantLength: e.target.value }))}
                      className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    >
                      {['10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30'].map((len) => (
                        <option key={len} value={len}>{len} Inches</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Price (₦ NGN)</label>
                    <input
                      type="number"
                      required
                      placeholder="E.g. 150000"
                      value={newProductForm.variantPrice}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, variantPrice: e.target.value }))}
                      className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Compare Price (₦ NGN)</label>
                    <input
                      type="number"
                      placeholder="E.g. 180000"
                      value={newProductForm.variantComparePrice}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, variantComparePrice: e.target.value }))}
                      className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Stock Level</label>
                    <input
                      type="number"
                      required
                      placeholder="E.g. 10"
                      value={newProductForm.variantStock}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, variantStock: e.target.value }))}
                      className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submits */}
              <div className="pt-4 border-t border-[#222222]/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 px-5 border border-[#222222]/10 hover:bg-[#FAF7F4] text-[13px] font-bold uppercase tracking-wider rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#E56717] hover:bg-[#C65A12] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] shadow-sm cursor-pointer"
                >
                  Publish Product
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-[24px] border border-[#222222]/5 w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4">
              <h2 className="text-[20px] font-extrabold uppercase tracking-wide">Edit Product Catalog</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-[#FAF7F4] rounded-[8px] cursor-pointer">
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Category</label>
                  <select
                    required
                    value={editProductForm.categoryId}
                    onChange={(e) => setEditProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Status</label>
                  <select
                    value={editProductForm.status}
                    onChange={(e) => setEditProductForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Price (₦ NGN)</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Compare Price (₦ NGN)</label>
                  <input
                    type="number"
                    value={editProductForm.compareAtPrice}
                    onChange={(e) => setEditProductForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#222222]/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-11 px-5 border border-[#222222]/10 hover:bg-[#FAF7F4] text-[13px] font-bold uppercase tracking-wider rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 bg-[#E56717] hover:bg-[#C65A12] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
