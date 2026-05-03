// src/contexts/ProductContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000], // Example range
    rating: 0,
  });

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://back-doc.onrender.com/products');
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Apply filters and search query
  const applyFilters = () => {
    let results = products;

    // Search filter
    if (searchQuery) {
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      results = results.filter(product => product.category === filters.category);
    }

    // Price range filter
    if (filters.priceRange) {
      results = results.filter(
        product =>
          product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      );
    }

    // Rating filter
    if (filters.rating) {
      results = results.filter(product => product.rating >= filters.rating);
    }

    setFilteredProducts(results);
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Reapply filters whenever filters or search query change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters]);

  return (
    <ProductContext.Provider
      value={{
        products,
        filteredProducts,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        fetchProducts,
        applyFilters
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => useContext(ProductContext);