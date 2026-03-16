const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối Database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối Não bộ AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send('Backend Web Truyện đang hoạt động!');
});

// API Lấy danh sách truyện cho Frontend
app.get('/api/truyen', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chapters WHERE novel_id = 1 ORDER BY chapter_number DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu truyện' });
  }
});

// API ĐẶC BIỆT: Ra lệnh cho Gemini viết chương mới
app.get('/api/ai/viet-chuong', async (req, res) => {
  try {
    const novel = await pool.query('SELECT * FROM novels WHERE id = 1');
    const summary = novel.rows[0].summary;
    const title = novel.rows[0].title;

    const countQuery = await pool.query('SELECT COUNT(*) FROM chapters WHERE novel_id = 1');
    const nextChapterNum = parseInt(countQuery.rows[0].count) + 1;

    const prompt = `Bạn là một đại thần viết truyện võng du/tiên hiệp. Hãy viết Chương ${nextChapterNum} cho bộ truyện mang tên "${title}" dựa trên tóm tắt sau: "${summary}". 
    Độ dài khoảng 800 - 1200 từ. Trình bày bằng tiếng Việt, có chia đoạn văn rõ ràng, văn phong lôi cuốn, kịch tính. Chỉ trả về nội dung truyện, không cần giải thích thêm.`;

    // Gọi Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const aiContent = result.response.text();

    const chapterTitle = `Chương ${nextChapterNum}: (AI Tự Đặt Tên)`;

    await pool.query(
      'INSERT INTO chapters (novel_id, chapter_number, title, content) VALUES ($1, $2, $3, $4)',
      [1, nextChapterNum, chapterTitle, aiContent]
    );

    res.send(`<h1>Thành công mỹ mãn!</h1><p>Gemini AI đã viết và lưu xong Chương ${nextChapterNum}.</p>`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Có lỗi xảy ra: ' + error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở port ${PORT}`);
});
