// components/ProductFilter.jsx
import { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProductFilter = ({
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

    // Sync local price range with props when component mounts or priceRange prop changes
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

    // Inside ProductFilter component
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);

        // Update URL with the new category parameter
        const url = new URL(window.location);
        if (category === "All") {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', category);
        }
        window.history.pushState({}, '', url);
    };

    const handlePriceChange = (e, boundary) => {
        const value = e.target.value ? Number(e.target.value) : (boundary === 'min' ? 0 : maxPossiblePrice);

        // Update local state first
        let newLocalRange;

        // Ensure min doesn't exceed max and max doesn't go below min
        if (boundary === 'min' && value > localPriceRange.max) {
            newLocalRange = {
                min: value,
                max: value
            };
        } else if (boundary === 'max' && value < localPriceRange.min) {
            newLocalRange = {
                min: value,
                max: value
            };
        } else {
            newLocalRange = {
                ...localPriceRange,
                [boundary]: value
            };
        }

        setLocalPriceRange(newLocalRange);
    };

    // Apply price range changes to parent state
    const applyPriceRange = () => {
        setPriceRange(localPriceRange);
    };

    // Handle price range change when slider or input loses focus
    const handlePriceInputBlur = () => {
        applyPriceRange();
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
                                onClick={() => handleCategoryChange(category)}
                                className={`w-full text-left py-2 rounded-md transition ${selectedCategory === category
                                        ? 'text-gray-700'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                ⤷ {categoryDisplayNames[category] || category}
                            </button>
                        </li>
                    ))}
                </ul>
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