// ==================== 全局配置 ====================
// 【重要】请将下面的 YOUR_RENDER_BACKEND_URL 替换成你实际的Render后端地址
// 例如：const API_BASE_URL = 'https://prob-backend.onrender.com';
const API_BASE_URL = 'https://your-render-backend-url.onrender.com';
// =================================================

// 全局状态
let currentView = 'home';
let currentExperimentCode = null;
let currentStudentId = null;
let pollInterval = null;

// ==================== 主页面函数 ====================
function showTeacherPanel() {
    currentView = 'teacher';
    renderTeacherView();
}

function showStudentPanel() {
    currentView = 'student';
    renderStudentView();
}

function goHome() {
    currentView = 'home';
    currentExperimentCode = null;
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    renderHomeView();
}

// ==================== 教师端逻辑 ====================
function renderTeacherView() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>👨‍🏫 教师控制面板</h1>
                <button class="btn btn-outline-secondary" onclick="goHome()">返回首页</button>
            </div>
            
            <div class="row">
                <!-- 左侧：创建实验 -->
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h3>创建新实验</h3>
                            <div class="mb-3">
                                <label class="form-label">实验名称</label>
                                <input type="text" id="expName" class="form-control" placeholder="例如：周三1班全概率实验">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">红牌理论概率：<span id="probValue">50%</span></label>
                                <input type="range" id="redProb" class="form-range" min="10" max="90" step="10" value="50" oninput="updateProbValue(this.value)">
                            </div>
                            <button class="btn btn-primary w-100" onclick="createExperiment()">创建实验</button>
                        </div>
                    </div>
                    
                    <!-- 实验代码显示 -->
                    <div class="card shadow mt-4" id="expCodeCard" style="display:none;">
                        <div class="card-body text-center">
                            <h3>实验代码</h3>
                            <div id="expCodeDisplay" class="display-4 text-primary my-3">PROB-123456</div>
                            <p class="text-muted">让学生访问此网站，在<b>学生端</b>输入此代码加入实验</p>
                            <button class="btn btn-success" onclick="copyExperimentCode()">📋 复制代码</button>
                        </div>
                    </div>
                </div>
                
                <!-- 右侧：实验监控 -->
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h3>实验监控</h3>
                            <div class="mb-3">
                                <label class="form-label">输入实验代码查看实时数据</label>
                                <div class="input-group">
                                    <input type="text" id="monitorCode" class="form-control" placeholder="输入实验代码">
                                    <button class="btn btn-outline-primary" onclick="startMonitoring()">开始监控</button>
                                </div>
                            </div>
                            
                            <div id="experimentData">
                                <p class="text-muted text-center my-5">请先创建实验或输入实验代码开始监控</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateProbValue(value) {
    document.getElementById('probValue').textContent = value + '%';
}

async function createExperiment() {
    const name = document.getElementById('expName').value.trim();
    const redProbability = parseInt(document.getElementById('redProb').value) / 100;
    
    if (!name) {
        alert('请输入实验名称');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experiments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, redProbability })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentExperimentCode = data.code;
            document.getElementById('expCodeDisplay').textContent = data.code;
            document.getElementById('expCodeCard').style.display = 'block';
            document.getElementById('monitorCode').value = data.code;
            startMonitoring(); // 自动开始监控
            alert(`实验创建成功！代码：${data.code}`);
        } else {
            alert('创建失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        console.error('创建实验错误:', error);
        alert('网络错误，请检查后端连接');
    }
}

async function startMonitoring() {
    const code = document.getElementById('monitorCode').value.trim();
    if (!code) {
        alert('请输入实验代码');
        return;
    }
    
    currentExperimentCode = code;
    
    // 清除之前的轮询
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    
    // 立即获取一次数据
    await fetchExperimentData();
    
    // 开始轮询（每3秒更新一次）
    pollInterval = setInterval(fetchExperimentData, 3000);
}

