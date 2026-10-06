import { api } from './api';

export const submitContact = async (payload: { name: string; email: string; message: string; phone?: string }) => {
  return api('/api/contact', {
    method: 'POST',
    body: payload,
  });
};
