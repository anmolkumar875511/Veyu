import { asyncHandler } from '../utils/asyncHandler.js';
import * as UserService from '../services/user.service.js';

export const updateMyProfile = asyncHandler(async (req, res) => {
    const data = await UserService.updateMyProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data });
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
    const data = await UserService.updateMyAvatar(req.user.id, req.file);
    res.status(200).json({ success: true, data });
});

export const listUsers = asyncHandler(async (req, res) => {
    const data = await UserService.listUsers(req.query);
    res.status(200).json({ success: true, data });
});

export const getUserDirectory = asyncHandler(async (req, res) => {
    const data = await UserService.getUserDirectory(req.query.role);
    res.status(200).json({ success: true, data });
});

export const getUserById = asyncHandler(async (req, res) => {
    const data = await UserService.getUserById(req.params.id);
    res.status(200).json({ success: true, data });
});

export const setUserActive = asyncHandler(async (req, res) => {
    const data = await UserService.setUserActive(req.params.id, req.body.isActive);
    res.status(200).json({ success: true, data });
});

export const changeUserRole = asyncHandler(async (req, res) => {
    const data = await UserService.changeUserRole(req.params.id, req.body.role);
    res.status(200).json({ success: true, data });
});
