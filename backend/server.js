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

// 学生加入实验
app.post('/api/experiments/:code/join', (req, res) => {
    const { code } = req.params;
    const { studentName } = req.body;
    
    if (!experiments[code]) {
        return res.status(404).json({ error: '实验不存在' });
    }
    
    experiments[code].participants.push({
        id: Date.now(),
        name: studentName || `学生${experiments[code].participants.length + 1}`,
        card: null,
        answer: null
    });
    
    res.json({ success: true, experiment: experiments[code] });
});

// 学生提交抽牌结果
app.post('/api/experiments/:code/draw', (req, res) => {
    const { code } = req.params;
    const { studentId, card } = req.body; // card: 'red' 或 'black'
    
    const experiment = experiments[code];
    if (!experiment) return res.status(404).json({ error: '实验不存在' });
    
    const student = experiment.participants.find(p => p.id === studentId);
    if (!student) return res.status(404).json({ error: '学生未找到' });
    
    student.card = card;
    // 更新统计
    if (card === 'red') experiment.redCount++;
    if (card === 'black') experiment.blackCount++;
    
    res.json({ success: true, experiment });
});

// 学生提交问题答案
app.post('/api/experiments/:code/answer', (req, res) => {
    const { code } = req.params;
    const { studentId, answer } = req.body; // answer: 'yes' 或 'no'
    
    const experiment = experiments[code];
    if (!experiment) return res.status(404).json({ error: '实验不存在' });
    
    const student = experiment.participants.find(p => p.id === studentId);
    if (!student) return res.status(404).json({ error: '学生未找到' });
    
    student.answer = answer;
    // 更新统计
    if (answer === 'yes') experiment.yesCount++;
    if (answer === 'no') experiment.noCount++;
    
    res.json({ success: true, experiment });
});

// 获取单个实验的详细信息（教师端实时轮询）
app.get('/api/experiments/:code', (req, res) => {
    const { code } = req.params;
    if (experiments[code]) {
        res.json(experiments[code]);
    } else {
        res.status(404).json({ error: '实验不存在' });
    }
});
