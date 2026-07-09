import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { getStudentDetail, updateStudent } from "../../../api/students";
import { ApiError } from "../../../api/client";
import { DbRole, Student, StudentDashboard } from "../../../api/types";

const activityIcon = { test: "📚", exam: "📝", attendance: "🗓️" } as const;
const roleOptions: DbRole[] = ["GUEST", "STUDENT", "ADMIN"];
const roleLabels: Record<DbRole, string> = {
  GUEST: uz.admin.roleGuest,
  STUDENT: uz.admin.roleStudent,
  ADMIN: uz.admin.roleAdmin,
};

export function AdminStudentDetailScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [role, setRole] = useState<DbRole>("GUEST");
  const [groupName, setGroupName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudentDetail(studentId).then((data) => {
      setStudent(data.student);
      setDashboard(data.dashboard);
      setRole(data.student.role);
      setGroupName(data.student.groupName ?? "");
    });
  }, [studentId]);

  if (!student || !dashboard) return null;

  const handleSaveRole = async () => {
    if (!studentId) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const { student } = await updateStudent(studentId, { role, groupName: groupName.trim() || null });
      setStudent(student);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header title={student.fullName} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">{uz.admin.role}:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as DbRole)}
              className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </div>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={`${uz.admin.groupName} (${uz.admin.groupNamePlaceholder})`}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          {role === "STUDENT" && !groupName.trim() && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{uz.admin.groupRequiredForStudent}</p>
          )}
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {saved && <p className="text-xs text-emerald-600 dark:text-emerald-400">{uz.admin.roleSaved}</p>}
          <Button
            onClick={handleSaveRole}
            disabled={saving || (role === "STUDENT" && !groupName.trim())}
            className="w-full"
          >
            {uz.admin.saveRole}
          </Button>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.testsCompleted}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.testsCompleted}</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.averageScore}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.averageScore}</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.attendancePercentage}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.attendancePercentage}</p>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.dashboard.examResults}</h2>
          {dashboard.examResults.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {dashboard.examResults.map((r) => (
              <Card key={r.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium">{r.exam?.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{r.percentage}%</span>
                  <Badge tone={r.status === "PASSED" ? "success" : "danger"}>
                    {r.status === "PASSED" ? uz.exams.passed : uz.exams.failed}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.dashboard.recentActivity}</h2>
          {dashboard.recentActivity.length === 0 && <EmptyState message={uz.dashboard.noActivity} />}
          <div className="space-y-2">
            {dashboard.recentActivity.map((item, i) => (
              <Card key={i} className="flex items-center gap-3 py-2.5">
                <span>{activityIcon[item.type]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(item.createdAt).toLocaleString("uz-UZ")}
                  </p>
                </div>
                {item.percentage !== undefined && <span className="text-sm">{item.percentage}%</span>}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
