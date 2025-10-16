import multer from 'multer';
import { Request } from 'express';

// Cấu hình multer để lưu file trong memory
const storage = multer.memoryStorage();

// Kiểm tra file type
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Chỉ cho phép các file ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
        files: 1 // Chỉ cho phép 1 file
    }
});

export default upload;