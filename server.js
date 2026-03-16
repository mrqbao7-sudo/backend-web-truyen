const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối Database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kết nối Não bộ AI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/', (req, res) => {
  res.send('Backend Web Truyện đang hoạt động!');
});

// API ĐẶC BIỆT: Ra lệnh cho AI tự viết chương mới
app.get('/api/ai/viet-chuong', async (req, res) => {
  try {
    // 1. Lấy thông tin truyện số 1 từ Database
    const novel = await pool.query('SELECT * FROM Novels WHERE id = 1');
    const summary = novel.rows[0].summary;
    const title = novel.rows[0].title;

    // 2. Đếm xem đã có bao nhiêu chương để viết chương tiếp theo
    const countQuery = await pool.query('SELECT COUNT(*) FROM Chapters WHERE novel_id = 1');
    const nextChapterNum = parseInt(countQuery.rows[0].count) + 1;

    // 3. Viết yêu cầu (Prompt) gửi cho AI
    const prompt = `Bạn là một đại thần viết truyện võng du/tiên hiệp. Hãy viết Chương ${nextChapterNum} cho bộ truyện mang tên "${title}" dựa trên tóm tắt sau: "${summary}". 
    Độ dài khoảng 800 - 1200 từ. Trình bày bằng tiếng Việt, có chia đoạn văn rõ ràng, văn phong lôi cuốn, kịch tính.`;

    // 4. Gọi OpenAI sinh nội dung (Dùng gpt-3.5-turbo cho nhanh và rẻ)
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo", 
    });

    const aiContent = completion.choices[0].message.content;
    const chapterTitle = `Chương ${nextChapterNum}: (AI Tự Đặt Tên)`;

    // 5. Lưu kết quả AI vừa viết vào Database
    await pool.query(
      'INSERT INTO Chapters (novel_id, chapter_number, title, content) VALUES ($1, $2, $3, $4)',
      [1, nextChapterNum, chapterTitle, aiContent]
    );

    res.send(`<h1>Thành công!</h1><p>AI đã viết và lưu xong Chương ${nextChapterNum}. Bạn có thể vào database kiểm tra.</p>`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Có lỗi xảy ra: ' + error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở port ${PORT}`);
});
