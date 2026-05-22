'use client';

import { useState } from 'react';

interface FilterOptions {
  priceRange: [number, number];
  categories: string[];
  brands: string[];
  ratings: number[];
  inStock: boolean;
  onSale: boolean;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const categories = ['Electronics', 'Fashion', 'Home Decor', 'Wearables', 'Clothing', 'Office'];
  const brands = ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG'];
  const ratings = [5, 4, 3, 2, 1];

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    applyFilters({ categories: updated });
  };

  const handleBrandToggle = (brand: string) => {
    const updated = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(updated);
    applyFilters({ brands: updated });
  };

  const handleRatingToggle = (rating: number) => {
    const updated = selectedRatings.includes(rating)
      ? selectedRatings.filter(r => r !== rating)
      : [...selectedRatings, rating];
    setSelectedRatings(updated);
    applyFilters({ ratings: updated });
  };

  const handlePriceChange = (index: 0 | 1, value: number) => {
    const updated: [number, number] = [...priceRange];
    updated[index] = value;
    setPriceRange(updated);
    applyFilters({ priceRange: updated });
  };

  const applyFilters = (updates: Partial<FilterOptions>) => {
    onFilterChange({
      priceRange,
      categories: selectedCategories,
      brands: selectedBrands,
      ratings: selectedRatings,
      inStock,
      onSale,
      ...updates
    });
  };

  const clearAllFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRatings([]);
    setInStock(false);
    setOnSale(false);
    onFilterChange({
      priceRange: [0, 1000],
      categories: [],
      brands: [],
      ratings: [],
      inStock: false,
      onSale: false
    });
  };

  const activeFilterCount = 
    selectedCategories.length + 
    selectedBrands.length + 
    selectedRatings.length + 
    (inStock ? 1 : 0) + 
    (onSale ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 1000 ? 1 : 0);

  return (
    <div className="bg-white/90 rounded-2xl shadow-luxury border border-brand-nude/50 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="font-display text-lg font-semibold text-brand-espresso">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-brand-espresso text-white text-xs font-bold px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-brand-mauve hover:text-brand-espresso font-medium whitespace-nowrap"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center hover:bg-brand-nude/30 rounded-lg text-brand-cocoa"
          >
            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line`}></i>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-brand-espresso mb-3">Price Range</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-brand-nude/70 rounded-lg text-sm focus:border-brand-espresso focus:ring-2 focus:ring-brand-mauve/30"
                  placeholder="Min"
                />
                <span className="text-brand-nude">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-brand-nude/70 rounded-lg text-sm focus:border-brand-espresso focus:ring-2 focus:ring-brand-mauve/30"
                  placeholder="Max"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                className="w-full accent-brand-espresso"
              />
              <p className="text-sm text-brand-cocoa/70">
                GH₵{priceRange[0]} to GH₵{priceRange[1]}
              </p>
            </div>
          </div>

          <div className="border-t border-brand-nude/50 pt-6">
            <h4 className="font-semibold text-brand-espresso mb-3">Category</h4>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-5 h-5 text-brand-espresso border-brand-nude/70 rounded focus:ring-brand-mauve/30"
                  />
                  <span className="text-brand-cocoa group-hover:text-brand-espresso">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-nude/50 pt-6">
            <h4 className="font-semibold text-brand-espresso mb-3">Brand</h4>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="w-5 h-5 text-brand-espresso border-brand-nude/70 rounded focus:ring-brand-mauve/30"
                  />
                  <span className="text-brand-cocoa group-hover:text-brand-espresso">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-nude/50 pt-6">
            <h4 className="font-semibold text-brand-espresso mb-3">Rating</h4>
            <div className="space-y-2">
              {ratings.map((rating) => (
                <label key={rating} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedRatings.includes(rating)}
                    onChange={() => handleRatingToggle(rating)}
                    className="w-5 h-5 text-brand-espresso border-brand-nude/70 rounded focus:ring-brand-mauve/30"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`ri-star-${i < rating ? 'fill' : 'line'} text-sm ${
                            i < rating ? 'text-brand-champagne' : 'text-brand-nude'
                          }`}
                        ></i>
                      ))}
                    </div>
                    <span className="text-brand-cocoa group-hover:text-brand-espresso">& Up</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-nude/50 pt-6 space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  applyFilters({ inStock: e.target.checked });
                }}
                className="w-5 h-5 text-brand-espresso border-brand-nude/70 rounded focus:ring-brand-mauve/30"
              />
              <span className="text-brand-cocoa group-hover:text-brand-espresso">In Stock Only</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={onSale}
                onChange={(e) => {
                  setOnSale(e.target.checked);
                  applyFilters({ onSale: e.target.checked });
                }}
                className="w-5 h-5 text-brand-espresso border-brand-nude/70 rounded focus:ring-brand-mauve/30"
              />
              <span className="text-brand-cocoa group-hover:text-brand-espresso">On Sale</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
