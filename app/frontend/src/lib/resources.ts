import { api, getToken } from './api';
import type { Pricing } from './constants';

export type { Pricing };

export interface Profile {
  id: string;
  companyName: string;
  cui: string;
  regCom?: string;
  address?: string;
  city?: string;
  judet?: string;
  tipActivitate?: string;
  ansvsaAuthorization?: string;
  email: string;
  phone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  adminName?: string;
  adminIdSeries?: string;
  adminIdNumber?: string;
  workpointsAllowed: number;
  contractExpiresAt?: string;
  adminComplete: boolean;
}

export interface Workpoint {
  _id: string;
  denumire?: string;
  address: string;
  tipActivitate: string;
  contactPerson?: string;
  contactPhone?: string;
  sanitaryAuthNumber: string;
  hasContract: boolean;
}

export type ContractStatus = 'Draft' | 'Semnat' | 'Anulat' | 'Expirat';

export interface Contract {
  _id: string;
  status: ContractStatus;
  contractNo?: string;
  series?: string;
  number?: number;
  signedAt?: string;
  expiresAt?: string;
  createdAt: string;
  workpointIds: string[];
  snapshot: {
    company: { companyName: string };
    workpoints: { address: string }[];
  };
}

export const getProfile = () => api.get<Profile>('/profile').then((r) => r.data);
export const updateProfile = (data: Partial<Profile>) =>
  api.patch<Profile>('/profile', data).then((r) => r.data);

export const listWorkpoints = () =>
  api.get<Workpoint[]>('/workpoints').then((r) => r.data);
export const createWorkpoint = (data: Partial<Workpoint>) =>
  api.post<Workpoint>('/workpoints', data).then((r) => r.data);
export const updateWorkpoint = (id: string, data: Partial<Workpoint>) =>
  api.patch<Workpoint>(`/workpoints/${id}`, data).then((r) => r.data);
export const deleteWorkpoint = (id: string) =>
  api.delete(`/workpoints/${id}`).then((r) => r.data);

export const listContracts = () =>
  api.get<Contract[]>('/contracts').then((r) => r.data);
export const generateContract = (workpointIds: string[]) =>
  api.post<Contract>('/contracts/generate', { workpointIds }).then((r) => r.data);
export const getContractText = (id: string) =>
  api.get<{ text: string }>(`/contracts/${id}/text`).then((r) => r.data.text);
export const getContractHtml = (id: string) =>
  api.get<{ html: string }>(`/contracts/${id}/html`).then((r) => r.data.html);
export const editContract = (id: string, workpointIds: string[]) =>
  api.patch<Contract>(`/contracts/${id}`, { workpointIds }).then((r) => r.data);
export const deleteContract = (id: string) =>
  api.delete(`/contracts/${id}`).then((r) => r.data);
export const signContract = (id: string, signature: string) =>
  api.post<Contract>(`/contracts/${id}/sign`, { signature }).then((r) => r.data);
export const cancelContract = (id: string) =>
  api.post<Contract>(`/contracts/${id}/cancel`).then((r) => r.data);

export type OrderStatus = 'Plasată' | 'Confirmată' | 'Onorată' | 'Anulată';

export interface Order {
  _id: string;
  orderNo: string;
  status: OrderStatus;
  workpointId: string;
  desiredDate: string;
  timeInterval?: string;
  wasteName: string;
  origin: string;
  sncuCategory: string;
  estimatedQuantityKg: number;
  exactAddress: string;
  productState: string;
  accountingValue?: number;
  countryOfOrigin?: string;
  producer?: string;
  distributor?: string;
  packagingType: string;
  activity?: string;
  sanitaryAuthNumber?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  csvDoc?: string;
  observations?: string;
  companyName?: string;
  cui?: string;
  estimatedCost?: number;
  createdAt: string;
}

export const listOrders = () => api.get<Order[]>('/orders').then((r) => r.data);
export const createOrder = (data: Record<string, unknown>) =>
  api.post<Order>('/orders', data).then((r) => r.data);
export const cancelOrder = (id: string, reason?: string) =>
  api.post<Order>(`/orders/${id}/cancel`, { reason }).then((r) => r.data);

/** Descarcă un PDF protejat (contract sau comandă) și declanșează salvarea. */
async function downloadPdf(path: string, fallback: string) {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Descărcare eșuată');
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') ?? '';
  const filename = cd.match(/filename="([^"]+)"/)?.[1] ?? fallback;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const downloadContractPdf = (id: string) =>
  downloadPdf(`/api/contracts/${id}/pdf`, `contract-${id}.pdf`);
export const downloadOrderPdf = (id: string) =>
  downloadPdf(`/api/orders/${id}/pdf`, `comanda-${id}.pdf`);

/* ─────────── ANAF ─────────── */

