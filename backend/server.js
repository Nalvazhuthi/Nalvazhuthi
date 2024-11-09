import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import connectDB from "./db/connectDB.js";

import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let app = express();
app.use(express.json());
app.use(cookieParser()); // Add this line to parse cookies

let port = process.env.PORT;

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/post", postRoutes);
app.use("/notification", notificationRoutes);

app.listen(port, () => {
  connectDB();
  console.log("listening to port ", port);
});
