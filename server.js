const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 対戦ルーム管理
const rooms = {};

io.on('connection', (socket) => {
  console.log('接続:', socket.id);

  // ルーム作成・参加
  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], state: null };
    }
    const room = rooms[roomId];

    if (room.players.length >= 2) {
      socket.emit('roomFull');
      return;
    }

    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit('joinedRoom', { playerIndex: room.players.length - 1, roomId });

    if (room.players.length === 2) {
      io.to(roomId).emit('gameStart', {
        players: room.players.map(p => p.name)
      });
    }
  });

  // カードプレイ・ターン終了などのゲームアクション
  socket.on('gameAction', (action) => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.to(roomId).emit('opponentAction', action);
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      io.to(roomId).emit('opponentDisconnected');
      delete rooms[roomId];
    }
    console.log('切断:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`妖忘記サーバー起動 → http://localhost:${PORT}`);
});
