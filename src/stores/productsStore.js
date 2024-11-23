import {
    createCategory,
    createProduct,
    createUnit,
    deleteCategory,
    deleteProduct,
    deleteUnit,
    getCategories,
    getCategory,
    getProduct,
    getProducts,
    getUnit,
    getUnits,
    updateCategory,
    updateProduct,
    updateUnit,
    uploadCategories,
    uploadProducts,
    uploadUnits
} from '@/api';
import cache from '@/utils/cache';
import { handleResponseStore } from '@/utils/response';
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('productStore', {
    state: () => ({
        products: cache.getItem('products'),
        product: cache.getItem('product'),
        categories: cache.getItem('categories'),
        category: cache.getItem('category'),
        units: cache.getItem('units'),
        unit: cache.getItem('unit'),
        message: '',
        status: null,
        loading: false,
        success: false
    }),

    getters: {
        //SECTION - getters for products
        getProducts(state) {
            return state.products;
        },
        getCategories(state) {
            return state.categories;
        },
        getUnits(state) {
            return state.units;
        },
        getCategoriesCbx(state) {
            if (state.categories == null) return null;
            const categoriesCbx = state.categories.map((category) => ({
                label: category.name,
                value: category.id
            }));
            return categoriesCbx;
        },
        getUnitsCbx(state) {
            if (state.units === null) return null;
            const unitsCbx = state.units.map((unit) => ({
                label: unit.symbol,
                value: unit.id
            }));
            return unitsCbx;
        }
        //!SECTION
    },

    actions: {
        //SECTION Productos

        async createProduct(payload) {
            this.loading = true;
            payload.category_id = payload.category.id;
            payload.unit_id = payload.unit.id;
            const { data } = await handleResponseStore(createProduct(payload), this);
            if (this.success) {
                this.product = data;
                this.products.push(this.product);
                cache.setItem('products', this.products);
                this.message = 'Producto creado correctamente';
            } else {
                this.product = null;
            }
            return this.success;
        },

        async fetchProducts() {
            this.loading = true;

            const { data } = await handleResponseStore(getProducts(), this);
            // Modificar el nombre de los productos para que sea más descriptivo
            if (this.success) {
                const updatedProducts = data.map((product) => {
                    return {
                        ...product,
                        fullDescription: `${product.code} - ${product.name} - ${product.category.name}`
                    };
                });
                this.products = updatedProducts;
                cache.setItem('products', this.products);
            } else {
                this.products = [];
            }
            return this.success;
        },

        async fetchProduct(id) {
            this.loading = true;
            const { data } = await handleResponseStore(getProduct(id), this);
            if (this.success) {
                this.product = data;
                cache.setItem('product', this.product);
            } else {
                this.product = null;
            }
            return this.success;
        },

        async uploadProducts(payload) {
            this.loading = true;
            const dataProducts = payload.map((product) => ({
                code: String(product.code),
                name: product.name,
                description: product.description,
                category_id: Number(product.category_id),
                unit_id: Number(product.unit_id),
                user_id: Number(product.user_id)
            }));

            const requestData = { products: dataProducts };
            const { data } = await handleResponseStore(uploadProducts(requestData), this);
            if (this.success) {
                data.success.forEach((element) => this.products.push(element));
                cache.setItem('products', this.products);
            }
            return { status: this.success, success: data.success, errors: data.errors };
        },

        async updateProduct(payload, id) {
            this.loading = true;
            payload.category_id = payload.category.id;
            payload.unit_id = payload.unit.id;
            const { data } = await handleResponseStore(updateProduct(payload, id), this);
            if (this.success) {
                cache.setItem('product', data);
                this.product = data;
                this.message = 'Producto actualizado correctamente';
            } else {
                this.product = null;
            }
            return this.success;
        },

        async deleteProduct(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteProduct(id), this);
            if (this.success) {
                this.products = this.products.filter((product) => product.id !== id);
                cache.setItem('products', this.products);
                this.message = `Producto ${data.name} eliminado correctamente`;
            }
            return this.success;
        },

        async updateListProducts(payload, id) {
            const productIndex = this.products.findIndex((product) => product.id === id);
            if (productIndex !== -1) {
                this.products[productIndex] = {
                    ...this.products[productIndex],
                    ...payload
                };
                cache.setItem('products', this.products);
            }
        },
        //!SECTION

        //SECTION Categorías
        async createCategory(payload) {
            this.loading = true;
            const { data } = await handleResponseStore(createCategory(payload), this);
            if (this.success) {
                this.category = data;
                this.categories.push(this.category);
                cache.setItem('categories', this.categories);
                this.message = 'Categoría creada correctamente';
            } else {
                this.category = null;
            }
            return this.success;
        },

        async fetchCategories() {
            this.loading = true;
            const { data } = await handleResponseStore(getCategories(), this);
            if (this.success) {
                cache.setItem('categories', data);
                this.categories = data;
            } else {
                this.categories = null;
            }
            return this.success;
        },

        async fetchCategory(id) {
            this.loading = true;
            const { data } = await handleResponseStore(getCategory(id), this);
            if (this.success) {
                cache.setItem('category', data);
                this.category = data;
            } else {
                this.category = null;
            }
            return this.success;
        },
        async uploadCategories(payload) {
            this.loading = true;
            const dataCategories = payload.map((category) => ({
                name: category.name,
                description: category.description
            }));
            const requestData = { categories: dataCategories };
            const { data } = await handleResponseStore(uploadCategories(requestData), this);
            if (this.success) {
                data.success.forEach((element) => this.categories.push(element));
                cache.setItem('categories', this.categories);
                this.message = 'Categorías creadas correctamente';
            }
            return this.success;
        },

        async updateCategory(payload, id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateCategory(payload, id), this);
            if (this.success) {
                cache.setItem('category', data);
                this.category = data;
                this.message = 'Categoría actualizada correctamente';
            } else {
                this.category = null;
            }
            return this.success;
        },

        async deleteCategory(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteCategory(id), this);
            if (this.success) {
                this.categories = this.categories.filter((category) => category.id !== id);
                cache.setItem('categories', this.categories);
                this.message = `Categoría ${data.name} eliminada correctamente`;
            }
            return this.success;
        },

        async updateListCategories(payload, id) {
            const categoryIndex = this.categories.findIndex((category) => category.id === id);
            if (categoryIndex !== -1) {
                this.categories[categoryIndex] = {
                    ...this.categories[categoryIndex],
                    ...payload
                };
                cache.setItem('categories', this.categories);
            }
        },
        //!SECTION

        //SECTION Unidades
        async createUnit(payload) {
            this.loading = true;
            const { data } = await handleResponseStore(createUnit(payload), this);
            if (this.success) {
                this.unit = data;
                this.units.push(this.unit);
                cache.setItem('units', this.units);
                this.message = 'Unidad creada correctamente';
            } else {
                this.unit = null;
            }
            return this.success;
        },

        async fetchUnits() {
            this.loading = true;
            const { data } = await handleResponseStore(getUnits(), this);
            if (this.success) {
                cache.setItem('units', data);
                this.units = data;
            } else {
                this.units = null;
            }
            return this.success;
        },

        async fetchUnit(id) {
            this.loading = true;
            const { data } = await handleResponseStore(getUnit(id), this);
            if (this.success) {
                cache.setItem('unit', data);
                this.unit = data;
            } else {
                this.unit = null;
            }
            return this.success;
        },

        async updateUnit(payload, id) {
            this.loading = true;
            const { data } = await handleResponseStore(updateUnit(payload, id), this);
            if (this.success) {
                console.log(data);
                cache.setItem('unit', data);
                this.unit = data;
                this.message = 'Unidad actualizada correctamente';
            } else {
                this.unit = null;
            }
            return this.success;
        },

        async deleteUnit(id) {
            this.loading = true;
            const { data } = await handleResponseStore(deleteUnit(id), this);
            if (this.success) {
                this.units = this.units.filter((unit) => unit.id !== id);
                cache.setItem('units', this.units);
                this.message = `Unidad ${data.name} eliminada correctamente`;
            }
            return this.success;
        },

        async uploadUnits(payload) {
            const dataUnits = payload.map((unit) => ({
                symbol: unit.symbol,
                name: unit.name
            }));

            const requestData = { units: dataUnits };
            const { data } = await handleResponseStore(uploadUnits(requestData), this);
            if (this.success) {
                data.success.forEach((element) => this.units.push(element));
                cache.setItem('units', this.units);
                this.message = 'Unidades creadas correctamente';
            }
            return this.success;
        },
        async updateListUnits(payload, id) {
            const unitIndex = this.units.findIndex((unit) => unit.id === id);
            if (unitIndex !== -1) {
                this.units[unitIndex] = {
                    ...this.units[unitIndex],
                    ...payload
                };
                cache.setItem('units', this.units);
            }
        }
    }
});
