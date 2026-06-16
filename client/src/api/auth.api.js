import { apiClient } from "./axios.instance.js";

export async function registerApi(dto) {
  const { data } = await apiClient.post("/auth/register", dto);
  return data.data;
}

export async function loginApi(dto) {
  const { data } = await apiClient.post("/auth/login", dto);
  return data.data;
}

export async function refreshApi() {
  const { data } = await apiClient.post("/auth/refresh");
  return data.data;
}

export async function logoutApi() {
  await apiClient.post("/auth/logout");
}

export async function getMeApi() {
  const { data } = await apiClient.get("/auth/me");
  return data.data;
}

export async function changePasswordApi(dto) {
  const { data } = await apiClient.patch("/auth/password", dto);
  return data;
}

export async function createStaffApi(dto) {
  const { data } = await apiClient.post("/auth/staff", dto);
  return data.data;
}

export function parseAuthError(err) {
  if (err.response?.data?.errors?.length > 0) {
    return err.response.data.errors[0].message;
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  if (!err.response) {
    return "Network error. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}