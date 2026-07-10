'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  categories: { name: string; slug: string }[];
}

export default function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State local for prices
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Track checked parameters
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('categorySlug') || '');
  const [activeSort, setActiveSort] = useState(searchParams.get('sort') || 'newest');

  // Load state on mount/params change
  useEffect(() => {
    setSelectedLengths(searchParams.getAll('lengths'));
    setSelectedTextures(searchParams.getAll('textures'));
    setActiveCategory(searchParams.get('categorySlug') || '');
    setActiveSort(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  const updateFilters = (newLengths = selectedLengths, newTextures = selectedTextures, cat = activeCategory, sort = activeSort) => {
    const params = new URLSearchParams();

    if (cat) params.set('categorySlug', cat);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    newLengths.forEach((len) => params.append('lengths', len));
    newTextures.forEach((tex) => params.append('textures', tex));

    router.push(`/shop?${params.toString()}`);
  };

  const handleLengthChange = (len: string) => {
    const nextLengths = selectedLengths.includes(len)
      ? selectedLengths.filter((item) => item !== len)
      : [...selectedLengths, len];
    setSelectedLengths(nextLengths);
    updateFilters(nextLengths, selectedTextures);
  };

  const handleTextureChange = (tex: string) => {
    const nextTextures = selectedTextures.includes(tex)
      ? selectedTextures.filter((item) => item !== tex)
      : [...selectedTextures, tex];
    setSelectedTextures(nextTextures);
    updateFilters(selectedLengths, nextTextures);
  };

  const handleCategoryChange = (slug: string) => {
    const nextCat = activeCategory === slug ? '' : slug;
    setActiveCategory(nextCat);
    updateFilters(selectedLengths, selectedTextures, nextCat);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const handleClearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    router.push('/shop');
  };

  const lengths = ['10', '12', '14', '16', '18', '20', '22', '24', '26'];
  const textures = [
    { label: 'Straight', value: 'straight' },
    { label: 'Curly', value: 'curly' },
    { label: 'Coily', value: 'coily' },
  ];

  return (
    <aside className="w-full lg:w-[260px] shrink-0 space-y-8 bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm select-none">
      <div className="flex items-center justify-between border-b border-[#222222]/5 pb-4">
        <div className="flex items-center gap-2 font-bold text-[#222222] text-[16px] uppercase tracking-wide">
          <SlidersHorizontal className="w-4 h-4 text-[#E56717]" />
          <span>Filters</span>
        </div>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#E56717] font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category selector */}
      <div className="space-y-3">
        <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Category</h5>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left h-10 px-4 rounded-[12px] text-[14px] font-semibold transition-all duration-200 ${
                activeCategory === cat.slug
                  ? 'bg-[#E56717] text-[#FFFFFF]'
                  : 'bg-[#FAF7F4] text-[#222222] hover:bg-[#222222]/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Length selector */}
      <div className="space-y-3">
        <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Length (Inches)</h5>
        <div className="grid grid-cols-3 gap-2">
          {lengths.map((len) => (
            <button
              key={len}
              onClick={() => handleLengthChange(len)}
              className={`h-10 border rounded-[12px] text-[14px] font-semibold transition-all duration-200 ${
                selectedLengths.includes(len)
                  ? 'border-[#E56717] bg-[#E56717]/5 text-[#E56717]'
                  : 'border-[#222222]/10 text-[#222222] hover:border-[#222222]/30'
              }`}
            >
              {len}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Texture selector */}
      <div className="space-y-3">
        <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Texture</h5>
        <div className="space-y-2">
          {textures.map((tex) => (
            <label key={tex.value} className="flex items-center gap-3 text-[14px] font-medium text-[#222222] cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTextures.includes(tex.value)}
                onChange={() => handleTextureChange(tex.value)}
                className="w-4 h-4 accent-[#E56717] rounded border-gray-300"
              />
              <span>{tex.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price boundary inputs */}
      <div className="space-y-3">
        <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Price Range (₦)</h5>
        <form onSubmit={handlePriceApply} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 h-10 px-3 bg-[#FAF7F4] border border-[#222222]/10 rounded-[12px] text-[14px]"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 h-10 px-3 bg-[#FAF7F4] border border-[#222222]/10 rounded-[12px] text-[14px]"
            />
          </div>
          <button
            type="submit"
            className="w-full h-10 bg-[#222222] hover:bg-[#E56717] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] transition-colors duration-200 cursor-pointer"
          >
            Apply Price
          </button>
        </form>
      </div>
    </aside>
  );
}
