import multer from "multer";
import path from "path";

// 1. Configurar dónde y cómo se guardan los archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/app/uploads"); // La carpeta interna vinculada al volumen de Docker
  },
  filename: (req, file, cb) => {
    // Evitamos colisiones usando un timestamp único + la extensión original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "noticia-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// 2. Filtrar para que solo acepten imágenes
const fileFilter = (req, file, cb) => {
  const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (formatosPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("El archivo no es una imagen válida, formato no válido"),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por imagen
});

export default upload;
