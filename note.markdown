联系人列表中用户排序规则：

1、在线用户在前面

2、在线用户中，与我最近聊天的排更前

3、离线用户也按最近聊天时间排

4、如果没有聊天记录，就按名字字母排序

Problem & Solve:
1、对于已经登录的用户来说，当有新用户登录时，他自己本身的 user list 要能及时进行更新，把新登录的用户显示在线并且按照既定排序需求显示在列表里。
A: 原本是想在后端 socket.js 文件新增广播（广播新用户上线） socket.broadcast.emit("newUserOnline", { userId });
然后前端接收 newUserOnline 并重新拉取 user 列表, 在 connectSocket() 中加一个监听：
防止高频触发 getUsers ，给 getUsers() 加一个简单的节流 throttle：

```js
let lastGetUsers = 0;
socket.on("newUserOnline", async ({ userId }) => {
  const now = Date.now();
  if (now - lastGetUsers > 3000) {
    lastGetUsers = now;
    await getUsers();
  }
});
```

这种“重新调用接口刷整个用户列表”的方式虽然准确，但确实带来 UI 闪烁 / 重排，体验不好，尤其是在数据不多的时候代价不值。
所以最终决定在 socket.on("getOnlineUsers", () => {}) 在这里当拿到 onlineUserIds 之后，对已有的 user list 进行处理，在线靠前，最近聊天靠前，按姓名排序等，
这样可以避免调用接口，以局部插入新用户，手动将这个新用户对象插入到 users 列表中，并排序，从而避免 UI 重置和闪烁。

// ---------------------------------------------------------------------------------------------

2、防止抖动：当用户刷新页面时会先 disconnect 然后再再次 connect，这样的话其他用户的 user list 就会出现此用户 offline 然后再马上 online 的情况，UI 会有抖动。

```js
socket.on("disconnect", () => {
  console.log("A user disconnected", socket.id);
  delete userSocketMap[userId];

  setTimeout(() => {
    // 如果用户已经重新连接了，就不 emit，为了优化用户列表在线状态的抖动
    if (userSocketMap[userId]) return;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }, 1500);
});
```

// ---------------------------------------------------------------------------------------------

3、之前 io.emit("getOnlineUsers", Object.keys(userSocketMap)); 逻辑只对“数据库已有用户”登录时有效，对“新注册用户”首次登录，其他人列表中不会实时出现这个新用户，需要刷新。
🧠 问题根本原因
socket.on("getOnlineUsers") 事件，只广播了在线用户的 ID 数组，前端再根据已有 users 列表打上 isOnline 标记并排序。
但如果某个用户是刚注册的新用户：

- 后端 io.emit("getOnlineUsers", [...]) 发的 ID 虽然包含了他；

- 但前端 users 列表里根本没这个人；

- 所以 map + includes + sort 根本没把这个新用户渲染出来。

A: 🔧 第一步： socket.js 修改 getOnlineUsers 的 emit 内容

```js
// emit helper
async function emitOnlineUsers() {
  const onlineUserIds = Object.keys(userSocketMap);

  try {
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds },
    }).select("-password");

    io.emit("getOnlineUsers", onlineUsers);
  } catch (error) {
    console.error("Failed to emit online users:", error);
  }
}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  await emitOnlineUsers();

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];

    setTimeout(() => {
      if (userSocketMap[userId]) return;
      emitOnlineUsers();
    }, 1500);
  });
});
```

🔧 第二步：前端 connectSocket 中接收 users 而不是 onlineUserIds

```js
socket.on("getOnlineUsers", (onlineUsers) => {
  const { users, setUsers } = useChatStore.getState();

  // 获取已有用户 ID 列表
  const existingUserIds = users.map((u) => u._id);

  // 将新用户合并进去（如果之前列表中没有）
  const mergedUsers = [...users];
  onlineUsers.forEach((user) => {
    const existing = users.find((u) => u._id === user._id);
    if (!existing) mergedUsers.push(user);
  });

  const updated = mergedUsers
    .map((user) => ({
      ...user,
      isOnline: onlineUsers.some((u) => u._id === user._id),
    }))
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;

      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;

      return a.fullName.localeCompare(b.fullName);
    });

  set({ onlineUsers: onlineUsers.map((u) => u._id) });
  setUsers(updated);
});
```

