// src/utils/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";



const PORT = "4000";


const API_URL = "http://192.168.0.9:4000"; 
console.log("API URL:", API_URL);

const api = {
  async getToken() {
    return await AsyncStorage.getItem("token");
  },

  async get(endpoint) {
    const token = await this.getToken();
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data;
  },

  async getTenantProfile() {
    const token = await this.getToken();
    if (!token) throw { status: 401, data: { message: "Unauthorized" } };
    const response = await fetch(`${API_URL}/tenants/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data.tenant;
  },

  async getInvoices() {
    return await this.get("/tenants/me/invoices");
  },

  async getConversations() {
    return await this.get("/messages/conversations");
  },

  async replyToConversation(conversationId, message) {
    return await this.post(`/messages/${conversationId}/reply`, { message });
  },

  async markConversationRead(conversationId) {
  return await this.put(`/messages/read-all/${conversationId}`);
},

async put(endpoint, body) {
  const token = await this.getToken();
  const url = `${this.getBaseUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
},

async getConversations() {
  return await this.get("/messages/conversations");
},

async replyToConversation(conversationId, message) {
  return await this.post(`/messages/${conversationId}/reply`, { message });
},

async replyWithAttachments(conversationId, formData) {
  const token = await this.getToken();
  const url = `${this.getBaseUrl()}/messages/${conversationId}/reply`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
},

  async replyWithAttachments(conversationId, formData) {
  const token = await this.getToken();
  const url = `${this.getBaseUrl()}/messages/${conversationId}/reply`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
},

async postFormData(endpoint, formData) {
  const token = await this.getToken();
  const url = `${this.getBaseUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
},

  async getInvoice(id) {
    return await this.get(`/tenants/me/invoices/${id}`);
  },

  async getPayments() {
    return await this.get("/tenants/me/payments");
  },

  async submitPayment(data) {
    return await this.post("/tenants/me/payments", data);
  },

  async getDashboard() {
    return await this.get("/tenants/me/dashboard");
  },

  getBaseUrl() {
    return API_URL;
  },

  async post(endpoint, body) {
    const token = await this.getToken();
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data;
  },

  async patch(endpoint, body) {
    const token = await this.getToken();
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data;
  },

  async delete(endpoint) {
    const token = await this.getToken();
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    const data = await response.json();
    if (!response.ok) throw { status: response.status, data };
    return data;
  },
};

export default api;