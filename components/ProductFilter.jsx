// components/ProductFilter.jsx
import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProductFilter = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    priceRange,
    setPriceRange,
    brands,
    selectedBrands,
    setSelectedBrands
}) => {
    const [showCategories, setShowCategories] = useState(true);
    const [showBrands, setShowBrands] = useState(true);
    const [showPrice, setShowPrice] = useState(true);

    const categoryDisplayNames = {
        "All": "All Products",
        "PowderedMilk": "Formula & Powdered Milk",
        "LiquidMilk": "Ready-to-Feed Milk",
        "Bottles": "Bottles & Sippy Cups",
        "Tumblers": "Toddler Tumblers & Cups",
        "FeedingTools": "Feeding Sets & Utensils",
        "Accessories": "Baby Essentials & Accessories",
        "Vitamins": "Nutrition & Supplements",
        "Diapers": "Diapers & Wipes",
        "NurseryItems": "Nursery & Sleep Essentials"
    };

    const sortOptions = [
        { value: "newest", label: "Newest" },
        { value: "priceAsc", label: "Price: Low to High" },
        { value: "priceDesc", label: "Price: High to Low" },
        { value: "popular", label: "Popularity" },
    ];

    const handlePriceChange = (e, boundary) => {
        const value = e.target.value ? Number(e.target.value) : (boundary === 'min' ? 0 : 1000);
        setPriceRange({
            ...priceRange,
            [boundary]: value
        });
    };

    const handleBrandToggle = (brand) => {
        setSelectedBrands(prevBrands =>
            prevBrands.includes(brand)
                ? prevBrands.filter(b => b !== brand)
                : [...prevBrands, brand]
        );
    };

    return (
        <div className="divide-y">
            {/* Sort Options (for mobile) */}
            <div className="lg:hidden pb-4">
                <label htmlFor="mobileSort" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                </label>
                <select
                    id="mobileSort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {/* Categories */}
            <FilterSection
                title="Categories"
                isOpen={showCategories}
                toggle={() => setShowCategories(!showCategories)}
            >
                <ul className="space-y-2">
                    {categories.map(category => (
                        <li key={category}>
                            <button
                                onClick={() => setSelectedCategory(category)}
                                className={`w-full text-left py-2 px-1 rounded-md transition hover:text-blue-500 ${selectedCategory === category
                                    ? 'text-blue-600 font-medium'
                                    : 'text-gray-700'
                                    }`}
                            >
                                {categoryDisplayNames[category] || category}
                            </button>
                        </li>
                    ))}
                </ul>
            </FilterSection>

            {/* Brands */}
            {/* <FilterSection
                title="Brands"
                isOpen={showBrands}
                toggle={() => setShowBrands(!showBrands)}
            >
                <ul className="space-y-2">
                    {brands.map(brand => (
                        <li key={brand.name}>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedBrands.includes(brand.name)}
                                    onChange={() => handleBrandToggle(brand.name)}
                                    className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="ml-2 text-gray-700">
                                    {brand.name} <span className="text-gray-400 text-sm">({brand.count})</span>
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </FilterSection> */}

            {/* Price Range */}
            <FilterSection
                title="Price Range"
                isOpen={showPrice}
                toggle={() => setShowPrice(!showPrice)}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="min-price" className="block text-sm text-gray-600 mb-1">
                                Min Price
                            </label>
                            <input
                                type="number"
                                id="min-price"
                                min="0"
                                value={priceRange.min}
                                onChange={(e) => handlePriceChange(e, 'min')}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="max-price" className="block text-sm text-gray-600 mb-1">
                                Max Price
                            </label>
                            <input
                                type="number"
                                id="max-price"
                                min="0"
                                value={priceRange.max}
                                onChange={(e) => handlePriceChange(e, 'max')}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange.min}
                            onChange={(e) => handlePriceChange(e, 'min')}
                            className="w-full accent-blue-500"
                        />
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange.max}
                            onChange={(e) => handlePriceChange(e, 'max')}
                            className="w-full accent-blue-500"
                        />
                    </div>
                </div>
            </FilterSection>
        </div>
    );
};

const FilterSection = ({ title, isOpen, toggle, children }) => {
    return (
        <div className="py-4">
            <button
                onClick={toggle}
                className="flex items-center justify-between w-full text-left font-medium mb-2"
            >
                <span>{title}</span>
                {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
};

export default ProductFilter;