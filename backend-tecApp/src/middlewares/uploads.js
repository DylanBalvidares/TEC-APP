import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOADS_DIR || path.resolve("uploads");

// En tests el import no debe crear directorios del entorno (p. ej. UPLOADS_DIR
// de db/.env apunta a /app/uploads). Fuera de test se crea si falta.
if (process.env.NODE_ENV !== "test" && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "noticia-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (formatosPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("El archivo no es una imagen válida, formato no válido"),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
