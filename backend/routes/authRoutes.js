import express from "express";
import {
  login,
  signup,
  logout,
  gotme,
} from "../controllers/authControllers.js";
import { protectRoute } from "../middleWare/protectRoute.js";
let routes = express.Router();

routes.get("/login", login);
routes.get("/signup", signup);
routes.get("/logout", logout);
routes.get("/gotme", protectRoute, gotme);

export default routes;
