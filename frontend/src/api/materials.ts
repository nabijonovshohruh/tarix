import { get, put, del, post, postForm } from "./client";
import { Material, MaterialDetail, MaterialSection } from "./types";

export const listMaterials = (params?: { section?: MaterialSection; all?: boolean }) => {
  const query = new URLSearchParams();
  if (params?.section) query.set("section", params.section);
  if (params?.all) query.set("all", "true");
  const qs = query.toString();
  return get<{ materials: Material[] }>(`/materials${qs ? `?${qs}` : ""}`);
};

export const getMaterial = (id: string) => get<{ material: MaterialDetail }>(`/materials/${id}`);

export const createMaterial = (data: {
  title: string;
  description: string;
  section: MaterialSection;
  isPremium: boolean;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("section", data.section);
  formData.append("isPremium", String(data.isPremium));
  formData.append("file", data.file);
  return postForm<{ material: MaterialDetail }>("/materials", formData);
};

export const updateMaterial = (
  id: string,
  data: Partial<{ title: string; description: string; section: MaterialSection; isPremium: boolean; isPublished: boolean }>
) => put<{ material: MaterialDetail }>(`/materials/${id}`, data);

export const deleteMaterial = (id: string) => del(`/materials/${id}`);

export const downloadMaterial = (id: string) => post<{ delivered: boolean }>(`/materials/${id}/download`);
