import express from "express";
import {
  followUnFollowUser,
  getProfile,
  updateUser,
} from "../controllers/userController.js";
import { protectRoute } from "../middleWare/protectRoute.js";
let routes = express.Router();

routes.get("/:id", protectRoute, getProfile);
routes.post("/follow/:id", protectRoute, followUnFollowUser);
routes.post("/updateUser", protectRoute, updateUser);

export default routes;
