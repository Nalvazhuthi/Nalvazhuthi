import Notification from "../models/notificationModels.js";

let getNotification = async (req, res) => {
  try {
    let userID = req.user.id;

    const notifications = await Notification.find({ to: userID }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userID }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ error: "error in getting notification" });
  }
};

const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotifications function", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { getNotification, deleteNotifications };
