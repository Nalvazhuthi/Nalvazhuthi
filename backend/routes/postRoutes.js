import express from "express";
import {
  createPost,
  likePost,
  commentPost,
  deletePost,
  getAllpost,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
} from "../controllers/postControllers.js";
import { protectRoute } from "../middleWare/protectRoute.js";

let routes = express.Router();

routes.get("/all", protectRoute, getAllpost);
routes.get("/getLikedPost/:id", protectRoute, getLikedPosts);
routes.get("/following", protectRoute, getFollowingPosts);
routes.get("/user/:id", protectRoute, getUserPosts);

routes.post("/create", protectRoute, createPost);
routes.post("/delete/:id", protectRoute, deletePost);
routes.post("/comment/:id", protectRoute, commentPost);
routes.post("/like/:id", protectRoute, likePost);

export default routes;
