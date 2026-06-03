const API_BASE_URL = "http://localhost:5000/api";

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Product API functions
export const fetchProducts = async () => {
  try {
    const response = await apiCall("/products");
    // Transform database column names to frontend property names
    const products = (response.data || []).map((product: any) => ({
      id: product.id,
      name: product.nama || product.name,
      price: product.harga || product.price,
      stock: product.stok || product.stock,
      category: product.id_kategori || product.category,
      image: product.url_gambar || product.image,
      description: product.deskripsi || product.description,
    }));
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

export const createProduct = async (product) => {
  try {
    const response = await apiCall("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    // Transform response back to frontend format
    return {
      id: response.data.id,
      name: response.data.nama || response.data.name,
      price: response.data.harga || response.data.price,
      stock: response.data.stok || response.data.stock,
      category: response.data.id_kategori || response.data.category,
      image: response.data.url_gambar || response.data.image,
      description: response.data.deskripsi || response.data.description,
    };
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
};

export const updateProduct = async (id, product) => {
  try {
    const response = await apiCall(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
    // Transform response back to frontend format
    return {
      id: response.data.id,
      name: response.data.nama || response.data.name,
      price: response.data.harga || response.data.price,
      stock: response.data.stok || response.data.stock,
      category: response.data.id_kategori || response.data.category,
      image: response.data.url_gambar || response.data.image,
      description: response.data.deskripsi || response.data.description,
    };
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await apiCall(`/products/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
};

// Category API functions
export const fetchCategories = async () => {
  try {
    const response = await apiCall("/products/categories");
    // Transform database column names to frontend property names
    const categories = (response.data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.nama || cat.name, // Support both database and API format
    }));
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

export const createCategory = async (category) => {
  try {
    const response = await apiCall("/products/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
    // Transform response to match frontend format
    return {
      id: response.data.id,
      name: response.data.name || response.data.nama,
    };
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await apiCall(`/products/categories/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
};
