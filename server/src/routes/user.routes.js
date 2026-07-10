import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';
import { uploadAvatarImage } from '../config/cloudinary.js';
import {
    validateUpdateProfile,
    validateListQuery,
    validateDirectoryQuery,
    validateSetActive,
    validateChangeRole,
    validateMongoIdParam,
    validate,
} from '../validators/user.validators.js';

const router = Router();

router.use(protect);

router.patch('/me', validateUpdateProfile, validate, UserController.updateMyProfile);
router.patch('/me/avatar', uploadAvatarImage, UserController.uploadMyAvatar);

router.get(
    '/directory',
    requireRole('officer', 'admin'),
    validateDirectoryQuery,
    validate,
    UserController.getUserDirectory
);

router.get('/', requireRole('admin'), validateListQuery, validate, UserController.listUsers);
router.get(
    '/:id',
    requireRole('admin'),
    validateMongoIdParam('id'),
    validate,
    UserController.getUserById
);
router.patch(
    '/:id/active',
    requireRole('admin'),
    validateMongoIdParam('id'),
    validateSetActive,
    validate,
    UserController.setUserActive
);
router.patch(
    '/:id/role',
    requireRole('admin'),
    validateMongoIdParam('id'),
    validateChangeRole,
    validate,
    UserController.changeUserRole
);

export default router;
