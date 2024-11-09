import User from "../models/userModels.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import Notification from "../models/notificationModels.js";

let getProfile = async (req, res) => {
  try {
    let { id } = req.params;
    let user = await User.findById({ _id: id });

    if (!user) {
      res.status(400).json({ message: "User nor found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: "Error in get profile" });
  }
};

let followUnFollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(req.user._id);
    const userToModify = await User.findOne({ _id: id });

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User not found" });

    // Check if the current user is already following the user to modify
    const isFollowing = currentUser.following.includes(id);

    // If the current user is already following the user, unfollow them
    if (isFollowing) {
      // Remove the current user from the "followers" list of the user to modify
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });

      // Remove the user to modify from the current user's "following" list
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      // Send a success response to indicate the user has been unfollowed
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // If the current user is not following the user to modify, follow them

      // Add the current user to the "followers" list of the user to modify
      await User.findByIdAndUpdate(id, { $push: { followers: req.user.id } });

      // Add the user to modify to the current user's "following" list
      await User.findByIdAndUpdate(req.user.id, { $push: { following: id } });

      const notification = new Notification({
        from: req.user._id,
        to: userToModify._id,
        type: "follow",
      });
      await notification.save();

      // Send a success response to indicate the user has been followed
      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

let updateUser = async (req, res) => {
  try {
    // Destructure incoming request body to extract user details
    let { userName, fullName, email, currentPassword, newPassword, bio, link } =
      req.body;

    const { profileImg, coverImg } = req.body;

    // Get the user ID from the authenticated user's info (from JWT or session)
    let userID = req.user._id;

    // Find the user in the database by their ID
    let user = await User.findById(userID);

    // Check if both currentPassword and newPassword are provided (user wants to change password)
    if (currentPassword && newPassword) {
      // Compare the provided currentPassword with the user's existing password in the database
      let isMatch = await bcrypt.compare(currentPassword, user.password);

      // If the passwords don't match, return an error
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // If the currentPassword is correct, hash the newPassword using bcrypt
      let salt = await bcrypt.genSalt(10); // Generate salt
      let hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the new password

      if (profileImg) {
        if (user.profileImg) {
          // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
          await cloudinary.uploader.destroy(
            user.profileImg.split("/").pop().split(".")[0]
          );
        }
        let uploadedResponse = await cloudinary.uploder.upload(profileImg);
        profileImg = uploadedResponse.secure_url;
      }

      if (coverImg) {
        if (user.coverImg) {
          // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png

          await cloudinary.uploader.destroy(
            user.coverImg.split("/").pop().split(".")[0]
          );
        }
        let uploadedResponse = await cloudinary.uploder.upload(coverImg);
        coverImg = uploadedResponse.secure_url;
      }

      // Update the user's password with the hashed version
      user.password = hashedPassword;
      user.fullName = fullName || user.fullName;
      user.userName = userName || user.userName;
      user.email = email || user.email;
      user.bio = bio || user.bio;
      user.link = link || user.link;
      user.profileImg = profileImg || user.profileImg;
      user.coverImg = coverImg || user.coverImg;

      // Save the updated user details to the database
      await user.save();
      user.password = null;
      res
        .status(200)
        .json({ message: "User details and password updated successfully" });
    }
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);

    // Send an error response if something went wrong
    return res
      .status(400)
      .json({ message: "Error in updating user", error: error.message });
  }
};

export { getProfile, followUnFollowUser, updateUser };
