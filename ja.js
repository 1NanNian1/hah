// 游戏常量
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const CHARACTER_SIZE = Math.min(GAME_WIDTH * 0.08, 60); // 角色大小
const ENEMY_MIN_SIZE = Math.min(GAME_WIDTH * 0.06, 40); // 敌人最小大小
const ENEMY_MAX_SIZE = Math.min(GAME_WIDTH * 0.1, 60); // 敌人最大大小
const SKILL_SIZE = Math.min(GAME_WIDTH * 0.07, 50); // 技能牌大小
const ITEM_SIZE = Math.min(GAME_WIDTH * 0.07, 50); // 道具大小
const BULLET_SIZE = Math.min(GAME_WIDTH * 0.03, 20); // 子弹大小
const WAVE_INTERVAL = 15000; // 波次间隔15秒
const ENEMY_SPAWN_INTERVAL = 500; // 敌人生成间隔0.5秒
const ITEM_SPAWN_INTERVAL = 10000; // 道具生成间隔10秒
const OBSTACLE_COUNT_PER_CHUNK = 5; // 每个区块的障碍物数量
const CHUNK_SIZE = 1000; // 区块大小

// 游戏状态
let gameState = 'start'; // start, playing, gameOver, upgrade, levelUp
let currentWave = 1; // 当前波次
let score = 0; // 得分
let highScore = localStorage.getItem('adventureHighScore') || 0; // 最高分
let coins = 0; // 金币
let isPaused = false; // 游戏暂停状态
let experience = 0; // 经验值
let levelUpChoices = []; // 升级词条选择

// 波次控制变量
let totalEnemiesThisWave = 0;
let enemiesSpawnedThisWave = 0;
let lastEnemySpawnTime = 0;

// 障碍物数组和已生成区块
let obstacles = [];
let generatedChunks = new Set();

// 相机
let camera = {
    x: 0,
    y: 0,
};

// 角色状态
let character = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    speed: 3, // 移动速度
    baseSpeed: 3, // 新增：基础速度，用于重置
    health: 100, // 生命值
    maxHealth: 100, // 最大生命值
    direction: { x: 0, y: 0 }, // 移动方向
    lastDirection: { x: 1, y: 0 }, // 新增：最后一次的移动方向
    weapon: 'pistol', // 当前武器
    weaponLevel: 1, // 武器等级
    skillCooldown: {
        speed: 0, // 速度技能冷却
        heal: 0 // 治疗技能冷却
    },
    skillLevel: 1, // 技能等级
    characterLevel: 1, // 角色等级
    canShoot: true, // 能否射击
    shield: false, // 新增：护盾状态
    experience: 0, // 经验值
    experienceToNext: 100, // 升级所需经验
    criticalChance: 0.15 // 新增：暴击率
};

// 武器数据
const weapons = {
    pistol: {
        name: "手枪",
        icon: "fa-handgun",
        damage: 12, // 基础伤害
        fireRate: 400, // 射击间隔(毫秒)
        bulletSpeed: 12, // 子弹速度
        bulletColor: "#3B82F6", // 子弹颜色
        unlockCost: 0, // 解锁价格
        upgradeCost: [50, 100, 150, 200], // 升级价格
        upgradeDamage: [12, 18, 25, 35], // 升级后伤害
        upgradeFireRate: [400, 350, 300, 250], // 升级后射击间隔
        isUnlocked: true // 是否已解锁
    },
    bow: {
        name: "弓箭",
        icon: "fa-bow",
        damage: 25,
        fireRate: 1200,
        bulletSpeed: 15,
        bulletColor: "#10B981",
        unlockCost: 100,
        upgradeCost: [70, 140, 210, 280],
        upgradeDamage: [25, 35, 45, 60],
        upgradeFireRate: [1200, 1000, 800, 600],
        isUnlocked: false
    },
    rifle: {
        name: "步枪",
        icon: "fa-rifle",
        damage: 18,
        fireRate: 200,
        bulletSpeed: 20,
        bulletColor: "#F59E0B",
        unlockCost: 200,
        upgradeCost: [60, 120, 180, 240],
        upgradeDamage: [18, 25, 32, 40],
        upgradeFireRate: [200, 150, 120, 100],
        isUnlocked: false
    },
    flamethrower: {
        name: "喷火器",
        icon: "fa-fire",
        damage: 8,
        fireRate: 150,
        bulletSpeed: 8,
        bulletColor: "#EF4444",
        unlockCost: 300,
        upgradeCost: [80, 160, 240, 320],
        upgradeDamage: [8, 12, 16, 20],
        upgradeFireRate: [150, 120, 100, 80],
        isUnlocked: false
    },
    lightning: {
        name: "雷电",
        icon: "fa-bolt",
        damage: 40,
        fireRate: 3000,
        bulletSpeed: 25,
        bulletColor: "#F59E0B",
        unlockCost: 400,
        upgradeCost: [100, 200, 300, 400],
        upgradeDamage: [40, 55, 70, 90],
        upgradeFireRate: [3000, 2500, 2000, 1500],
        isUnlocked: false
    },
    windwheel: {
        name: "风火轮",
        icon: "fa-wind",
        damage: 15,
        fireRate: 800,
        bulletSpeed: 18,
        bulletColor: "#8B5CF6",
        unlockCost: 500,
        upgradeCost: [120, 240, 360, 480],
        upgradeDamage: [15, 22, 30, 40],
        upgradeFireRate: [800, 650, 500, 400],
        isUnlocked: false
    },
    dart: {
        name: "飞镖",
        icon: "fa-dart",
        damage: 20,
        fireRate: 1000,
        bulletSpeed: 22,
        bulletColor: "#10B981",
        unlockCost: 600,
        upgradeCost: [90, 180, 270, 360],
        upgradeDamage: [20, 30, 40, 55],
        upgradeFireRate: [1000, 800, 600, 450],
        isUnlocked: false
    }
};

// 当前使用的武器
let currentWeapon = weapons.pistol;

// 敌人数组
let enemies = [];

// 子弹数组
let bullets = [];

// 新增：敌人子弹数组
let enemyBullets = [];

// 技能牌数组
let skills = [];

// 新增：道具数组和生成计时器
let items = [];
let lastItemSpawnTime = 0;

// 摇杆控制
let joystick = {
    x: 0,
    y: 0,
    radius: 0,
    isDragging: false
};

// 射击计时器
let lastShotTime = 0;

