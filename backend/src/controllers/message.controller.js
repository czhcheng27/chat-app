import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, userSocketMap } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // 找到所有其他用户
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    // 查询每个用户和我之间的最新消息时间
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", loggedInUserId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
    ]);

    // 把结果转成 Map 形式：{ userId: lastMessageAt }
    const messageTimeMap = {};
    latestMessages.forEach((m) => {
      messageTimeMap[m._id.toString()] = m.lastMessageAt;
    });

    /**
     * 这里做一遍isOnline, sort, lastMessage 的排序等是为了当前用户刷新页面后
     * 能获得正确的 isOnline 等状态，因为如果只在前端 socket.on("getOnlineUsers"
     * 里做这个处理的话，那么就只有在 getOnlineUsers 发生变化时才会拿到正确的
     * isOnline 等状态，当前页面刷新时就只返回最基础的数据，所以要在此处也加上处理
     */
    // 把每个用户对象附加上 lastMessageAt
    const usersWithTimestamp = users
      .map((user) => ({
        ...user.toObject(),
        lastMessageAt: messageTimeMap[user._id.toString()] || null,
        isOnline: Object.keys(userSocketMap).includes(user._id.toString()),
      }))
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;

        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;

        return a.fullName.localeCompare(b.fullName);
      });

    res.status(200).json(usersWithTimestamp);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
