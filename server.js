//URL: http://localhost:3000
const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('combined'));
const port = 3000;

// Định nghĩa một tuyến đường (route) cơ bản
app.get('/', (req, res) => {
  // res.send('<h3>Chào mừng đến với Ứng dụng Express!</h3>');
  res.sendStatus(200)
});

app.get('/user/:id/name/:name', (req, res) => {
  res.send({ status: 'OK', timestamp: new Date() });
});

// Lắng nghe các yêu cầu tại cổng 3000
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});