// 获取DOM元素
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverCard = document.getElementById('game-over-card');
const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeScreen = document.getElementById('upgrade-screen');
const closeUpgradeBtn = document.getElementById('close-upgrade');
const waveDisplay = document.getElementById('wave-display');
const coinsDisplay = document.getElementById('coins-display');
const weaponDisplay = document.getElementById('weapon-display');
const weaponIcon = document.getElementById('weapon-icon');
const weaponName = document.getElementById('weapon-name');
const weaponLevel = document.getElementById('weapon-level');
const skillBtns = document.querySelectorAll('.skill-btn');
const weaponBtns = document.querySelectorAll('.weapon-btn');
const finalWave = document.getElementById('final-wave');
const finalScore = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const currentCoins = document.getElementById('current-coins');
const currentWeaponLevel = document.getElementById('current-weapon-level');
const currentSkillLevel = document.getElementById('current-skill-level');
const currentCharacterLevel = document.getElementById('current-character-level');
const weaponUpgradeCost = document.getElementById('weapon-upgrade-cost');
const skillUpgradeCost = document.getElementById('skill-upgrade-cost');
const characterUpgradeCost = document.getElementById('character-upgrade-cost');
const upgradeWeaponBtn = document.getElementById('upgrade-weapon-btn');
const upgradeSkillBtn = document.getElementById('upgrade-skill-btn');
const upgradeCharacterBtn = document.getElementById('upgrade-character-btn');
const upgradeCoinsDisplay = document.getElementById('upgrade-coins-display');
const weaponShopContainer = document.getElementById('weapon-shop-container');
const upgradeWeaponName = document.getElementById('upgrade-weapon-name');
const nextWeaponDamage = document.getElementById('next-weapon-damage');
const nextWeaponFireRate = document.getElementById('next-weapon-firerate');
const joystickContainer = document.getElementById('joystick-container');
const joystickDot = document.getElementById('joystick-dot');

// 设置画布尺寸
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 事件监听
startGameBtn.addEventListener('click', () => {
    // 隐藏开始界面，显示游戏界面
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // 重置游戏状态并开始第一波
    resetGame();
    
    // 开始游戏循环
    gameLoop();
});

restartGameBtn.addEventListener('click', () => {
    // 重置游戏状态
    resetGame();
    
    // 隐藏结束界面，显示游戏界面
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // 开始游戏循环
    gameLoop();
});

upgradeBtn.addEventListener('click', () => {
    gameState = 'upgrade';
    isPaused = true;
    updateUpgradeUI();
    upgradeScreen.style.display = 'block';
});

closeUpgradeBtn.addEventListener('click', () => {
    gameState = 'playing';
    isPaused = false;
    upgradeScreen.style.display = 'none';
    requestAnimationFrame(gameLoop);
});

weaponShopContainer.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const weaponKey = button.dataset.weapon;

    if (action === 'buy') {
        buyWeapon(weaponKey);
    } else if (action === 'equip') {
        equipWeapon(weaponKey);
    }
});

upgradeWeaponBtn.addEventListener('click', upgradeWeapon);

// 摇杆控制
let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;

function handleJoystickStart(e) {
    joystickActive = true;
    const rect = joystickContainer.getBoundingClientRect();
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
    updateJoystick(e);
}

function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();
    updateJoystick(e);
}

function handleJoystickEnd(e) {
    if (!joystickActive) return;
    joystickActive = false;
    character.direction = { x: 0, y: 0 };
    joystickDot.style.transform = `translate(0px, 0px)`;
}

function updateJoystick(e) {
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - joystickStartX;
    const dy = touch.clientY - joystickStartY;
    const distance = Math.hypot(dx, dy);
    const maxDistance = joystickContainer.clientWidth / 2 - joystickDot.clientWidth / 2;

    const angle = Math.atan2(dy, dx);
    
    // 角色方向只取决于角度
    character.direction.x = Math.cos(angle);
    character.direction.y = Math.sin(angle);
    character.lastDirection.x = character.direction.x;
    character.lastDirection.y = character.direction.y;

    // 摇杆圆点位置
    const constrainedDistance = Math.min(distance, maxDistance);
    joystickDot.style.transform = `translate(${Math.cos(angle) * constrainedDistance}px, ${Math.sin(angle) * constrainedDistance}px)`;
}

// PC端鼠标事件
joystickContainer.addEventListener('mousedown', handleJoystickStart);
window.addEventListener('mousemove', handleJoystickMove);
window.addEventListener('mouseup', handleJoystickEnd);

// 移动端触摸事件
joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
window.addEventListener('touchmove', handleJoystickMove, { passive: false });
window.addEventListener('touchend', handleJoystickEnd);

// 技能类型
const SKILL_TYPES = {
    speed: { 
        name: "加速", 
        icon: "fa-bolt", 
        unicode: "\uf0e7", 
        color: "#F59E0B", 
        tailwindColor: "text-yellow-400", 
        effect: (char) => { 
            char.speed = char.baseSpeed * 2; 
        }, 
        duration: 5000 
    },
    heal: { 
        name: "治疗", 
        icon: "fa-heart", 
        unicode: "\uf004", 
        color: "#10B981", 
        tailwindColor: "text-green-400", 
        effect: (char) => { 
            char.health = Math.min(char.health + 30, char.maxHealth); 
        }, 
        duration: 0 
    },
    damage: { 
        name: "伤害提升", 
        icon: "fa-bomb", 
        unicode: "\uf1e2", 
        color: "#EF4444", 
        tailwindColor: "text-red-400", 
        effect: (char) => { 
            currentWeapon.damage = currentWeapon.damage * 1.5; 
        }, 
        duration: 5000 
    },
    shield: { 
        name: "护盾", 
        icon: "fa-shield-alt", 
        unicode: "\uf3ed", 
        color: "#3B82F6", 
        tailwindColor: "text-blue-400", 
        effect: (char) => { 
            char.health = char.maxHealth; 
            char.shield = true; 
        }, 
        duration: 3000 
    }
};

// 新增：道具类型
const ITEM_TYPES = {
    health: { name: "生命恢复", unicode: "\uf004", color: "#10B981", effect: (char) => { char.health = Math.min(char.maxHealth, char.health + 20); } },
    shield: { name: "护盾", unicode: "\uf3ed", color: "#3B82F6", effect: (char) => { 
        char.shield = true; 
        setTimeout(() => char.shield = false, 5000); // 护盾持续5秒
    } },
    gold: { name: "金币宝箱", unicode: "\uf719", color: "#F59E0B", effect: () => { coins += 50; } }
};

