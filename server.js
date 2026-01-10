const express = require('express');
const app = express();
const port = 3000;

// Định nghĩa một tuyến đường (route) cơ bản
app.get('/', (req, res) => {
  res.send('Chào mừng bạn đến với dự án Express đầu tiên!');
});

// Lắng nghe các yêu cầu tại cổng 3000
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});