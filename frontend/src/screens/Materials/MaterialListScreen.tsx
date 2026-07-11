import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { listMaterials } from "../../api/materials";
import { Material, MaterialSection } from "../../api/types";

export function MaterialListScreen() {
  const { section } = useParams<{ section: MaterialSection }>();
  const { isGuest } = useAuth();
  const [materials, setMaterials] = useState<Material[] | null>(null);

  useEffect(() => {
    if (!section) return;
    listMaterials({ section }).then(({ materials }) => setMaterials(materials));
  }, [section]);

  return (
    <div>
      <Header title={section ? uz.materials[section] : ""} showBack />
      <div className="space-y-3 p-4">
        {materials === null && <Spinner />}
        {materials?.length === 0 && <EmptyState message={uz.materials.noMaterials} />}
        {materials?.map((material) => {
          const locked = isGuest && material.isPremium;
          const content = (
            <Card
              className={`flex items-center justify-between transition ${
                locked ? "opacity-60" : "hover:border-brand-300 active:scale-[0.99]"
              }`}
            >
              <p className="font-semibold">{material.title}</p>
              <div className="flex items-center gap-2">
                <Badge tone={material.isPremium ? "warning" : "success"}>
                  {material.isPremium ? uz.materials.premium : uz.materials.free}
                </Badge>
                <span className="text-lg">{locked ? "🔒" : <span className="text-brand-500">→</span>}</span>
              </div>
            </Card>
          );

          if (locked) {
            return (
              <div key={material.id} aria-disabled="true" title={uz.materials.premiumLocked}>
                {content}
              </div>
            );
          }
          return (
            <Link key={material.id} to={`/materials/item/${material.id}`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