// 技能冷却时间
let activeSkills = [];

// 技能按钮冷却相关
const skillBtnMap = {
    speed: document.getElementById('skill-1'),
    heal: document.getElementById('skill-2')
};
const skillCooldownTime = {
    speed: 8000, // ms
    heal: 10000
};
let skillCooldownState = {
    speed: 0,
    heal: 0
};

function updateSkillBtnUI() {
    const now = Date.now();
    Object.keys(skillBtnMap).forEach(type => {
        const btn = skillBtnMap[type];
        const left = Math.max(0, skillCooldownState[type] - now);
        btn.disabled = left > 0;
        let overlay = btn.querySelector('.cooldown-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'cooldown-overlay';
            btn.appendChild(overlay);
        }
        if (left > 0) {
            overlay.style.display = 'flex';
            overlay.textContent = Math.ceil(left / 1000);
        } else {
            overlay.style.display = 'none';
        }
    });
}

// 技能按钮事件
skillBtnMap.speed.addEventListener('click', () => {
    const now = Date.now();
    if (now < skillCooldownState.speed) return;
    SKILL_TYPES.speed.effect(character);
    skillCooldownState.speed = now + skillCooldownTime.speed * (1 - 0.1 * (character.skillLevel - 1));
});
skillBtnMap.heal.addEventListener('click', () => {
    const now = Date.now();
    if (now < skillCooldownState.heal) return;
    SKILL_TYPES.heal.effect(character);
    skillCooldownState.heal = now + skillCooldownTime.heal * (1 - 0.1 * (character.skillLevel - 1));
});

// 游戏循环
function gameLoop(timestamp) {
    if (gameState === 'playing' && !isPaused) {
        // 清除画布
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 更新逻辑
        updateCharacter(timestamp);
        updateEnemies(timestamp);
        updateBullets(timestamp);
        updateSkills(timestamp);
        updateSkillCooldowns(timestamp);
        updateItems(timestamp); // 更新道具
        updateEnemyBullets(timestamp); // 新增：更新敌人子弹
        spawnObstaclesIfNeeded(); // 新增：按需生成障碍物
        
        // 更新相机
        updateCamera();

        // 绘制背景
        drawBackground();
        
        // 绘制游戏元素
        drawEnemies();
        drawBullets();
        drawSkills();
        drawItems(); // 绘制道具
        drawEnemyBullets(); // 新增：绘制敌人子弹
        drawObstacles(); // 新增：绘制障碍物
        drawCharacter(); // 角色绘制在最上层
        
        // 检查游戏结束
        checkGameOver();
        
        // 更新UI
        updateUI();
    }
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 新增：更新相机函数
function updateCamera() {
    // 使相机平滑地跟随角色
    const targetX = character.x - GAME_WIDTH / 2;
    const targetY = character.y - GAME_HEIGHT / 2;
    // 使用线性插值(lerp)使相机移动更平滑
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
}

// 绘制背景
function drawBackground() {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // 绘制可移动的网格背景
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const startX = -(camera.x % gridSize);
    const startY = -(camera.y % gridSize);
    
    for (let x = startX; x < GAME_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    }
    
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }
}

// 更新角色状态
function updateCharacter(timestamp) {
    const prevX = character.x;
    const prevY = character.y;

    const currentSpeed = character.speed;
    
    // 根据摇杆方向移动角色
    character.x += currentSpeed * character.direction.x;
    for(const obs of obstacles) {
        if(checkCollision(character, obs)) {
            character.x = prevX;
            break;
        }
    }

    character.y += currentSpeed * character.direction.y;
    for(const obs of obstacles) {
        if(checkCollision(character, obs)) {
            character.y = prevY;
            break;
        }
    }
    
    // 自动射击逻辑
    if (character.canShoot && timestamp - lastShotTime > currentWeapon.fireRate / character.weaponLevel) {
        const nearestEnemy = findNearestEnemy();
        if (nearestEnemy) {
            // 计算射击方向（朝向最近敌人）
            const dx = nearestEnemy.x - character.x;
            const dy = nearestEnemy.y - character.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0) {
                character.lastDirection.x = dx / distance;
                character.lastDirection.y = dy / distance;
            }
            shoot();
            lastShotTime = timestamp;
        }
    }
    
    // 应用技能效果
    activeSkills = activeSkills.filter(skill => {
        if (skill.expireTime > Date.now()) {
            return true;
        } else {
            // 技能效果过期，恢复原始属性
            if (skill.type === 'speed') {
                character.speed = character.baseSpeed * (1 + (character.characterLevel - 1) * 0.1);
            } else if (skill.type === 'damage') {
                currentWeapon.damage = weapons[character.weapon].upgradeDamage[character.weaponLevel - 1];
            } else if (skill.type === 'shield') {
                character.shield = false;
            }
            return false;
        }
    });
}

