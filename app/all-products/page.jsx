import React, { Suspense } from 'react';
import AllProductsClient from './AllProductsClient';

// This is a simple loading component. You can replace it with your own.
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <p>Loading products...</p>
  </div>
);

const AllProductsPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AllProductsClient />
    </Suspense>
  );
};

export default AllProductsPage;
