import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { deleteCertificateTest, listCertificateTests, updateCertificateTest } from "../../../api/certificates";
import { CertificateTest } from "../../../api/types";

export function AdminCertificateTestsListScreen() {
  const [tests, setTests] = useState<CertificateTest[] | null>(null);

  const load = () => {
    listCertificateTests().then(({ tests }) => setTests(tests));
  };
  useEffect(load, []);

  const togglePublish = async (t: CertificateTest) => {
    await updateCertificateTest(t.id, { isPublished: !t.isPublished });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Testni o'chirishni tasdiqlaysizmi?")) return;
    await deleteCertificateTest(id);
    load();
  };

  return (
    <div>
      <Header title={uz.admin.certificateTestManagement} showBack />
      <div className="space-y-3 p-4">
        <Link to="/admin/certificate-tests/new">
          <Button className="w-full">{uz.admin.createCertificateTest}</Button>
        </Link>

        {tests?.length === 0 && <EmptyState />}
        {tests?.map((t) => (
          <Card key={t.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{t.title}</p>
              <div className="flex shrink-0 gap-1">
                <Badge tone={t.isPublished ? "success" : "neutral"}>
                  {t.isPublished ? uz.admin.published : uz.admin.draft}
                </Badge>
                {t.resultsReleasedAt && <Badge tone="success">{uz.admin.resultsReleased}</Badge>}
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {uz.admin.testCode}:{" "}
              <span className="font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.testCode}
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t._count?.questions ?? 0} {uz.tests.questionsCount}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => togglePublish(t)}>
                {t.isPublished ? uz.admin.unpublish : uz.admin.publish}
              </Button>
              <Link to={`/admin/certificate-tests/${t.id}/results`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  {uz.admin.viewResults}
                </Button>
              </Link>
              <Button variant="danger" onClick={() => handleDelete(t.id)}>
                {uz.common.delete}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
