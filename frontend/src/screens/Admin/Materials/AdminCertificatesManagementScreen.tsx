import { uz } from "../../../i18n/uz";
import { AdminMaterialsPanel } from "./AdminMaterialsPanel";

export function AdminCertificatesManagementScreen() {
  return (
    <AdminMaterialsPanel
      title={uz.admin.certificatesManagement}
      sections={["UMUMIY_SERTIFIKAT", "MAVZULASHGAN_SERTIFIKAT"]}
    />
  );
}