Conclusion: Problem: 新注册用户上线，旧用户看不到; Reason: 后端只发 ID，前端列表没这人; Solve: 后端发完整用户对象数组，前端合并进去

// ---------------------------------------------------------------------------------------------

4、统计未读数量
A:
后端：1、后端新增接口 router.patch("/mark-as-read/:id", protectRoute, markMessagesAsRead);
2、同时新增 getUsersForSidebar 内 unreadCount 的数量获取， 3、及为 messageSchema 新增 isRead 字段
这样当 sidebar 组件调用接口获取 user 列表时，返回的数据是带有 unreadCount 的统计的。

前端：
在 useChatStore 内的 getMessages 方法中，除了请求当前选中 user 的对话数据外，
还进行 api.patch(`/messages/mark-as-read/${userId}`) 请求，将数据库内的 isRead 置为 true 以及更新 unreadCount 数量。
另一方面，前端也需进行无感更新，即当点击选中列表中的 user 时，setSelectedUser 方法不光要设置 selectUser， 同时也要清除 unreadCount

```js
setSelectedUser: (selectedUser) => {
    const { users } = get();
    // 清除 unreadCount
    const updatedUsers = users.map((user) =>
      user._id === selectedUser?._id ? { ...user, unreadCount: 0 } : user
    );

    set({
      selectedUser,
      users: updatedUsers,
    });
  },
```

// ---------------------------------------------------------------------------------------------

5、未读数量的实时更新
A: 纯前端的活：删除原先 useChatStore 内的 subscribeToMessages， unsubscribeFromMessages， socket.on("newMessage" 的监听不在放在 subscribeToMessages 里，
因为 ✅ 当前没有选中用户时 ChatContainer 不渲染，subscribeToMessages 没有被调用，导致 socket 没有监听 newMessage，因此 Sidebar 上无法实时更新 unreadCount。

✅ 正确做法：socket.on("newMessage") 的注册应该 全局注册一次
在 useChatStore.ts 里建一个专门的监听函数 initMessageListener

```js
initMessageListener: () => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;

  // 防止重复监听
  socket.off("newMessage");

  socket.on("newMessage", (newMessage: Message) => {
    const { selectedUser, messages, users } = get();

    const isFromSelectedUser = selectedUser?._id === newMessage.senderId;

    if (isFromSelectedUser) {
      // 正在和这个用户聊天，追加消息
      set({ messages: [...messages, newMessage] });
    } else {
      // 更新 sidebar 的 unreadCount
      const updatedUsers = users.map((user) =>
        user._id === newMessage.senderId
          ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
          : user
      );
      set({ users: updatedUsers });
    }
  });
},

export default function App() {
  const initMessageListener = useChatStore((s) => s.initMessageListener);
  const socket = useAuthStore((s) => s.socket); // ✅ 响应式拿 socket

  useEffect(() => {
    if (socket) {
      initMessageListener();
    }
  }, [socket]); // ✅ 监听 socket 变化
}
```

✅ 为什么这么做更合理？
socket.on("newMessage") 是全局事件监听，不应该绑定在某个聊天窗口上（那是局部逻辑）

当前用户即使没有打开聊天窗口，Sidebar 的用户列表仍应实时显示 unreadCount

// ---------------------------------------------------------------------------------------------

6、当前用户选择一个还没发过消息的联系人（如 A），向 A 发送一条消息，发送成功后，左边列表没有更新排序或显示时间。
S:

1. 提炼排序逻辑为一个公共函数 sortUsers(users: AuthUser[])；满足排序逻辑的函数，这样在 connectSocket、sendMessage 等地方都能一致地调用排序。
2. sendMessage 中发送成功后更新 users 并调用 sortUsers
