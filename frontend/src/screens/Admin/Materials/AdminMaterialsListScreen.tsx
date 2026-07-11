import { useEffect, useRef, useState } from "react";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { createMaterial, deleteMaterial, listMaterials, updateMaterial } from "../../../api/materials";
import { ApiError } from "../../../api/client";
import { Material, MaterialSection } from "../../../api/types";

const sections: MaterialSection[] = [
  "DARSLIKLAR",
  "MUHIM_QOLLANMALAR",
  "UMUMIY_SERTIFIKAT",
  "MAVZULASHGAN_SERTIFIKAT",
];

export function AdminMaterialsListScreen() {
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState<MaterialSection>("DARSLIKLAR");
  const [isPremium, setIsPremium] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => listMaterials({ all: true }).then(({ materials }) => setMaterials(materials));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !file) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createMaterial({ title: title.trim(), description: description.trim(), section, isPremium, file });
      setTitle("");
      setDescription("");
      setIsPremium(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (material: Material) => {
    await updateMaterial(material.id, { isPublished: !material.isPublished });
    load();
  };

  const togglePremium = async (material: Material) => {
    await updateMaterial(material.id, { isPremium: !material.isPremium });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Materialni o'chirishni tasdiqlaysizmi?")) return;
    setDeleteError(null);
    try {
      await deleteMaterial(id);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : uz.common.error);
    }
  };

  return (
    <div>
      <Header title={uz.admin.materialManagement} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          <p className="text-sm font-semibold">{uz.admin.createMaterial}</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={uz.admin.materialTitle}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={uz.admin.materialDescription}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.materialSection}</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as MaterialSection)}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {uz.materials[s]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
            {isPremium ? uz.materials.premium : uz.materials.free}
          </label>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.materialFile}</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs"
            />
          </div>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
          <Button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !description.trim() || !file}
            className="w-full"
          >
            {creating ? uz.admin.uploadingMaterial : uz.common.create}
          </Button>
        </Card>

        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        {materials?.length === 0 && <EmptyState />}
        <div className="space-y-2">
          {materials?.map((material) => (
            <Card key={material.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{material.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{uz.materials[material.section]}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={material.isPublished ? "success" : "neutral"}>
                    {material.isPublished ? uz.admin.published : uz.admin.draft}
                  </Badge>
                  <Badge tone={material.isPremium ? "warning" : "success"}>
                    {material.isPremium ? uz.materials.premium : uz.materials.free}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => togglePublish(material)}>
                  {material.isPublished ? uz.admin.unpublish : uz.admin.publish}
                </Button>
                <Button variant="secondary" onClick={() => togglePremium(material)}>
                  {material.isPremium ? uz.admin.makeFree : uz.admin.makePaid}
                </Button>
                <Button variant="danger" onClick={() => handleDelete(material.id)}>
                  {uz.common.delete}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
