// // src/services/productService.js
import axios from 'axios';

const API_URL = 'https://back-fodex-ecommerce.onrender.com/products';

export const fetchProducts = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch products", error);
        return [];
    }
};

export const fetchProductById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch product with id ${id}`, error);
        return null;
    }
};

// export const fetchProductsByCategory = async (category) => {
//     try {
//         const response = await axios.get(`http://localhost:8080/category/${category}`);
//         return response.data;
//     } catch (error) {
//         console.error(`Failed to fetch products for category ${category}`, error);
//         return [];
//     }
// };

// export const userLogin = async (email, password) => {
//     try {
//         const response = await axios.post(`${API_URL}/login`, { email, password });
//         return response.data;
//     } catch (error) {
//         console.error("Failed to login", error);
//         return null;
//     }
// };

// export const userSignup = async (name, email, password) => {
//     try {
//         const response = await axios.post(`${API_URL}/signup`, { name, email, password });
//         return response.data;
//     } catch (error) {
//         console.error("Failed to sign up", error);
//         return null;
//     }
// };

// export const fetchPage = async (page = 1, limit = 10) => {
//     try {
//       const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       throw error;
//     }
//   };