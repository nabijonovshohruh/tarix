import { uz } from "../../../i18n/uz";
import { AdminMaterialsPanel } from "./AdminMaterialsPanel";

export function AdminGuidesManagementScreen() {
  return <AdminMaterialsPanel title={uz.admin.guidesManagement} sections={["DARSLIKLAR", "MUHIM_QOLLANMALAR"]} />;
}
