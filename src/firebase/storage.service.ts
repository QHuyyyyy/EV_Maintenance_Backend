import { storage } from './firebase.config';

export class FirebaseStorageService {
    private bucket = storage.bucket();

    /**
     * Upload file to Firebase Storage
     * @param file - The file buffer or multer file
     * @param fileName - Optional custom file name
     * @param folder - Optional folder path
     * @returns Promise with download URL
     */
    async uploadFile(
        file: Buffer | Express.Multer.File,
        fileName?: string,
        folder: string = 'images'
    ): Promise<string> {
        try {
            let fileBuffer: Buffer;
            let originalName: string;
            let contentType: string;

            if (Buffer.isBuffer(file)) {
                fileBuffer = file;
                originalName = fileName || `file_${Date.now()}`;
                contentType = 'application/octet-stream';
            } else {
                // file is Express.Multer.File
                fileBuffer = Buffer.from(file.buffer);
                originalName = file.originalname;
                contentType = file.mimetype;
            }

            // Tạo tên file theo pattern của alert-backend: timestamp-originalname
            const uniqueFileName = fileName || `${Date.now()}-${originalName}`;
            const filePath = `${folder}/${uniqueFileName}`;

            const fileUpload = this.bucket.file(filePath);

            // Upload file
            await fileUpload.save(fileBuffer, {
                metadata: {
                    contentType: contentType,
                },
                public: true,
                validation: 'md5'
            });

            // Get download URL
            const [url] = await fileUpload.getSignedUrl({
                action: 'read',
                expires: '03-09-2491' // Very far future date
            });

            return url;
        } catch (error) {
            console.error('Error uploading file to Firebase Storage:', error);
            throw new Error('Failed to upload file');
        }
    }

    /**
     * Upload multiple files
     * @param files - Array of files
     * @param folder - Optional folder path
     * @returns Promise with array of download URLs
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder: string = 'images'
    ): Promise<string[]> {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file, undefined, folder));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Error uploading multiple files:', error);
            throw new Error('Failed to upload files');
        }
    }

    /**
     * Get file download URL
     * @param filePath - Path to the file in storage
     * @returns Download URL
     */
    async getFileUrl(filePath: string): Promise<string> {
        try {
            const [url] = await this.bucket.file(filePath).getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
            return url;
        } catch (error) {
            console.error('Error getting file URL:', error);
            throw new Error('Failed to get file URL');
        }
    }
}

export default new FirebaseStorageService();