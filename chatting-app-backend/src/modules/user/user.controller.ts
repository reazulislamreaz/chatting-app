import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { userService } from "./user.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { getParamId } from "../../utils/params";

export class UserController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, address, professional, religious, hobby, dateOfBirth } = req.body;

    const user = await userService.updateProfile(req.user!.userId, {
      name,
      address,
      professional,
      religious,
      hobby,
      dateOfBirth,
      imageFile: req.file,
    });

    res.json({ success: true, data: user });
  });

  listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as Record<string, string | undefined>;
    const search = query.search;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const result = await userService.listUsers(req.user!.userId, search, page, limit);
    res.json({ success: true, data: result });
  });

  getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userService.getUserById(getParamId(req.params.id));
    res.json({ success: true, data: user });
  });
}

export const userController = new UserController();
