const multer = require("multer");
const path = require("path");

// Configuração de Armazenamento (Onde e Como salvar)
const storage = multer.diskStorage({
  // 1. Onde salvar?
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Caminho da pasta que você criou
  },
  // 2. Com que nome salvar?
  filename: (req, file, cb) => {
    // Estratégia Sênior: Timestamp + Nome original para evitar conflito
    // Ex: 16789999_foto.jpg
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filtro de Arquivo (Segurança Básica)
// Para impedir que alguém suba um vírus (.exe) em vez de foto
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/pjpeg", "image/png", "image/gif"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB (Evita travar o server)
  },
});

module.exports = upload;
