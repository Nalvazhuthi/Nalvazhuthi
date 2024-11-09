import express from "express";
import {
  getNotification,
  deleteNotifications,
} from "../controllers/notificationController.js";
import { protectRoute } from "../middleWare/protectRoute.js";
let routes = express.Router();

routes.get("/", protectRoute, getNotification);
routes.delete("/", protectRoute, deleteNotifications);

export default routes;