async function fetchExperimentData() {
    if (!currentExperimentCode) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experiments/${currentExperimentCode}`);
        if (response.status === 404) {
            document.getElementById('experimentData').innerHTML = `
                <div class="alert alert-warning">
                    实验不存在或已结束
                </div>
            `;
            clearInterval(pollInterval);
            return;
        }
        
        const experiment = await response.json();
        updateExperimentDisplay(experiment);
    } catch (error) {
        console.error('获取数据错误:', error);
    }
}

function updateExperimentDisplay(exp) {
    const totalParticipants = exp.participants.length;
    const totalDraws = exp.redCount + exp.blackCount;
    const totalAnswers = exp.yesCount + exp.noCount;
    
    document.getElementById('experimentData').innerHTML = `
        <h4>${exp.name}</h4>
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5>📊 参与情况</h5>
                        <p>参与学生：<span class="badge bg-primary">${totalParticipants}人</span></p>
                        <p>红牌概率：<span class="badge bg-danger">${(exp.redProbability * 100).toFixed(0)}%</span></p>
                        <p>实验状态：<span class="badge ${exp.status === 'active' ? 'bg-success' : 'bg-secondary'}">${exp.status === 'active' ? '进行中' : '已结束'}</span></p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5>🎲 抽牌统计</h5>
                        <p>总抽牌次数：${totalDraws}</p>
                        <p>红牌：${exp.redCount}次 (${totalDraws > 0 ? ((exp.redCount/totalDraws*100).toFixed(1)) : 0}%)</p>
                        <p>黑牌：${exp.blackCount}次 (${totalDraws > 0 ? ((exp.blackCount/totalDraws*100).toFixed(1)) : 0}%)</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="card mt-3">
            <div class="card-body">
                <h5>❓ 答题统计</h5>
                <p>总答题次数：${totalAnswers}</p>
                <p>回答"是"：${exp.yesCount}次 (${totalAnswers > 0 ? ((exp.yesCount/totalAnswers*100).toFixed(1)) : 0}%)</p>
                <p>回答"否"：${exp.noCount}次 (${totalAnswers > 0 ? ((exp.noCount/totalAnswers*100).toFixed(1)) : 0}%)</p>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-danger" onclick="stopMonitoring()">停止监控</button>
            <small class="text-muted ms-2">最后更新：${new Date().toLocaleTimeString()}</small>
        </div>
    `;
}

function stopMonitoring() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    document.getElementById('experimentData').innerHTML = `
        <p class="text-muted text-center my-5">监控已停止</p>
    `;
}

function copyExperimentCode() {
    const code = document.getElementById('expCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('代码已复制到剪贴板！');
    });
}

// ==================== 学生端逻辑 ====================
function renderStudentView() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>👩‍🎓 学生实验端</h1>
                <button class="btn btn-outline-secondary" onclick="goHome()">返回首页</button>
            </div>
            
            <div class="row">
                <!-- 左侧：加入实验 -->
                <div class="col-md-4">
                    <div class="card shadow">
                        <div class="card-body">
                            <h3>加入实验</h3>
                            <div class="mb-3">
                                <label class="form-label">请输入教师提供的实验代码</label>
                                <input type="text" id="inputCode" class="form-control" placeholder="例如：PROB-123456" maxlength="12">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">你的姓名（可选）</label>
                                <input type="text" id="studentName" class="form-control" placeholder="用于教师识别，默认为学生1、学生2...">
                            </div>
                            <button class="btn btn-success w-100 mb-3" onclick="joinExperiment()">加入实验</button>
                            
                            <div id="expInfo" style="display:none;">
                                <hr>
                                <h5>当前实验</h5>
                                <p id="currentExpName" class="fw-bold"></p>
                                <p>红牌概率：<span id="currentProb" class="badge bg-danger"></span></p>
                                <p>你的ID：<span id="studentIdDisplay" class="badge bg-secondary"></span></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 右侧：实验操作区 -->
                <div class="col-md-8">
                    <div id="experimentArea" style="display:none;">
                        <div class="card shadow mb-4">
                            <div class="card-body text-center">
                                <h3>🃏 抽牌环节</h3>
                                <div class="my-4">
                                    <div id="cardResult" style="font-size: 100px; min-height: 120px;">🎴</div>
                                    <p id="cardText" class="mt-2">点击下方按钮抽取一张牌</p>
                                </div>
                                <button class="btn btn-warning btn-lg" onclick="drawCard()">抽取一张牌</button>
                            </div>
                        </div>
                        
                        <div class="card shadow">
                            <div class="card-body text-center">
                                <h3>❓ 回答问题</h3>
                                <p class="mb-3">根据你抽到的牌，回答以下问题：<br><em>"这张牌是红色的吗？"</em></p>
                                <div class="btn-group my-3" role="group">
                                    <button class="btn btn-outline-primary btn-lg" onclick="submitAnswer('yes')" id="btnYes" disabled>是</button>
                                    <button class="btn btn-outline-danger btn-lg" onclick="submitAnswer('no')" id="btnNo" disabled>否</button>
                                </div>
                                <p id="answerStatus" class="mt-3"></p>
                            </div>
                        </div>
                        
                        <div class="mt-4 text-center">
                            <button class="btn btn-outline-info" onclick="resetMyExperiment()">重新开始（新抽牌）</button>
                        </div>
                    </div>
                    
                    <div id="waitingArea" class="text-center my-5">
                        <p class="text-muted">请先加入一个实验以开始</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function joinExperiment() {
    const code = document.getElementById('inputCode').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    
    if (!code) {
        alert('请输入实验代码');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experiments/${code}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentExperimentCode = code;
            currentStudentId = data.studentId || Date.now();
            
            // 显示实验信息
            document.getElementById('expInfo').style.display = 'block';
            document.getElementById('currentExpName').textContent = data.experiment.name;
            document.getElementById('currentProb').textContent = (data.experiment.redProbability * 100).toFixed(0) + '%';
            document.getElementById('studentIdDisplay').textContent = currentStudentId;
            
            // 显示实验操作区
            document.getElementById('experimentArea').style.display = 'block';
            document.getElementById('waitingArea').style.display = 'none';
            
            alert('成功加入实验！');
        } else {
            alert('加入失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        console.error('加入实验错误:', error);
        alert('网络错误，请检查实验代码和后端连接');
    }
}

async function drawCard() {
    if (!currentExperimentCode || !currentStudentId) {
        alert('请先加入实验');
        return;
    }
    
    // 随机决定红牌或黑牌（实际应由后端根据概率决定）
    const isRed = Math.random() < 0.5; // 这里简化，实际应使用实验设置的概率
    const card = isRed ? 'red' : 'black';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experiments/${currentExperimentCode}/draw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: currentStudentId, card })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 更新界面
            const cardSymbol = isRed ? '♥️' : '♣️';
            document.getElementById('cardResult').textContent = cardSymbol;
            document.getElementById('cardText').innerHTML = `你抽到了: <strong>${isRed ? '红' : '黑'}色牌</strong>`;
            
            // 启用答题按钮
            document.getElementById('btnYes').disabled = false;
            document.getElementById('btnNo').disabled = false;
            document.getElementById('answerStatus').innerHTML = '<span class="text-info">请回答下方问题</span>';
        }
    } catch (error) {
        console.error('抽牌错误:', error);
        alert('抽牌失败');
    }
}

async function submitAnswer(answer) {
    if (!currentExperimentCode || !currentStudentId) {
        alert('请先加入实验并抽牌');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experiments/${currentExperimentCode}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: currentStudentId, answer })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const answerText = answer === 'yes' ? '是' : '否';
            document.getElementById('answerStatus').innerHTML = `
                <span class="text-success">
                    ✅ 答案提交成功！<br>
                    你的回答是"<strong>${answerText}</strong>"。
                </span>
            `;
            
            // 禁用按钮防止重复提交
            document.getElementById('btnYes').disabled = true;
            document.getElementById('btnNo').disabled = true;
        }
    } catch (error) {
        console.error('提交答案错误:', error);
        alert('提交答案失败');
    }
}

function resetMyExperiment() {
    // 重置本地状态
    document.getElementById('cardResult').textContent = '🎴';
    document.getElementById('cardText').textContent = '点击下方按钮抽取一张牌';
    document.getElementById('btnYes').disabled = true;
    document.getElementById('btnNo').disabled = true;
    document.getElementById('answerStatus').textContent = '';
}

// ==================== 初始化 ====================
function renderHomeView() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="text-center mb-5">
                <h1 class="display-4">🎲 概率侦探</h1>
                <p class="lead">全概率公式互动教学平台</p>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card teacher-card shadow">
                        <div class="card-body text-center">
                            <h2>👨‍🏫 教师端</h2>
                            <p>创建实验，管理学生，查看实时数据</p>
                            <button class="btn btn-primary" onclick="showTeacherPanel()">进入教师端</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card student-card shadow">
                        <div class="card-body text-center">
                            <h2>👩‍🎓 学生端</h2>
                            <p>参与实验，学习全概率公式</p>
                            <button class="btn btn-success" onclick="showStudentPanel()">进入学生端</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-5">
                <p class="text-muted">系统状态：<span id="systemStatus" class="badge bg-success">正常</span></p>
                <small class="text-muted">后端地址：${API_BASE_URL}</small>
            </div>
        </div>
    `;
}

// 页面加载时显示首页
renderHomeView();
