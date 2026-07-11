import multer from "multer";

// Separate from the shared `upload` (5MB, sized for Excel bulk-uploads) —
// guides/certificates are PDFs and can be much larger. Capped below
// Telegram's 50MB bot-upload ceiling since every file is relayed through
// sendDocument (see materialFile.service.ts).
export const materialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 45 * 1024 * 1024 },
});