export interface AnafCompany {
  cui: string;
  companyName: string;
  regCom: string;
  address: string;
  city: string;
  judet: string;
  codPostal: string;
}

export const lookupAnaf = (cui: string) =>
  api
    .get<AnafCompany>(`/anaf/${encodeURIComponent(cui.trim())}`)
    .then((r) => r.data);

/* ─────────── PLATĂ ─────────── */

export interface PaymentConfig {
  publishableKey: string;
  mock: boolean;
  pricing: Pricing;
}

export interface CreateIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  mock: boolean;
  amount: number;
}

export const getPaymentConfig = () =>
  api.get<PaymentConfig>('/payments/config').then((r) => r.data);
export const createPaymentIntent = (data: Record<string, unknown>) =>
  api.post<CreateIntentResult>('/payments/create-intent', data).then((r) => r.data);
export const mockConfirmPayment = (paymentIntentId: string) =>
  api.post('/payments/mock-confirm', { paymentIntentId }).then((r) => r.data);

/* ─────────── ADMIN ─────────── */

export interface AdminClient {
  id: string;
  companyName: string;
  cui: string;
  contactPerson: string;
  email: string;
  phone?: string;
  contractId: string | null;
  contractNo: string | null;
  contractStatus: string | null;
  accountStatus: string;
  paymentType: string;
  createdAt: string;
  contractExpiresAt?: string;
}

export interface AdminContract {
  id: string;
  companyName: string;
  cui: string;
  contractNo?: string;
  workpointsCount: number;
  status: string;
  signedAt?: string;
  createdAt: string;
  expiresAt?: string;
  canCancel: boolean;
}

export interface AdminOrder {
  id: string;
  orderNo: string;
  companyName?: string;
  cui?: string;
  sncuCategory: string;
  estimatedQuantityKg: number;
  observations?: string;
  status: OrderStatus;
  createdAt: string;
  estimatedCost?: number;
}

export interface Settings {
  contractSeries: string;
  orderSeries: string;
  contractStartDate: string;
  contractTemplateUrl: string;
  orderTemplateUrl: string;
  pvTemplateUrl: string;
  contractTemplateText: string;
}

export const adminListClients = () =>
  api.get<AdminClient[]>('/admin/clients').then((r) => r.data);
export const adminCreateClient = (data: Record<string, unknown>) =>
  api.post('/admin/clients', data).then((r) => r.data);
export const adminImpersonate = (id: string) =>
  api.post<{ accessToken: string; user: any }>(`/admin/clients/${id}/impersonate`).then((r) => r.data);
export const adminGetClient = (id: string) =>
  api.get<Profile>(`/admin/clients/${id}`).then((r) => r.data);
export const adminUpdateClient = (id: string, data: Record<string, unknown>) =>
  api.patch(`/admin/clients/${id}`, data).then((r) => r.data);

export const adminListContracts = () =>
  api.get<AdminContract[]>('/admin/contracts').then((r) => r.data);
export const adminCancelContract = (id: string) =>
  api.post(`/admin/contracts/${id}/cancel`).then((r) => r.data);
export const adminGetContractText = (id: string) =>
  api.get<{ text: string }>(`/admin/contracts/${id}/text`).then((r) => r.data.text);
export const adminGetContractHtml = (id: string) =>
  api.get<{ html: string }>(`/admin/contracts/${id}/html`).then((r) => r.data.html);

export const adminListOrders = () =>
  api.get<AdminOrder[]>('/admin/orders').then((r) => r.data);
export const adminClientWorkpoints = (clientId: string) =>
  api.get<Workpoint[]>(`/admin/clients/${clientId}/workpoints`).then((r) => r.data);
export const adminCreateOrder = (data: Record<string, unknown>) =>
  api.post('/admin/orders', data).then((r) => r.data);
export const adminGetOrder = (id: string) =>
  api.get<Order>(`/admin/orders/${id}`).then((r) => r.data);
export const adminUpdateOrder = (id: string, data: Record<string, unknown>) =>
  api.patch(`/admin/orders/${id}`, data).then((r) => r.data);
export const adminSetOrderStatus = (id: string, status: string, note?: string) =>
  api.patch(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data);
export const adminSetOrderCost = (id: string, estimatedCost: number) =>
  api.patch(`/admin/orders/${id}/cost`, { estimatedCost }).then((r) => r.data);

export const adminGetSettings = () =>
  api.get<Settings>('/admin/settings').then((r) => r.data);
export const adminUpdateSettings = (data: Partial<Settings>) =>
  api.patch<Settings>('/admin/settings', data).then((r) => r.data);

export const downloadAdminContractPdf = (id: string) =>
  downloadPdf(`/api/admin/contracts/${id}/pdf`, `contract-${id}.pdf`);
export const downloadAdminOrderPdf = (id: string) =>
  downloadPdf(`/api/admin/orders/${id}/pdf`, `comanda-${id}.pdf`);
