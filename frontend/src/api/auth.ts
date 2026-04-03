/**
 * Auth API — signup, login, logout, me, password reset, team invitations
 */

import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
}

export interface AuthOrganization {
  id: string;
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  organization: AuthOrganization | null;
}

export interface MeResponse {
  authenticated: boolean;
  user?: AuthUser;
  organization?: AuthOrganization | null;
}

export async function signup(data: {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/signup', data, { withCredentials: true });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/login', { email, password }, { withCredentials: true });
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout', {}, { withCredentials: true });
}

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient.get('/api/auth/me', { withCredentials: true });
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/api/auth/reset-password', { token, password });
}

export async function inviteMember(email: string, role: string = 'member'): Promise<void> {
  await apiClient.post('/api/auth/invite-member', { email, role }, { withCredentials: true });
}

export async function acceptInvite(data: {
  token: string;
  password: string;
  full_name: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/accept-invite', data, { withCredentials: true });
  return res.data;
}
