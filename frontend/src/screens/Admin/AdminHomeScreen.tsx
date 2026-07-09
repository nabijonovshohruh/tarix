import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { uz } from "../../i18n/uz";
import { exportAnalytics } from "../../api/analytics";
import { downloadBlob } from "../../utils/downloadBlob";

const sections = [
  { to: "/admin/tests", icon: "📚", title: uz.admin.testManagement },
  { to: "/admin/attendance", icon: "🗓️", title: uz.admin.attendanceManagement },
  { to: "/admin/exams", icon: "📝", title: uz.admin.examManagement },
  { to: "/admin/students", icon: "👥", title: uz.admin.studentManagement },
];

export function AdminHomeScreen() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await exportAnalytics();
      downloadBlob(blob, filename);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Header title={uz.admin.title} />
      <div className="grid grid-cols-1 gap-3 p-4">
        {sections.map((section) => (
          <Link key={section.to} to={section.to}>
            <Card className="flex items-center gap-4 transition hover:border-brand-300 active:scale-[0.99]">
              <span className="text-3xl">{section.icon}</span>
              <p className="font-semibold">{section.title}</p>
            </Card>
          </Link>
        ))}

        <Card className="space-y-2">
          <p className="text-sm font-semibold">{uz.admin.reports}</p>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? uz.admin.exportingExcel : uz.admin.exportExcel}
          </Button>
        </Card>
      </div>
    </div>
  );
}
