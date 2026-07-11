import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { getMaterial, downloadMaterial } from "../../api/materials";
import { ApiError } from "../../api/client";
import { MaterialDetail } from "../../api/types";

export function MaterialDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { isGuest } = useAuth();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMaterial(id).then(({ material }) => setMaterial(material));
  }, [id]);

  if (!material) return <Spinner />;

  const locked = isGuest && material.isPremium;

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadMaterial(id);
      setDelivered(true);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <Header title={material.title} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{material.title}</p>
            <Badge tone={material.isPremium ? "warning" : "success"}>
              {material.isPremium ? uz.materials.premium : uz.materials.free}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
            {material.description}
          </p>

          {locked ? (
            <p className="text-sm text-red-500">{uz.materials.premiumLocked}</p>
          ) : (
            <>
              <Button onClick={handleDownload} disabled={downloading} className="w-full">
                {downloading ? uz.materials.downloading : uz.materials.download}
              </Button>
              {delivered && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{uz.materials.delivered}</p>
              )}
              {downloadError && <p className="text-sm text-red-500">{downloadError}</p>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
