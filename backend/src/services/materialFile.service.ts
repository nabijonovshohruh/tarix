import { Api, InputFile } from "grammy";
import { HttpError } from "../middleware/errorHandler";

// Files are never written to our own disk/storage — the upload is relayed
// straight through the bot (sendDocument into the uploading admin's own
// chat) so Telegram hosts it, and we only persist the returned file_id.
// The same file_id is then reusable by this bot to (re)send the document to
// any chat indefinitely (a Telegram Bot API guarantee), which is how
// downloads are served later — see materials.controller.ts's
// downloadMaterial.
export async function uploadMaterialFile(
  api: Api,
  adminTelegramId: bigint,
  buffer: Buffer,
  fileName: string
): Promise<{ fileId: string; fileName: string }> {
  try {
    const message = await api.sendDocument(Number(adminTelegramId), new InputFile(buffer, fileName));
    return { fileId: message.document.file_id, fileName: message.document.file_name ?? fileName };
  } catch (err) {
    console.error("Failed to relay material upload through the bot:", err);
    throw new HttpError(
      502,
      "Faylni Telegram orqali yuklab bo'lmadi. Botga /start yozganingizni tekshiring va qayta urinib ko'ring."
    );
  }
}

export async function deliverMaterialFile(
  api: Api,
  studentTelegramId: bigint,
  fileId: string,
  caption?: string
): Promise<void> {
  try {
    await api.sendDocument(Number(studentTelegramId), fileId, caption ? { caption } : undefined);
  } catch (err) {
    console.error("Failed to deliver material file via the bot:", err);
    throw new HttpError(
      502,
      "Faylni yuborib bo'lmadi. Botga /start yozganingizni tekshiring va qayta urinib ko'ring."
    );
  }
}
