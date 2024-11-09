import mongoose from "mongoose";

let connectDB = () => {
  try {
    mongoose.connect(process.env.MONGO_URl);
    console.log("DataBase connected");
  } catch (error) {
    console.log("Error in Connecting DB");
    process.exit(1);
  }
};

export default connectDB;
