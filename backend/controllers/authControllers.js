import User from "../models/userModels.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

let signup = async (req, res) => {
  try {
    let { userName, fullName, email, password } = req.body;
    console.log('userName, fullName, email, password: ', userName, fullName, email, password);

    // Check for null or empty userName
    if (!userName || userName.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "UserName is required and cannot be empty." });
    }

    // Email validation
    let emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // Check if email or userName already exists
    let existEmail = await User.findOne({ email });
    let existUserName = await User.findOne({ userName });

    if (existEmail || existUserName) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
    }

    // Hash password
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    let newUser = new User({
      userName,
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate token for authentication (if using JWT)
      generateToken(newUser._id, res);

      // Save user to the database
      await newUser.save();
      console.log("newUser: ", newUser);

      return res.status(201).json({ message: "User created successfully!" });
    }
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

let login = async (req, res) => {
  let { userName, password } = req.body;
  let user = await User.findOne({ userName });
  if (!user) {
    res.status(400).json({ error: "no user found" });
  }
  let isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!user || !isPasswordCorrect) {
    res.status(400).json({ error: "invalid userName or password" });
  }
  generateToken(user._id, res);
  res.status(200).json({ message: "Login success" });
};

let logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(400).json({ error: "Logout error" });
  }
};

let gotme = async (req, res) => {
  try {
    // Log the user ID

    let user = await User.findOne({ _id: req.user._id }).select("-password");

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    res.status(200).json({ message: user });
  } catch (err) {
    // Log the error
    res.status(400).json({ error: "Not a valid user" });
  }
};

export { signup, login, logout, gotme };
