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
import { Material, MaterialSection, MaterialSubSection } from "../../api/types";

const grades: MaterialSubSection[] = [
  "GRADE_6",
  "GRADE_7_JAHON",
  "GRADE_7_UZBEKISTON",
  "GRADE_8_JAHON",
  "GRADE_8_UZBEKISTON",
  "GRADE_9_JAHON",
  "GRADE_9_UZBEKISTON",
  "GRADE_10_JAHON",
  "GRADE_10_UZBEKISTON",
  "GRADE_11_JAHON",
  "GRADE_11_UZBEKISTON",
];

export function MaterialListScreen() {
  const { section, subSection } = useParams<{ section: MaterialSection; subSection?: MaterialSubSection }>();
  const { isGuest } = useAuth();
  const [materials, setMaterials] = useState<Material[] | null>(null);

  // Only MAVZULASHGAN_SERTIFIKAT has a further grade/subject picker step —
  // every other section keeps its original flat list, mirroring Test's
  // Period/SubCategory relationship (see TestListScreen.tsx).
  const needsGradeChoice = section === "MAVZULASHGAN_SERTIFIKAT" && !subSection;

  useEffect(() => {
    if (!section || needsGradeChoice) return;
    listMaterials({ section, subSection }).then(({ materials }) => setMaterials(materials));
  }, [section, subSection, needsGradeChoice]);

  if (needsGradeChoice) {
    return (
      <div>
        <Header title={section ? uz.materials[section] : ""} showBack />
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{uz.materials.selectGrade}</p>
          {grades.map((grade) => (
            <Link key={grade} to={`/materials/section/${section}/${grade}`}>
              <Card className="transition hover:border-brand-300 active:scale-[0.99]">
                <p className="font-semibold">{uz.materials[grade]}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const title = section ? uz.materials[section] : "";
  const subtitle = subSection ? uz.materials[subSection] : undefined;

  return (
    <div>
      <Header title={title} subtitle={subtitle} showBack />
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