// 绘制角色
function drawCharacter() {
    const screenX = character.x - camera.x;
    const screenY = character.y - camera.y;

    // 角色身体（矩形）
    ctx.fillStyle = '#3B82F6';
    const bodyWidth = character.width * 0.6;
    const bodyHeight = character.height * 0.8;
    ctx.fillRect(screenX - bodyWidth / 2, screenY - bodyHeight / 2, bodyWidth, bodyHeight);
    
    // 角色头部（圆形）
    const headRadius = character.width * 0.25;
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(screenX, screenY - bodyHeight / 2 - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 角色眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(screenX - headRadius * 0.3, screenY - bodyHeight / 2 - headRadius - headRadius * 0.2, headRadius * 0.15, 0, Math.PI * 2);
    ctx.arc(screenX + headRadius * 0.3, screenY - bodyHeight / 2 - headRadius - headRadius * 0.2, headRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(screenX - headRadius * 0.25, screenY - bodyHeight / 2 - headRadius - headRadius * 0.25, headRadius * 0.08, 0, Math.PI * 2);
    ctx.arc(screenX + headRadius * 0.35, screenY - bodyHeight / 2 - headRadius - headRadius * 0.25, headRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // 角色手脚（线条）
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = character.width * 0.08;
    ctx.lineCap = 'round';
    
    // 左手
    ctx.beginPath();
    ctx.moveTo(screenX - bodyWidth / 2, screenY - bodyHeight * 0.2);
    ctx.lineTo(screenX - bodyWidth / 2 - character.width * 0.3, screenY - bodyHeight * 0.1);
    ctx.stroke();
    
    // 右手
    ctx.beginPath();
    ctx.moveTo(screenX + bodyWidth / 2, screenY - bodyHeight * 0.2);
    ctx.lineTo(screenX + bodyWidth / 2 + character.width * 0.3, screenY - bodyHeight * 0.1);
    ctx.stroke();
    
    // 左脚
    ctx.beginPath();
    ctx.moveTo(screenX - bodyWidth * 0.3, screenY + bodyHeight / 2);
    ctx.lineTo(screenX - bodyWidth * 0.3, screenY + bodyHeight / 2 + character.width * 0.3);
    ctx.stroke();
    
    // 右脚
    ctx.beginPath();
    ctx.moveTo(screenX + bodyWidth * 0.3, screenY + bodyHeight / 2);
    ctx.lineTo(screenX + bodyWidth * 0.3, screenY + bodyHeight / 2 + character.width * 0.3);
    ctx.stroke();
    
    // 武器绘制
    ctx.strokeStyle = currentWeapon.bulletColor;
    const weaponLength = character.width * 0.6;
    const shootDirection = (character.direction.x === 0 && character.direction.y === 0)
        ? character.lastDirection
        : character.direction;
    const weaponAngle = Math.atan2(shootDirection.y, shootDirection.x);
    
    // 武器握把位置（右手）
    const gripX = screenX + bodyWidth * 0.3;
    const gripY = screenY - bodyHeight * 0.1;
    
    // 根据武器类型绘制不同形象
    if (character.weapon === 'pistol') {
        // 手枪：短枪管
        ctx.lineWidth = character.width * 0.08;
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(
            gripX + Math.cos(weaponAngle) * weaponLength * 0.7,
            gripY + Math.sin(weaponAngle) * weaponLength * 0.7
        );
        ctx.stroke();
        // 枪身
        ctx.fillStyle = '#374151';
        ctx.fillRect(gripX - 2, gripY - 8, 4, 16);
    } else if (character.weapon === 'bow') {
        // 弓箭：弧形弓
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = character.width * 0.06;
        ctx.beginPath();
        ctx.arc(gripX, gripY, weaponLength * 0.4, weaponAngle - 0.3, weaponAngle + 0.3);
        ctx.stroke();
        // 箭矢
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = character.width * 0.03;
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(
            gripX + Math.cos(weaponAngle) * weaponLength * 0.8,
            gripY + Math.sin(weaponAngle) * weaponLength * 0.8
        );
        ctx.stroke();
    } else if (character.weapon === 'rifle') {
        // 步枪：长枪管
        ctx.lineWidth = character.width * 0.1;
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(
            gripX + Math.cos(weaponAngle) * weaponLength,
            gripY + Math.sin(weaponAngle) * weaponLength
        );
        ctx.stroke();
        // 枪托
        ctx.fillStyle = '#374151';
        ctx.fillRect(gripX - 3, gripY + 5, 6, 12);
    } else if (character.weapon === 'flamethrower') {
        // 喷火器：粗管
        ctx.lineWidth = character.width * 0.15;
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(
            gripX + Math.cos(weaponAngle) * weaponLength * 0.6,
            gripY + Math.sin(weaponAngle) * weaponLength * 0.6
        );
        ctx.stroke();
        // 燃料罐
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(gripX - 8, gripY - 5, 16, 10);
    } else {
        // 其他武器：通用绘制
        ctx.lineWidth = character.width * 0.08;
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(
            gripX + Math.cos(weaponAngle) * weaponLength,
            gripY + Math.sin(weaponAngle) * weaponLength
        );
        ctx.stroke();
    }
    
    // 生命值条
    drawHealthBar(screenX - character.width / 2, screenY - character.height / 2 - character.width / 2, character.width, 5, character.health, character.maxHealth);
    
    // 护盾效果
    if (character.shield) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, character.width / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 绘制生命值条
function drawHealthBar(x, y, width, height, current, max) {
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    // 生命值
    const percent = current / max;
    ctx.fillStyle = percent > 0.5 ? '#10B981' : percent > 0.2 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(x, y, width * percent, height);
}

// 生成单个敌人
function spawnSingleEnemy() {
    const size = ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
    let x, y, tryCount = 0;
    let valid = false;
    while (!valid && tryCount < 20) {
        // 在屏幕外围生成敌人
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(GAME_WIDTH / 2, GAME_HEIGHT / 2) + size;
        x = character.x + Math.cos(angle) * radius;
        y = character.y + Math.sin(angle) * radius;
        // 检查与障碍物重叠
        let overlap = false;
        for (const obs of obstacles) {
            if (checkCollision({x, y, width: size, height: size}, obs)) {
                overlap = true;
                break;
            }
        }
        if (!overlap) valid = true;
        tryCount++;
    }
    const isRanged = currentWave >= 15 && Math.random() < 0.3; // 15波后有30%概率为远程
    enemies.push({
        x,
        y,
        width: size,
        height: size,
        health: 10 + currentWave * 5,
        maxHealth: 10 + currentWave * 5,
        speed: (isRanged ? 0.6 : 0.8) + currentWave * 0.1, // 远程单位慢一点
        color: isRanged ? '#EC4899' : getRandomEnemyColor(),
        targetX: character.x,
        targetY: character.y,
        type: isRanged ? 'ranged' : 'melee',
        damage: 1 + Math.floor(currentWave / 2), // 敌人伤害
        fireRate: 2000, // 远程敌人射速
        lastShot: 0
    });
}

// 更新敌人状态
function updateEnemies(timestamp) {
    // 波次管理
    if (gameState === 'playing') {
        // 检查是否可以开始新一波
        if (enemies.length === 0 && enemiesSpawnedThisWave >= totalEnemiesThisWave) {
            currentWave++;
            totalEnemiesThisWave = 50 + (currentWave - 1) * 5;
            enemiesSpawnedThisWave = 0;
        }

        // 增量生成敌人
        if (enemiesSpawnedThisWave < totalEnemiesThisWave && timestamp - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
            spawnSingleEnemy();
            enemiesSpawnedThisWave++;
            lastEnemySpawnTime = timestamp;
        }
    }
    
    // 更新现有敌人的逻辑
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const prevX = enemy.x;
        const prevY = enemy.y;

        // 移除远处的敌人
        const distFromPlayer = Math.hypot(enemy.x - character.x, enemy.y - character.y);
        if (distFromPlayer > Math.max(GAME_WIDTH, GAME_HEIGHT) * 1.5) {
            enemies.splice(i, 1);
            continue;
        }

        enemy.targetX = character.x;
        enemy.targetY = character.y;
        
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.hypot(dx, dy);

        if (enemy.type === 'melee') {
            // 近战敌人逻辑
            if (distance > 0) {
                let moved = false;
                // 先尝试正常移动
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
                for (const obs of obstacles) {
                    if (checkCollision(enemy, obs)) {
                        // 恢复原位，尝试x轴移动
                        enemy.x = prevX + (dx / distance) * enemy.speed;
                        enemy.y = prevY;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        // 尝试y轴移动
                        enemy.x = prevX;
                        enemy.y = prevY + (dy / distance) * enemy.speed;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        // 全部失败，原地不动
                        enemy.x = prevX;
                        enemy.y = prevY;
                        moved = true;
                        break;
                    }
                }
                if (!moved) {
                    // 没有碰撞，正常移动
                }
            }
        } else if (enemy.type === 'ranged') {
            // 远程敌人逻辑
            const idealDistance = GAME_WIDTH * 0.4;
            if (distance > idealDistance) {
                let moved = false;
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
                for (const obs of obstacles) {
                    if (checkCollision(enemy, obs)) {
                        enemy.x = prevX + (dx / distance) * enemy.speed;
                        enemy.y = prevY;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        enemy.x = prevX;
                        enemy.y = prevY + (dy / distance) * enemy.speed;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        enemy.x = prevX;
                        enemy.y = prevY;
                        moved = true;
                        break;
                    }
                }
                if (!moved) {
                    // 没有碰撞，正常移动
                }
            } else if (distance < idealDistance - 50) {
                let moved = false;
                enemy.x -= (dx / distance) * enemy.speed;
                enemy.y -= (dy / distance) * enemy.speed;
                for (const obs of obstacles) {
                    if (checkCollision(enemy, obs)) {
                        enemy.x = prevX - (dx / distance) * enemy.speed;
                        enemy.y = prevY;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        enemy.x = prevX;
                        enemy.y = prevY - (dy / distance) * enemy.speed;
                        if (!obstacles.some(o => checkCollision(enemy, o))) {
                            moved = true;
                            break;
                        }
                        enemy.x = prevX;
                        enemy.y = prevY;
                        moved = true;
                        break;
                    }
                }
                if (!moved) {
                    // 没有碰撞，正常移动
                }
            }
        }
        
        // 与障碍物碰撞
        for (const obs of obstacles) {
            if (checkCollision(enemy, obs)) {
                enemy.x = prevX;
                enemy.y = prevY;
                break;
            }
        }

        // 敌人间的碰撞
        for (let j = i - 1; j >= 0; j--) {
            const otherEnemy = enemies[j];
            const dist = Math.hypot(enemy.x - otherEnemy.x, enemy.y - otherEnemy.y);
            const min_dist = (enemy.width / 2) + (otherEnemy.width / 2);
            if (dist < min_dist) {
                const angle = Math.atan2(enemy.y - otherEnemy.y, enemy.x - otherEnemy.x);
                const overlap = min_dist - dist;
                const resolveX = Math.cos(angle) * overlap / 2;
                const resolveY = Math.sin(angle) * overlap / 2;
                enemy.x += resolveX;
                enemy.y += resolveY;
                otherEnemy.x -= resolveX;
                otherEnemy.y -= resolveY;
            }
        }

        // 检测与角色的碰撞
        if (enemy.type === 'melee' && checkCollision(character, enemy)) {
            if (!character.shield) {
                character.health -= enemy.damage;
                if (character.health <= 0) {
                    character.health = 0;
                }
            }
            const knockback = -20;
            enemy.x += (dx / distance) * knockback;
            enemy.y += (dy / distance) * knockback;
        }

        // 远程射击
        if (enemy.type === 'ranged' && timestamp - enemy.lastShot > enemy.fireRate) {
            enemyShoot(enemy);
            enemy.lastShot = timestamp;
        }
        
        // 移除死亡的敌人
        if (enemy.health <= 0) {
            // 增加分数和金币
            score += 10 + currentWave * 5;
            coins += 5 + currentWave;
            
            // 给予经验值
            gainExperience(10 + currentWave * 2);
            
            // 随机掉落技能牌
            if (Math.random() < 0.3) {
                spawnSkill(enemy.x, enemy.y);
            }
            
            enemies.splice(i, 1);
        }
    }
}

// 绘制敌人
function drawEnemies() {
    enemies.forEach(enemy => {
        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;

        // 简单的屏幕外剔除
        if (screenX + enemy.width < 0 || screenX - enemy.width > GAME_WIDTH ||
            screenY + enemy.height < 0 || screenY - enemy.height > GAME_HEIGHT) {
            return;
        }

        // 敌人身体（矩形）
        ctx.fillStyle = enemy.color;
        const bodyWidth = enemy.width * 0.6;
        const bodyHeight = enemy.height * 0.8;
        ctx.fillRect(screenX - bodyWidth / 2, screenY - bodyHeight / 2, bodyWidth, bodyHeight);
        
        // 敌人头部（圆形或方形）
        const headSize = enemy.width * 0.25;
        ctx.fillStyle = enemy.type === 'ranged' ? '#DC2626' : '#EF4444';
        if (enemy.type === 'ranged') {
            // 远程敌人用方形头部
            ctx.fillRect(screenX - headSize / 2, screenY - bodyHeight / 2 - headSize, headSize, headSize);
        } else {
            // 近战敌人用圆形头部
            ctx.beginPath();
            ctx.arc(screenX, screenY - bodyHeight / 2 - headSize, headSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 敌人眼睛
        ctx.fillStyle = 'white';
        if (enemy.type === 'ranged') {
            // 方形眼睛
            ctx.fillRect(screenX - headSize * 0.3, screenY - bodyHeight / 2 - headSize - headSize * 0.2, headSize * 0.15, headSize * 0.15);
            ctx.fillRect(screenX + headSize * 0.15, screenY - bodyHeight / 2 - headSize - headSize * 0.2, headSize * 0.15, headSize * 0.15);
        } else {
            // 圆形眼睛
            ctx.beginPath();
            ctx.arc(screenX - headSize * 0.3, screenY - bodyHeight / 2 - headSize - headSize * 0.2, headSize * 0.15, 0, Math.PI * 2);
            ctx.arc(screenX + headSize * 0.3, screenY - bodyHeight / 2 - headSize - headSize * 0.2, headSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'black';
        if (enemy.type === 'ranged') {
            // 方形瞳孔
            ctx.fillRect(screenX - headSize * 0.25, screenY - bodyHeight / 2 - headSize - headSize * 0.25, headSize * 0.08, headSize * 0.08);
            ctx.fillRect(screenX + headSize * 0.17, screenY - bodyHeight / 2 - headSize - headSize * 0.25, headSize * 0.08, headSize * 0.08);
        } else {
            // 圆形瞳孔
            ctx.beginPath();
            ctx.arc(screenX - headSize * 0.25, screenY - bodyHeight / 2 - headSize - headSize * 0.25, headSize * 0.08, 0, Math.PI * 2);
            ctx.arc(screenX + headSize * 0.35, screenY - bodyHeight / 2 - headSize - headSize * 0.25, headSize * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 敌人手脚（更粗的线条）
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = enemy.width * 0.12;
        ctx.lineCap = 'round';
        
        // 左手
        ctx.beginPath();
        ctx.moveTo(screenX - bodyWidth / 2, screenY - bodyHeight * 0.2);
        ctx.lineTo(screenX - bodyWidth / 2 - enemy.width * 0.3, screenY - bodyHeight * 0.1);
        ctx.stroke();
        
        // 右手
        ctx.beginPath();
        ctx.moveTo(screenX + bodyWidth / 2, screenY - bodyHeight * 0.2);
        ctx.lineTo(screenX + bodyWidth / 2 + enemy.width * 0.3, screenY - bodyHeight * 0.1);
        ctx.stroke();
        
        // 左脚
        ctx.beginPath();
        ctx.moveTo(screenX - bodyWidth * 0.3, screenY + bodyHeight / 2);
        ctx.lineTo(screenX - bodyWidth * 0.3, screenY + bodyHeight / 2 + enemy.width * 0.3);
        ctx.stroke();
        
        // 右脚
        ctx.beginPath();
        ctx.moveTo(screenX + bodyWidth * 0.3, screenY + bodyHeight / 2);
        ctx.lineTo(screenX + bodyWidth * 0.3, screenY + bodyHeight / 2 + enemy.width * 0.3);
        ctx.stroke();
        
        // 敌人生命值条
        drawHealthBar(
            screenX - enemy.width / 2, 
            screenY - enemy.height / 2 - enemy.width / 2, 
            enemy.width, 
            3, 
            enemy.health, 
            enemy.maxHealth
        );
    });
}

// 射击
function shoot() {
    const weapon = currentWeapon;
    const shootDirection = (character.direction.x === 0 && character.direction.y === 0)
        ? character.lastDirection
        : character.direction;
    const angle = Math.atan2(shootDirection.y, shootDirection.x);
    
    // 计算伤害（包含暴击）
    let damage = weapon.damage;
    if (character.criticalChance && Math.random() < character.criticalChance) {
        damage = Math.round(damage * 2);
    }
    
    bullets.push({
        x: character.x + Math.cos(angle) * (character.width / 2 + 10),
        y: character.y + Math.sin(angle) * (character.width / 2 + 10),
        width: BULLET_SIZE,
        height: BULLET_SIZE,
        speed: weapon.bulletSpeed,
        damage: damage,
        angle,
        color: weapon.bulletColor
    });
}

// 更新子弹
function updateBullets(timestamp) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // 移除飞太远的子弹
        const distFromPlayer = Math.hypot(bullet.x - character.x, bullet.y - character.y);
        if (distFromPlayer > Math.max(GAME_WIDTH, GAME_HEIGHT)) {
            bullets.splice(i, 1);
            continue;
        }

        // 子弹与障碍物碰撞
        let hitObstacle = false;
        for (const obs of obstacles) {
            if (checkCollision(bullet, obs)) {
                bullets.splice(i, 1);
                hitObstacle = true;
                break;
            }
        }
        if (hitObstacle) continue;
        
        // 检测子弹与敌人的碰撞
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        const screenY = bullet.y - camera.y;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function spawnSkill(x, y) {
    const skillTypes = Object.keys(SKILL_TYPES);
    const type = skillTypes[Math.floor(Math.random() * skillTypes.length)];
    skills.push({
        x,
        y,
        width: SKILL_SIZE,
        height: SKILL_SIZE,
        type: type,
        ...SKILL_TYPES[type]
    });
}

function updateSkills(timestamp) {
    for (let i = skills.length - 1; i >= 0; i--) {
        if (checkCollision(character, skills[i])) {
            activateSkill(skills[i]);
            skills.splice(i, 1);
        }
    }
}

function drawSkills() {
    ctx.font = `${SKILL_SIZE * 0.6}px "Font Awesome 6 Free"`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    skills.forEach(skill => {
        const screenX = skill.x - camera.x;
        const screenY = skill.y - camera.y;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, SKILL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = skill.color;
        ctx.fillText(skill.unicode, screenX, screenY);
    });
}

function activateSkill(skill) {
    skill.effect(character);
    if (skill.duration > 0) {
        activeSkills.push({
            type: skill.type,
            expireTime: Date.now() + skill.duration
        });
    }
}

function updateSkillCooldowns(timestamp) {
    updateSkillBtnUI();
}

function checkGameOver() {
    if (character.health <= 0) {
        gameState = 'gameOver';
        gameOverScreen.style.display = 'flex';
        setTimeout(() => {
            gameOverCard.style.transform = 'scale(1)';
            gameOverCard.style.opacity = '1';
        }, 100);
        
        finalWave.textContent = currentWave;
        finalScore.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('adventureHighScore', highScore);
        }
        highScoreDisplay.textContent = highScore;
    }
}

function updateUI() {
    waveDisplay.textContent = `波次: ${currentWave}`;
    coinsDisplay.textContent = `金币: ${coins}`;
    weaponName.textContent = currentWeapon.name;
    weaponIcon.className = `fa-solid ${currentWeapon.icon} text-2xl text-primary`;
    weaponLevel.textContent = `LV.${character.weaponLevel}`;
    
    // 更新等级显示
    document.getElementById('level-display').textContent = character.characterLevel;
    
    // 更新经验条
    const expPercent = (experience / character.experienceToNext) * 100;
    const expBar = document.getElementById('exp-bar');
    if (expBar) {
        expBar.style.width = expPercent + '%';
    }
}

function updateUpgradeUI() {
    // 更新金币显示
    upgradeCoinsDisplay.textContent = coins;

    // 更新武器升级面板
    const weaponData = weapons[character.weapon];
    const level = character.weaponLevel;
    upgradeWeaponName.textContent = weaponData.name;
    document.getElementById('upgrade-weapon-icon').className = `fa-solid ${weaponData.icon} text-primary mr-2`;
    currentWeaponLevel.textContent = level;

    if (level < weaponData.upgradeCost.length + 1) {
        const cost = weaponData.upgradeCost[level - 1];
        weaponUpgradeCost.textContent = cost;
        nextWeaponDamage.textContent = weaponData.upgradeDamage[level];
        nextWeaponFireRate.textContent = `${weaponData.upgradeFireRate[level]}ms`;
        upgradeWeaponBtn.disabled = coins < cost;
    } else {
        weaponUpgradeCost.textContent = '已满级';
        nextWeaponDamage.textContent = '---';
        nextWeaponFireRate.textContent = '---';
        upgradeWeaponBtn.disabled = true;
    }
    
    // 动态生成武器商店
    populateWeaponShop();

    // 技能升级面板
    currentSkillLevel.textContent = character.skillLevel;
    const skillCost = 30 * character.skillLevel;
    skillUpgradeCost.textContent = skillCost;
    upgradeSkillBtn.disabled = coins < skillCost;

    // 角色升级面板
    currentCharacterLevel.textContent = character.characterLevel;
    const charCost = 40 * character.characterLevel;
    characterUpgradeCost.textContent = charCost;
    upgradeCharacterBtn.disabled = coins < charCost;
}

function populateWeaponShop() {
    weaponShopContainer.innerHTML = '';
    Object.keys(weapons).forEach(key => {
        const weapon = weapons[key];
        const isEquipped = character.weapon === key;
        const card = document.createElement('div');
        card.className = 'bg-dark/50 rounded-lg p-3 flex flex-col items-center border-2';
        let buttonHtml;

        if (weapon.isUnlocked) {
            if (isEquipped) {
                card.classList.add('border-primary');
                buttonHtml = `<button class="w-full mt-2 py-1 text-sm rounded bg-primary/50 text-light cursor-not-allowed" disabled>已装备</button>`;
            } else {
                card.classList.add('border-transparent');
                buttonHtml = `<button data-action="equip" data-weapon="${key}" class="w-full mt-2 py-1 text-sm rounded bg-secondary/80 hover:bg-secondary/100 text-light">装备</button>`;
            }
        } else {
            card.classList.add('border-transparent');
            const canAfford = coins >= weapon.unlockCost;
            buttonHtml = `<button data-action="buy" data-weapon="${key}" class="w-full mt-2 py-1 text-sm rounded ${canAfford ? 'bg-accent/80 hover:bg-accent/100' : 'bg-gray-600 cursor-not-allowed'} text-dark font-semibold" ${!canAfford ? 'disabled' : ''}>
                <i class="fa-solid fa-coins mr-1"></i> ${weapon.unlockCost}
            </button>`;
        }

        card.innerHTML = `
            <i class="fa-solid ${weapon.icon} text-3xl ${isEquipped ? 'text-primary' : 'text-gray-400'}"></i>
            <p class="text-sm font-semibold mt-1">${weapon.name}</p>
            <p class="text-xs text-gray-400">伤害: ${weapon.damage}</p>
            <p class="text-xs text-gray-400">射速: ${weapon.fireRate}ms</p>
            ${buttonHtml}
        `;
        weaponShopContainer.appendChild(card);
    });
}

function buyWeapon(weaponKey) {
    const weapon = weapons[weaponKey];
    if (coins >= weapon.unlockCost && !weapon.isUnlocked) {
        coins -= weapon.unlockCost;
        weapon.isUnlocked = true;
        equipWeapon(weaponKey); // 购买后自动装备
    }
}

function equipWeapon(weaponKey) {
    character.weapon = weaponKey;
    currentWeapon = weapons[weaponKey];
    // 重置武器等级为1，或者你可以实现每个武器等级独立保存
    character.weaponLevel = 1; 
    updateUpgradeUI();
}

function upgradeWeapon() {
    const weaponData = weapons[character.weapon];
    const level = character.weaponLevel;
    if (level < weaponData.upgradeCost.length + 1) {
        const cost = weaponData.upgradeCost[level - 1];
        if (coins >= cost) {
            coins -= cost;
            character.weaponLevel++;
            currentWeapon.damage = weaponData.upgradeDamage[level];
            currentWeapon.fireRate = weaponData.upgradeFireRate[level];
            updateUpgradeUI();
        }
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getRandomEnemyColor() {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function resetGame() {
    character.x = GAME_WIDTH / 2;
    character.y = GAME_HEIGHT / 2;
    character.health = character.maxHealth;
    character.direction = { x: 0, y: 0 };
    character.speed = character.baseSpeed;
    character.weapon = 'pistol';
    character.weaponLevel = 1;
    character.skillLevel = 1;
    character.characterLevel = 1;
    character.shield = false;
    character.experience = 0;
    character.experienceToNext = 100;
    character.criticalChance = 0;
    
    // 重置所有武器状态
    Object.keys(weapons).forEach(key => {
        weapons[key].isUnlocked = (key === 'pistol');
    });

    currentWeapon = weapons.pistol;
    
    enemies = [];
    bullets = [];
    enemyBullets = []; // 重置敌人子弹
    skills = [];
    items = []; // 重置道具
    obstacles = []; // 重置障碍物
    generatedChunks.clear(); // 清空已生成区块记录
    activeSkills = [];
    
    currentWave = 1;
    score = 0;
    coins = 0;
    
    // 重置波次变量
    totalEnemiesThisWave = 50;
    enemiesSpawnedThisWave = 0;
    lastEnemySpawnTime = 0;
    
    gameState = 'playing';

    spawnObstaclesIfNeeded();
}

// 新增：道具相关函数
function spawnItems() {
    const itemKeys = Object.keys(ITEM_TYPES);
    const type = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    
    // 在角色附近随机生成
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (GAME_WIDTH / 2);
    const x = character.x + Math.cos(angle) * radius;
    const y = character.y + Math.sin(angle) * radius;

    items.push({
        x, y,
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        type: type,
        ...ITEM_TYPES[type]
    });
}

function updateItems(timestamp) {
    if (timestamp - lastItemSpawnTime > ITEM_SPAWN_INTERVAL) {
        spawnItems();
        lastItemSpawnTime = timestamp;
    }

    for (let i = items.length - 1; i >= 0; i--) {
        if (checkCollision(character, items[i])) {
            items[i].effect(character);
            items.splice(i, 1);
        }
    }
}

function drawItems() {
    ctx.font = `${ITEM_SIZE * 0.7}px "Font Awesome 6 Free"`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    items.forEach(item => {
        const screenX = item.x - camera.x;
        const screenY = item.y - camera.y;
        
        // 简单的屏幕外剔除
        if (screenX + ITEM_SIZE < 0 || screenX - ITEM_SIZE > GAME_WIDTH ||
            screenY + ITEM_SIZE < 0 || screenY - ITEM_SIZE > GAME_HEIGHT) {
            return;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, ITEM_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = item.color;
        ctx.fillText(item.unicode, screenX, screenY);
    });
}

// 新增：敌人射击、子弹更新与绘制
function enemyShoot(enemy) {
    const angle = Math.atan2(character.y - enemy.y, character.x - enemy.x);
    enemyBullets.push({
        x: enemy.x,
        y: enemy.y,
        width: BULLET_SIZE,
        height: BULLET_SIZE,
        speed: 5,
        damage: enemy.damage,
        angle: angle,
        color: '#EC4899'
    });
}

function updateEnemyBullets(timestamp) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;

        // 移除飞太远的子弹
        const distFromPlayer = Math.hypot(bullet.x - character.x, bullet.y - character.y);
        if (distFromPlayer > Math.max(GAME_WIDTH, GAME_HEIGHT)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // 子弹与障碍物碰撞
        let hitObstacle = false;
        for (const obs of obstacles) {
            if (checkCollision(bullet, obs)) {
                enemyBullets.splice(i, 1);
                hitObstacle = true;
                break;
            }
        }
        if (hitObstacle) continue;

        // 检测子弹与玩家的碰撞
        if (checkCollision(bullet, character)) {
            if (!character.shield) {
                character.health -= bullet.damage;
            }
            enemyBullets.splice(i, 1);
        }
    }
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        const screenY = bullet.y - camera.y;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const screenX = obs.x - camera.x;
        const screenY = obs.y - camera.y;

        if (screenX + obs.width < 0 || screenX > GAME_WIDTH || screenY + obs.height < 0 || screenY > GAME_HEIGHT) {
            return;
        }

        ctx.fillStyle = '#6B7280'; // Gray color for obstacles
        ctx.fillRect(screenX, screenY, obs.width, obs.height);
        
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(screenX + 5, screenY + 5, obs.width - 10, obs.height - 10);
    });
}

function spawnObstaclesIfNeeded() {
    const chunkX = Math.floor(character.x / CHUNK_SIZE);
    const chunkY = Math.floor(character.y / CHUNK_SIZE);
    
    // 检查周围九个区块
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const checkX = chunkX + i;
            const checkY = chunkY + j;
            const chunkId = `${checkX},${checkY}`;

            if (!generatedChunks.has(chunkId)) {
                spawnObstaclesInChunk(checkX, checkY);
                generatedChunks.add(chunkId);
            }
        }
    }
}

function spawnObstaclesInChunk(chunkX, chunkY) {
    for (let i = 0; i < OBSTACLE_COUNT_PER_CHUNK; i++) {
        const size = 50 + Math.random() * 100;
        const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;

        // 避免在玩家出生点生成
        const distFromOrigin = Math.hypot(x - GAME_WIDTH / 2, y - GAME_HEIGHT / 2);
        if (distFromOrigin < 300) continue;

        obstacles.push({
            x: x,
            y: y,
            width: size,
            height: size
        });
    }
}

// 技能升级和角色升级按钮事件
upgradeSkillBtn.addEventListener('click', () => {
    const cost = 30 * character.skillLevel;
    if (coins >= cost) {
        coins -= cost;
        character.skillLevel++;
        updateUpgradeUI();
    }
});
upgradeCharacterBtn.addEventListener('click', () => {
    const cost = 40 * character.characterLevel;
    if (coins >= cost) {
        coins -= cost;
        character.characterLevel++;
        character.maxHealth = Math.round(100 * (1 + 0.2 * (character.characterLevel - 1)));
        character.health = character.maxHealth;
        character.baseSpeed = 3 * (1 + 0.1 * (character.characterLevel - 1));
        character.speed = character.baseSpeed;
        updateUpgradeUI();
    }
});

// 新增：经验系统
function gainExperience(amount) {
    experience += amount;
    while (experience >= character.experienceToNext) {
        experience -= character.experienceToNext;
        character.experienceToNext = Math.round(100 * (1 + 0.2 * (character.characterLevel - 1)));
        character.characterLevel++;
        character.maxHealth = Math.round(100 * (1 + 0.2 * (character.characterLevel - 1)));
        character.health = character.maxHealth;
        character.baseSpeed = 3 * (1 + 0.1 * (character.characterLevel - 1));
        character.speed = character.baseSpeed;
        updateUpgradeUI();
    }
}

// 新增：升级词条系统
const UPGRADE_PERKS = {
    damage: { name: "伤害提升", description: "武器伤害+20%", effect: () => { currentWeapon.damage = Math.round(currentWeapon.damage * 1.2); } },
    fireRate: { name: "射速提升", description: "射击间隔-15%", effect: () => { currentWeapon.fireRate = Math.round(currentWeapon.fireRate * 0.85); } },
    health: { name: "生命提升", description: "最大生命值+30", effect: () => { character.maxHealth += 30; character.health = character.maxHealth; } },
    speed: { name: "速度提升", description: "移动速度+15%", effect: () => { character.baseSpeed *= 1.15; character.speed = character.baseSpeed; } },
    bulletSpeed: { name: "子弹速度", description: "子弹速度+25%", effect: () => { currentWeapon.bulletSpeed *= 1.25; } },
    critical: { name: "暴击率", description: "15%概率造成双倍伤害", effect: () => { character.criticalChance = (character.criticalChance || 0) + 0.15; } }
};

// 自动锁定最近敌人
function findNearestEnemy() {
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    enemies.forEach(enemy => {
        const distance = Math.hypot(enemy.x - character.x, enemy.y - character.y);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    return nearestEnemy;
}
