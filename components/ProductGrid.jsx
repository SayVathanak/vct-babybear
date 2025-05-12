// components/ProductGrid.jsx
import ProductCard from './ProductCard';

const ProductGrid = ({ products, isLoading = false, title = "Products" }) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800">{title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {[...Array(10)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="rounded-lg bg-gray-200 aspect-square mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-12 border border-gray-100 rounded-lg bg-gray-50">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No products found</h3>
                <p className="text-gray-500 text-sm">Try changing your search or filter criteria</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {products.map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index} />
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;