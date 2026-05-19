import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const api = axios.create({ baseURL: API_URL });

export const getList = (userId: string) =>
  api.get<{ products: string[] }>(`/list/${userId}`).then((r) => r.data.products);

export const addToList = (userId: string, product: string, pushToken: string) =>
  api.patch(`/list/${userId}/add`, { product, pushToken });

export const removeFromList = (userId: string, product: string) =>
  api.patch(`/list/${userId}/remove`, { product });

export const getDiscounts = () =>
  api.get('/products/discounts').then((r) => r.data);
