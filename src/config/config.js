// API Configuration
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

// Other configuration
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// API Endpoints
export const ENDPOINTS = {
    login: '/login',
    register: '/add-new-form',
    items: '/api/items',
    orders: '/api/orders',
    qrCodes: '/api/getQRCodes',
    downloadQR: '/api/downloadQRCodesPDF',
    forms: '/getForms',
    create: '/create',
    itemsEndSoon: '/api/itemsEndSoon',
};