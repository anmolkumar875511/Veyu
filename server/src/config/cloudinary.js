import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { logger } from '../utils/logger.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function cloudinaryStorageEngine({ folder, transformation }) {
    return {
        _handleFile(_req, file, cb) {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, transformation, resource_type: 'image' },
                (err, result) => {
                    if (err) return cb(err);
                    cb(null, {
                        path: result.secure_url,
                        filename: result.public_id,
                        size: result.bytes,
                    });
                }
            );
            file.stream.on('error', (err) => uploadStream.destroy(err));
            file.stream.pipe(uploadStream);
        },
        _removeFile(_req, _file, cb) {
            cb(null);
        },
    };
}

function createImageUploader({ folder, transformation, fieldName, maxSizeMB }) {
    return multer({
        storage: cloudinaryStorageEngine({ folder, transformation }),
        limits: { fileSize: maxSizeMB * 1024 * 1024 },
        fileFilter(_req, file, cb) {
            if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
            cb(new Error('Only JPG, PNG, and WEBP images are accepted.'));
        },
    }).single(fieldName);
}

export const uploadComplaintImage = createImageUploader({
    folder: 'veyu/complaints',
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
    fieldName: 'image',
    maxSizeMB: 8,
});

export const uploadObservationImage = createImageUploader({
    folder: 'veyu/observations',
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
    fieldName: 'image',
    maxSizeMB: 8,
});

export const uploadCompletionImage = createImageUploader({
    folder: 'veyu/completions',
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
    fieldName: 'image',
    maxSizeMB: 8,
});

export const uploadAvatarImage = createImageUploader({
    folder: 'veyu/avatars',
    transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ],
    fieldName: 'avatar',
    maxSizeMB: 4,
});

export async function deleteCloudinaryImage(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        logger.warn('Cloudinary', `Failed to delete asset ${publicId}: ${err.message}`);
    }
}

export { cloudinary };
