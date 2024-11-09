import cloudinary from "cloudinary";

import User from "../models/userModels.js";
import Post from "../models/postmodels.js";
import Notification from "../models/notificationModels.js";

let createPost = async (req, res) => {
  try {
    const { text, img } = req.body;
    const userID = req.user._id;

    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img) {
      res.status(400).json({ error: "need image or text to post content" });
    }

    if (img) {
      let uploadedResponse = await cloudinary.uploder.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userID,
      text,
      img,
    });

    await newPost.save();
    res.status(200).json({ message: "Post Sucessfully created" });
  } catch (error) {
    // Log the error for debugging purposes
    res.status(500).json({ error: "An error occurred while createPost" });
  }
};

let deletePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      res
        .status(400)
        .json({ error: "You are not authorized to delete this post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    // Log the error for debugging purposes
    res.status(500).json({ error: "An error occurred while deletePost" });
  }
};

let commentPost = async (req, res) => {
  try {
    let { text } = req.body;

    const postId = req.params.id;

    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    let post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.comments.push({ text, user: userId });

    await post.save();

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "comment",
    });
    await notification.save();

    res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    // Log the error for debugging purposes
    res
      .status(500)
      .json({ error: "An error occurred while adding the comment" });
  }
};

let likePost = async (req, res) => {
  try {
    const { id: postId } = req.params; // Post ID from URL
    const userId = req.user._id; // Current logged-in user's ID

    // 1. Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // 2. Check if the user has already liked this post
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // 3. If the user already liked the post, remove the like (unlike)
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
      });

      // Update the user's likedPosts list to remove this post
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: postId },
      });

      return res.status(200).json({ message: "Post unliked" });
    } else {
      // 4. If the user hasn't liked the post yet, add the like
      await Post.findByIdAndUpdate(postId, {
        $push: { likes: userId },
      });

      // Update the user's likedPosts list to include this post
      await User.findByIdAndUpdate(userId, {
        $push: { likedPosts: postId },
      });

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      return res.status(200).json({ message: "Post liked" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

let getAllpost = async (req, res) => {
  try {
    let currentUserID = req.user._id;

    let post = await Post.find()
      .sort({ createdAt: -1 }) //to display last uploaded comment in first
      .populate({
        path: "user", //replace user id to userDetails
        select: "-password", //exclude the password field
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(post);
  } catch (error) {}
};

const getLikedPosts = async (req, res) => {
  // Extract the userId from the URL parameters.
  const userId = req.params.id;

  try {
    // Attempt to find the user by their unique userId.
    const user = await User.findById(userId);

    // If no user is found, respond with a 404 status code and a user not found message.
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch posts where the post ID is in the list of `likedPosts` of the user.
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      // Populate the "user" field in each post, excluding the "password" field in the populated user data.
      // user.likedPosts:  [
      //   new ObjectId('672dbccb305e4bb1ff13d466'),
      //   new ObjectId('672dbceb8c4b5f51ce3d773f')
      // ]
      .populate({
        path: "user", // The field to populate (the user who created the post)
        select: "-password", // Exclude the password field for privacy/security
      })
      // Populate the "comments.user" field in each post, again excluding the "password" field.
      .populate({
        path: "comments.user", // The field to populate (the user who commented)
        select: "-password", // Exclude the password field for privacy/security
      });

    // If posts are found, send them back in the response with a 200 status code.
    res.status(200).json(likedPosts);
  } catch (error) {
    // In case of an error (e.g., database issues, server issues), log it and send a 500 status code response.

    res.status(500).json({ error: "Internal server error" });
  }
};

const getFollowingPosts = async (req, res) => {
  try {
    // 1. Find the current user using their ID, which is obtained from the request object (req.user._id)
    let user = await User.findById(req.user._id);

    // 2. Get the list of users that the current user is following (user.following)
    let userFollow = user.following;

    // 3. Log the list of users being followed for debugging purposes

    // 4. Query the Post model to find posts where the 'user' field is in the 'userFollow' array
    // This returns all posts from users that the current user is following
    const followPost = await Post.find({ user: { $in: userFollow } })

      // 5. Populate the 'user' field of each post to get the full user details (excluding password for privacy/security)
      .populate({
        path: "user", // The field to populate, which corresponds to the user who created the post
        select: "-password", // Exclude the 'password' field from the populated user details for privacy/security reasons
      })

      // 6. Populate the 'comments.user' field to get the user who commented on the post, excluding their password as well
      .populate({
        path: "comments.user", // The path to populate, which corresponds to the user who made the comment
        select: "-password", // Exclude the 'password' field from the populated commenter's details
      });

    // 7. Once the posts are fetched and populated, send them back as a JSON response with a 200 HTTP status (OK)
    res.status(200).json(followPost);
  } catch (error) {
    // 8. If any error occurs during the process, handle it here (error handling is missing in the provided code)
    // You may want to log the error or return a response indicating failure.

    res
      .status(500)
      .json({ error: "An error occurred while fetching the posts." });
  }
};

const getUserPosts = async (req, res) => {
  let userID = req.params.id;
  try {
    const userPost = await Post.find({ user: { $in: userID } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(userPost);
  } catch (error) {
    res.status(400).json({ error: "Error in getting particular user post" });
  }
};

export {
  createPost,
  likePost,
  commentPost,
  deletePost,
  getAllpost,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
};
