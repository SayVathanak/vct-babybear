import { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProductFilter = ({
    router, // Receive router prop
    categories,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    priceRange,
    setPriceRange,
    maxPossiblePrice,
    brands,
    selectedBrands,
    setSelectedBrands
}) => {
    const [showCategories, setShowCategories] = useState(true);
    const [showBrands, setShowBrands] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [localPriceRange, setLocalPriceRange] = useState(priceRange);

    useEffect(() => {
        setLocalPriceRange(priceRange);
    }, [priceRange]);

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
        "NurseryItems": "Nursery & Sleep Essentials",
        "BathBodyCare": "Bath & Body Care",
        "Toys": "Play & Learn",
    };

    const sortOptions = [
        { value: "newest", label: "Newest" },
        { value: "nameAsc", label: "Name: A to Z" },
        { value: "nameDesc", label: "Name: Z to A" },
        { value: "priceAsc", label: "Price: Low to High" },
        { value: "priceDesc", label: "Price: High to Low" },
        { value: "popular", label: "Popularity" },
    ];
    
    // Updated to use Next.js router for navigation
    const handleCategoryChange = (category) => {
        // Optimistically update the state for instant UI feedback
        setSelectedCategory(category);
    
        const params = new URLSearchParams(window.location.search);
        if (category === "All") {
            params.delete('category');
        } else {
            params.set('category', category);
        }
    
        // Use the router to push the new URL state
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.push(newUrl, { scroll: false });
    };

    const handlePriceChange = (e, boundary) => {
        const value = Number(e.target.value);
        let newRange = { ...localPriceRange, [boundary]: value };
        if (newRange.min > newRange.max) {
            newRange = boundary === 'min' ? { min: value, max: value } : { min: newRange.max, max: newRange.min };
        }
        setLocalPriceRange(newRange);
    };

    const applyPriceRange = () => {
        setPriceRange(localPriceRange);
    };

    const handleBrandToggle = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    return (
        <div className="divide-y divide-gray-200">
            {/* Sort Options (for mobile) */}
            <div className="py-4 lg:hidden">
                <label htmlFor="mobileSort" className="block text-md font-medium text-gray-700 mb-2">
                    Sort By
                </label>
                <select
                    id="mobileSort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500"
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
                <ul className="space-y-1">
                    {categories.map(category => (
                        <li key={category}>
                            <button
                                onClick={() => handleCategoryChange(category)}
                                className={`w-full text-left py-2 rounded-md transition text-sm flex justify-between items-center ${
                                    selectedCategory === category
                                        ? 'text-gray-900'
                                        : 'text-gray-400'
                                }`}
                            >
                                <span> ⟢ {categoryDisplayNames[category] || category}</span>
                                {selectedCategory === category && <span className="text-xs">✓</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </FilterSection>

            {/* Price Range */}
            {/* <FilterSection
                title="Price Range"
                isOpen={showPrice}
                toggle={() => setShowPrice(!showPrice)}
            >
                <div className="flex flex-col space-y-3">
                    <input
                        type="range"
                        min="0"
                        max={maxPossiblePrice}
                        value={localPriceRange.max}
                        onChange={(e) => handlePriceChange(e, 'max')}
                        onMouseUp={applyPriceRange}
                        onTouchEnd={applyPriceRange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            ${localPriceRange.min.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                            ${localPriceRange.max.toLocaleString()}
                        </span>
                    </div>
                </div>
            </FilterSection> */}

            {/* Brands */}
            {/* <FilterSection
                title="Brands"
                isOpen={showBrands}
                toggle={() => setShowBrands(!showBrands)}
            >
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {brands.map(({ name, count }) => (
                        <label key={name} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedBrands.includes(name)}
                                onChange={() => handleBrandToggle(name)}
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="text-sm text-gray-700 flex-grow">{name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{count}</span>
                        </label>
                    ))}
                </div>
            </FilterSection> */}
        </div>
    );
};

const FilterSection = ({ title, isOpen, toggle, children }) => {
    return (
        <div className="py-4">
            <button
                onClick={toggle}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
            >
                <span>{title}</span>
                {isOpen ? <FaChevronUp className="text-gray-500" size={14} /> : <FaChevronDown className="text-gray-500" size={14} />}
            </button>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
};

export default ProductFilter;