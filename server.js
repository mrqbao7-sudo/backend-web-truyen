const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối Database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kiểm tra xem backend đã chạy chưa
app.get('/', (req, res) => {
  res.send('Backend Web Truyện đang hoạt động ngon lành!');
});

// Khởi động server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở port ${PORT}`);
});
