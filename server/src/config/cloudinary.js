import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const complaintStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'nagarik/complaints',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
    },
});

export const uploadComplaintImage = multer({
    storage: complaintStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Only JPG, PNG, and WEBP images are accepted.'));
    },
}).single('image');

export async function deleteCloudinaryImage(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.warn('[Cloudinary] Failed to delete asset:', publicId, err.message);
    }
}

export { cloudinary };
