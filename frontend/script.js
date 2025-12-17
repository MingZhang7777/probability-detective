// 配置后端API基础地址 (请替换成你的真实Render地址)
const API_BASE_URL = 'https://prob-backend.onrender.com';

function showTeacherPanel() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <h1>👨‍🏫 教师控制面板</h1>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h3>创建实验</h3>
                            <input type="text" id="expName" class="form-control mb-3" placeholder="实验名称">
                            <input type="range" id="redProb" class="form-range mb-3" min="0.1" max="0.9" step="0.1" value="0.5">
                            <p>红牌概率: <span id="probValue">50%</span></p>
                            <button class="btn btn-primary" onclick="createExperiment()">创建实验</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h3>实验代码</h3>
                            <div id="expCode" class="display-4 text-center my-4">PROB-2024001</div>
                            <p>让学生访问这个网站，输入上面的代码参与</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createExperiment() {
    const code = 'PROB-' + new Date().getTime().toString().slice(-6);
    document.getElementById('expCode').textContent = code;
    alert('实验已创建！代码: ' + code);
}
