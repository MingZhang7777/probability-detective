const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 存储实验数据
let experiments = {};

app.get('/api/experiments', (req, res) => {
    res.json(experiments);
});

app.post('/api/experiments', (req, res) => {
    const { name, redProbability } = req.body;
    const code = 'PROB-' + Date.now().toString().slice(-6);
    
    experiments[code] = {
        code,
        name,
        redProbability,
        participants: [],
        redCount: 0,
        blackCount: 0,
        yesCount: 0,
        noCount: 0,
        status: 'active'
    };
    
    res.json({ success: true, code });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
