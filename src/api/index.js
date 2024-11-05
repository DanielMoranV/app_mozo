import axios from './axios';

// Auth
export const login = (payload) => axios.post('/auth/login', payload);
export const register = (payload) => axios.post('/auth/register', payload);
export const logout = () => axios.post('/auth/logout');
export const refresh = () => axios.post('/auth/refresh');
export const me = () => axios.post('/auth/me');

// Users
export const fetchUsers = () => axios.get('/users');
export const getUser = (id) => axios.get(`/users/${id}`);
export const createUser = (payload) => axios.post('/users', payload);
export const updateUser = (payload, id) => axios.put(`/users/${id}`, payload);
export const updateProfileUser = (payload, id) => {
    return axios.put(`/users/${id}`, payload, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};
export const uploadUsers = (payload) => axios.post('/users/store', payload);
export const deleteUser = (id) => axios.delete(`/users/${id}`);

// Roles
export const getRoles = () => axios.get('/roles');
export const createRole = (payload) => axios.post('/roles', payload);
export const updateRole = (payload, id) => axios.put(`/roles/${id}`, payload);
export const deleteRole = (id) => axios.delete(`/roles/${id}`);
export const assignRole = (payload) => axios.put('/roles/user', payload);
export const removeRole = (payload) => axios.delete('/roles/user', payload);

// Compañias
export const getCompanies = () => axios.get('/companies');
export const getCompany = (id) => axios.get(`/companies/${id}`);
export const createCompany = (payload) => axios.post('/companies', payload);
export const updateCompany = (payload, id) => axios.put(`/companies/${id}`, payload);
export const deleteCompany = (id) => axios.delete(`/companies/${id}`);
export const updateLogoCompany = (payload, id) => {
    return axios.put(`/users/${id}`, payload, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Almacenes
export const getWarehouses = () => axios.get('/warehouses');

// Productos
export const getProducts = () => axios.get('/products');
export const getProduct = (id) => axios.get(`/products/${id}`);
export const createProduct = (payload) => axios.post('/products', payload);
export const updateProduct = (payload, id) => axios.put(`/products/${id}`, payload);
export const deleteProduct = (id) => axios.delete(`/products/${id}`);
export const uploadProducts = (payload) => axios.post('/products/store', payload);

// Categorias
export const getCategories = () => axios.get('/categories');
export const getCategory = (id) => axios.get(`/categories/${id}`);
export const createCategory = (payload) => axios.post('/categories', payload);
export const updateCategory = (payload, id) => axios.put(`/categories/${id}`, payload);
export const deleteCategory = (id) => axios.delete(`/categories/${id}`);
export const uploadCategories = (payload) => axios.post('/categories/store', payload);

// Unidades
export const getUnits = () => axios.get('/units');
export const getUnit = (id) => axios.get(`/units/${id}`);
export const createUnit = (payload) => axios.post('/units', payload);
export const updateUnit = (payload, id) => axios.put(`/units/${id}`, payload);
export const deleteUnit = (id) => axios.delete(`/units/${id}`);
export const uploadUnits = (payload) => axios.post('/units/store', payload);

// Movimientos de stock
export const getStockMovements = () => axios.get('/stock-movements');
export const createEntryStockMovements = (payload) => axios.post('/stock-movements/store-entry', payload);

// Categorias de movimientos de stock
export const getCategoryMovements = () => axios.get('/category-movements');

// Parameters
export const getParameters = () => axios.get('/parameters');
export const getParameter = (id) => axios.get(`/parameters/${id}`);
export const createParameter = (payload) => axios.post('/parameters', payload);
export const updateParameter = (id) => axios.put(`/parameters/${id}`);
export const deleteParameter = (id) => axios.delete(`/parameters/${id}`);

// Proveedores
export const getProviders = () => axios.get('/providers');
export const getProvider = (id) => axios.get(`/providers/${id}`);
export const createProvider = (payload) => axios.post('/providers', payload);
export const updateProvider = (payload, id) => axios.put(`/providers/${id}`, payload);
export const deleteProvider = (id) => axios.delete(`/providers/${id}`);

// Ordenes de compra
export const getPurchaseOrders = () => axios.get('/purchase-orders');
export const createPurchaseOrder = (payload) => axios.post('/purchase-orders', payload);
export const getPurchaseOrder = (id) => axios.get(`/purchase-orders/${id}`);
export const updatePurchaseOrder = (payload, id) => axios.put(`/purchase-orders/${id}`, payload);
export const deletePurchaseOrder = (id) => axios.delete(`/purchase-orders/${id}`);
export const printPurchaseOrder = (id) => axios.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' });
export const createPurchaseOrderAndDetails = (payload) => axios.post('/purchase-orders/store-purchase-order-and-details', payload);

// Ordenes de venta
export const getSalesOrders = () => axios.get('/sales-orders');
export const createSalesOrder = (payload) => axios.post('/sales-orders', payload);
export const getSalesOrder = (id) => axios.get(`/sales-orders/${id}`);
export const updateSalesOrder = (payload, id) => axios.put(`/sales-orders/${id}`, payload);
export const deleteSalesOrder = (id) => axios.delete(`/sales-orders/${id}`);
