import jwt from "jsonwebtoken";

export const generateToken = (userID, res) => {
  try {
    const token = jwt.sign({ userID }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set the token in a cookie
    res.cookie("jwt", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      httpOnly: true, // Prevent client-side access
      sameSite: true,
      secure: process.env.NODE_ENV !== "development", // Use true if served over HTTPS
    });

    return token; // Optional: return the token if needed
  } catch (error) {
    console.error("Error generating token: ", error);
    throw new Error("Error generating token");
  }
};
