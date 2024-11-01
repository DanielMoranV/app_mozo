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
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('productStore', {
    state: () => ({
        products: cache.getItem('products'),
        product: cache.getItem('product'),
        categories: cache.getItem('categories'),
        category: cache.getItem('category'),
        units: cache.getItem('units'),
        unit: cache.getItem('unit'),
        msg: '',
        status: null,
        loading: false
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
            try {
                payload.category_id = payload.category.id;
                payload.unit_id = payload.unit.id;
                const { data } = await createProduct(payload);
                this.product = data;
                this.products.push(this.product);
                cache.setItem('products', this.products);
                return this.product;
            } catch (error) {
                this.msg = error.message || 'Error al crear el producto';
                this.product = null;
                this.status = error.status_code || 500;
                return this.status;
            }
        },

        async fetchProducts() {
            try {
                const { data } = await getProducts();
                // Modificar el nombre de los productos para que sea más descriptivo
                const updatedProducts = data.map((product) => {
                    return {
                        ...product,
                        fullDescription: `${product.code} - ${product.name} - ${product.category.name}`
                    };
                });

                // Guardar en el cache y actualizar el estado
                cache.setItem('products', updatedProducts);
                this.products = updatedProducts;
            } catch (error) {
                this.msg = error.message;
                this.products = null;
                console.error(error);
            } finally {
                this.loading = false;
                return this.products;
            }
        },

        async fetchProduct(id) {
            try {
                const { data } = await getProduct(id);
                cache.setItem('product', data);
                this.product = data;
            } catch (error) {
                this.msg = error.message;
                this.product = null;
            } finally {
                this.loading = false;
                return this.product;
            }
        },

        async uploadProducts(payload) {
            const dataProducts = payload.map((product) => ({
                code: String(product.code),
                name: product.name,
                description: product.description,
                category_id: Number(product.category_id),
                unit_id: Number(product.unit_id),
                user_id: Number(product.user_id)
            }));

            const requestData = { products: dataProducts };
            try {
                const { data } = await uploadProducts(requestData);
                data.success.forEach((element) => this.products.push(element));
                cache.setItem('products', this.products);
                this.msg = data.message;
                return data;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },

        async updateProduct(payload, id) {
            try {
                payload.category_id = payload.category.id;
                payload.unit_id = payload.unit.id;
                const { data } = await updateProduct(payload, id);
                cache.setItem('product', data);
                this.product = data;
            } catch (error) {
                this.msg = error.message;
                this.product = null;
            } finally {
                this.loading = false;
                return this.product;
            }
        },

        async deleteProduct(id) {
            try {
                const response = await deleteProduct(id);
                if (response.success) {
                    this.products = this.products.filter((product) => product.id !== id);
                    cache.setItem('products', this.products);
                }
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return { success: false, status: this.status };
            }
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
            try {
                const { data } = await createCategory(payload);
                this.category = data;
                this.categories.push(this.category);
                cache.setItem('categories', this.categories);
                return this.category;
            } catch (error) {
                this.msg = error.message || 'Error al crear la categoría';
                this.category = null;
                this.status = error.status_code || 500;
                return this.status;
            }
        },

        async fetchCategories() {
            try {
                const { data } = await getCategories();
                cache.setItem('categories', data);
                this.categories = data;
            } catch (error) {
                this.msg = error.message;
                this.categories = null;
            } finally {
                this.loading = false;
                return this.categories;
            }
        },

        async fetchCategory(id) {
            try {
                const { data } = await getCategory(id);
                cache.setItem('category', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.category = null;
            } finally {
                this.loading = false;
                return this.category;
            }
        },
        async uploadCategories(payload) {
            const dataCategories = payload.map((category) => ({
                name: category.name,
                description: category.description
            }));

            const requestData = { categories: dataCategories };
            console.log(requestData);

            try {
                const { data } = await uploadCategories(requestData);
                this.msg = data.message;
                return data;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
        },

        async updateCategory(payload, id) {
            try {
                const { data } = await updateCategory(payload, id);
                cache.setItem('category', data);
                this.category = data;
            } catch (error) {
                this.msg = error.message;
                this.category = null;
            } finally {
                return this.category;
            }
        },

        async deleteCategory(id) {
            try {
                const response = await deleteCategory(id);
                if (response.success) {
                    this.categories = this.categories.filter((category) => category.id !== id);
                    cache.setItem('categories', this.categories);
                }
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return { success: false, status: this.status };
            }
        },

        async fetchCategoriesComboBox() {
            try {
                const { data } = await getCategories();

                cache.setItem('categories', data);
                this.categories = data;

                const categoriesCbx = data.map((category) => ({
                    label: category.name,
                    value: category.id
                }));
                return categoriesCbx;
            } catch (error) {
                this.msg = error.message;
                return null;
            } finally {
                this.loading = false;
            }
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
            try {
                const { data } = await createUnit(payload);
                this.unit = data;
                this.units.push(this.unit);
                cache.setItem('units', this.units);
                return this.unit;
            } catch (error) {
                this.msg = error.message || 'Error al crear la unidad';
                this.unit = null;
                this.status = error.status_code || 500;
                return this.status;
            }
        },

        async fetchUnits() {
            try {
                const { data } = await getUnits();
                cache.setItem('units', data);
                this.units = data;
            } catch (error) {
                this.msg = error.message;
                this.units = null;
            } finally {
                this.loading = false;
                return this.units;
            }
        },

        async fetchUnit(id) {
            try {
                const { data } = await getUnit(id);
                cache.setItem('unit', data);
                this.unit = data;
            } catch (error) {
                this.msg = error.message;
                this.unit = null;
            } finally {
                this.loading = false;
                return this.unit;
            }
        },

        async updateUnit(payload, id) {
            try {
                const { data } = await updateUnit(payload, id);
                console.log(data);
                cache.setItem('unit', data);
                this.unit = data;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.unit = null;
            } finally {
                return this.unit;
            }
        },

        async deleteUnit(id) {
            try {
                const response = await deleteUnit(id);
                if (response.success) {
                    this.units = this.units.filter((unit) => unit.id !== id);
                    cache.setItem('units', this.units);
                }
                return response;
            } catch (error) {
                this.msg = error.message;
                this.status = error.status_code;
                return { success: false, status: this.status };
            }
        },

        async fetchUnitsComboBox() {
            try {
                const { data } = await getUnits();
                cache.setItem('units', data);
                this.units = data;
                const units = data.map((unit) => ({
                    label: unit.symbol.toUpperCase(),
                    value: unit.id
                }));
                return units;
            } catch (error) {
                this.msg = error.message;
                return null;
            } finally {
                this.loading = false;
            }
        },
        async uploadUnits(payload) {
            const dataUnits = payload.map((unit) => ({
                symbol: unit.symbol,
                name: unit.name
            }));

            const requestData = { units: dataUnits };

            try {
                const { data } = await uploadUnits(requestData);
                this.msg = data.message;
                return data;
            } catch (error) {
                console.log(error);
                this.msg = error.message;
                this.status = error.status_code;
                return this.status;
            }
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
