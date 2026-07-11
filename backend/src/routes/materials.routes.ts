import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { materialUpload } from "../middleware/materialUpload";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
} from "../controllers/materials.controller";

export const materialsRouter = Router();

// List/detail browsing stays open to any authenticated role (including
// guest) — description is always visible ("display description first");
// only downloadMaterial enforces the premium gate.
materialsRouter.get("/materials", asyncHandler(listMaterials));
materialsRouter.get("/materials/:id", asyncHandler(getMaterial));
materialsRouter.post(
  "/materials",
  requireRole("admin"),
  materialUpload.single("file"),
  asyncHandler(createMaterial)
);
materialsRouter.put(
  "/materials/:id",
  requireRole("admin"),
  materialUpload.single("file"),
  asyncHandler(updateMaterial)
);
materialsRouter.delete("/materials/:id", requireRole("admin"), asyncHandler(deleteMaterial));

// Open to any authenticated role — assertMaterialAccess() inside the
// controller enforces the premium gate for guests on a per-resource basis
// (role-only gating can't express "allowed only for this specific material").
materialsRouter.post("/materials/:id/download", asyncHandler(downloadMaterial));
