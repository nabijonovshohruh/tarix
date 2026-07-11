import { Link, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { uz } from "../../i18n/uz";
import { MaterialCategory, MaterialSection } from "../../api/types";

const sectionsByCategory: Record<MaterialCategory, MaterialSection[]> = {
  GUIDES: ["DARSLIKLAR", "MUHIM_QOLLANMALAR"],
  CERTIFICATES: ["UMUMIY_SERTIFIKAT", "MAVZULASHGAN_SERTIFIKAT"],
};

const categoryTitles: Record<MaterialCategory, string> = {
  GUIDES: uz.materials.guides,
  CERTIFICATES: uz.materials.certificates,
};

export function MaterialCategoryScreen() {
  const { category } = useParams<{ category: string }>();
  const cat = (category === "certificates" ? "CERTIFICATES" : "GUIDES") as MaterialCategory;
  const sections = sectionsByCategory[cat];

  return (
    <div>
      <Header title={categoryTitles[cat]} showBack />
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{uz.materials.selectSection}</p>
        {sections.map((section) => (
          <Link key={section} to={`/materials/section/${section}`}>
            <Card className="transition hover:border-brand-300 active:scale-[0.99]">
              <p className="font-semibold">{uz.materials[section]}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
