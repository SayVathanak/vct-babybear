import React, { Suspense } from 'react';
import AllProductsClient from './AllProductsClient';

// This is a simple loading component. You can replace it with your own.
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen z-10">
    <p>Loading products...</p>
  </div>
);

const AllProductsPage = () => {
  return (
    <div className="relative z-10">
      <Suspense fallback={<LoadingFallback />}>
        <AllProductsClient />
      </Suspense>
    </div>
  );
};

export default AllProductsPage;