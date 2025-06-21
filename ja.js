// 游戏常量
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const CHARACTER_SIZE = Math.min(GAME_WIDTH * 0.08, 60); // 角色大小
const ENEMY_MIN_SIZE = Math.min(GAME_WIDTH * 0.06, 40); // 敌人最小大小
const ENEMY_MAX_SIZE = Math.min(GAME_WIDTH * 0.1, 60); // 敌人最大大小
const SKILL_SIZE = Math.min(GAME_WIDTH * 0.07, 50); // 技能牌大小
const BULLET_SIZE = Math.min(GAME_WIDTH * 0.03, 20); // 子弹大小
const WAVE_INTERVAL = 15000; // 波次间隔15秒
const ENEMY_SPAWN_INTERVAL = 1000; // 敌人生成间隔1秒

// 游戏状态
let gameState = 'start'; // start, playing, gameOver, upgrade
let currentWave = 1; // 当前波次
let score = 0; // 得分
let highScore = localStorage.getItem('adventureHighScore') || 0; // 最高分
let coins = 0; // 金币
let isPaused = false; // 游戏暂停状态

// 角色状态
let character = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    speed: 5, // 移动速度
    health: 100, // 生命值
    maxHealth: 100, // 最大生命值
    direction: { x: 0, y: 0 }, // 移动方向
    weapon: 'pistol', // 当前武器
    weaponLevel: 1, // 武器等级
    skillCooldown: {
        speed: 0, // 速度技能冷却
        heal: 0 // 治疗技能冷却
    },
    skillLevel: 1, // 技能等级
    characterLevel: 1, // 角色等级
    canShoot: true // 能否射击
};

// 武器数据
const weapons = {
    pistol: {
        name: "手枪",
        icon: "fa-handgun",
        damage: 10, // 基础伤害
        fireRate: 1000, // 射击间隔(毫秒)
        bulletSpeed: 10, // 子弹速度
        bulletColor: "#3B82F6", // 子弹颜色
        unlockCost: 0, // 解锁价格
        upgradeCost: [50, 100, 150, 200], // 升级价格
        upgradeDamage: [10, 15, 20, 25], // 升级后伤害
        upgradeFireRate: [1000, 800, 600, 400], // 升级后射击间隔
        isUnlocked: true // 是否已解锁
    },
    bow: {
        name: "弓箭",
        icon: "fa-bow",
        damage: 15,
        fireRate: 1500,
        bulletSpeed: 8,
        bulletColor: "#10B981",
        unlockCost: 100,
        upgradeCost: [70, 140, 210, 280],
        upgradeDamage: [15, 25, 35, 45],
        upgradeFireRate: [1500, 1200, 900, 600],
        isUnlocked: false
    },
    rifle: {
        name: "步枪",
        icon: "fa-rifle",
        damage: 8,
        fireRate: 500,
        bulletSpeed: 15,
        bulletColor: "#F59E0B",
        unlockCost: 200,
        upgradeCost: [60, 120, 180, 240],
        upgradeDamage: [8, 12, 16, 20],
        upgradeFireRate: [500, 400, 300, 200],
        isUnlocked: false
    },
    flamethrower: {
        name: "喷火器",
        icon: "fa-fire",
        damage: 5,
        fireRate: 200,
        bulletSpeed: 3,
        bulletColor: "#EF4444",
        unlockCost: 300,
        upgradeCost: [80, 160, 240, 320],
        upgradeDamage: [5, 8, 11, 14],
        upgradeFireRate: [200, 150, 100, 50],
        isUnlocked: false
    },
    lightning: {
        name: "雷电",
        icon: "fa-bolt",
        damage: 25,
        fireRate: 2000,
        bulletSpeed: 20,
        bulletColor: "#F59E0B",
        unlockCost: 400,
        upgradeCost: [100, 200, 300, 400],
        upgradeDamage: [25, 40, 55, 70],
        upgradeFireRate: [2000, 1500, 1000, 500],
        isUnlocked: false
    },
    windwheel: {
        name: "风火轮",
        icon: "fa-wind",
        damage: 12,
        fireRate: 1200,
        bulletSpeed: 12,
        bulletColor: "#8B5CF6",
        unlockCost: 500,
        upgradeCost: [120, 240, 360, 480],
        upgradeDamage: [12, 20, 28, 36],
        upgradeFireRate: [1200, 1000, 800, 600],
        isUnlocked: false
    },
    dart: {
        name: "飞镖",
        icon: "fa-dart",
        damage: 18,
        fireRate: 1800,
        bulletSpeed: 18,
        bulletColor: "#10B981",
        unlockCost: 600,
        upgradeCost: [90, 180, 270, 360],
        upgradeDamage: [18, 28, 38, 48],
        upgradeFireRate: [1800, 1500, 1200, 900],
        isUnlocked: false
    }
};

// 当前使用的武器
let currentWeapon = weapons.pistol;

// 敌人数组
let enemies = [];

// 子弹数组
let bullets = [];

// 技能牌数组
let skills = [];

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
const upgradeWeaponBtn = document.getElementById('upgrade-weapon');
const upgradeSkillBtn = document.getElementById('upgrade-skill');
const upgradeCharacterBtn = document.getElementById('upgrade-character');

// 设置画布尺寸
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 技能类型
const SKILL_TYPES = {
    speed: { name: "加速", icon: "fa-bolt", unicode: "\uf0e7", color: "#F59E0B", tailwindColor: "text-yellow-400", effect: (char) => { char.speed = char.speed * 2; }, duration: 5000 },
    heal: { name: "治疗", icon: "fa-heart", unicode: "\uf004", color: "#10B981", tailwindColor: "text-green-400", effect: (char) => { char.health = Math.min(char.health + 30, char.maxHealth); }, duration: 0 },
    damage: { name: "伤害提升", icon: "fa-bomb", unicode: "\uf1e2", color: "#EF4444", tailwindColor: "text-red-400", effect: (char) => { currentWeapon.damage = currentWeapon.damage * 1.5; }, duration: 5000 },
    shield: { name: "护盾", icon: "fa-shield-alt", unicode: "\uf3ed", color: "#3B82F6", tailwindColor: "text-blue-400", effect: (char) => { char.health = char.maxHealth; char.shield = true; }, duration: 3000 }
};

// 技能冷却时间
let activeSkills = [];

// 游戏循环
function gameLoop(timestamp) {
    if (gameState === 'playing' && !isPaused) {
        // 清除画布
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 绘制背景
        drawBackground();
        
        // 更新和绘制角色
        updateCharacter(timestamp);
        drawCharacter();
        
        // 更新和绘制敌人
        updateEnemies(timestamp);
        drawEnemies();
        
        // 更新和绘制子弹
        updateBullets(timestamp);
        drawBullets();
        
        // 更新和绘制技能牌
        updateSkills(timestamp);
        drawSkills();
        
        // 更新技能冷却
        updateSkillCooldowns(timestamp);
        
        // 检查游戏结束
        checkGameOver();
        
        // 更新UI
        updateUI();
    }
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 绘制背景
function drawBackground() {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // 绘制网格背景
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
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
    // 根据摇杆方向移动角色
    const moveX = character.speed * character.direction.x;
    const moveY = character.speed * character.direction.y;
    
    character.x += moveX;
    character.y += moveY;
    
    // 边界检测
    if (character.x < character.width / 2) character.x = character.width / 2;
    if (character.x > GAME_WIDTH - character.width / 2) character.x = GAME_WIDTH - character.width / 2;
    if (character.y < character.height / 2) character.y = character.height / 2;
    if (character.y > GAME_HEIGHT - character.height / 2) character.y = GAME_HEIGHT - character.height / 2;
    
    // 射击逻辑
    if (character.canShoot && timestamp - lastShotTime > currentWeapon.fireRate / character.weaponLevel) {
        shoot();
        lastShotTime = timestamp;
    }
    
    // 应用技能效果
    activeSkills = activeSkills.filter(skill => {
        if (skill.expireTime > timestamp) {
            return true;
        } else {
            // 技能效果过期，恢复原始属性
            if (skill.type === 'speed') {
                character.speed = 5 * (1 + (character.characterLevel - 1) * 0.1);
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
    // 角色主体
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(character.x, character.y, character.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 角色眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(character.x - character.width * 0.2, character.y - character.width * 0.3, character.width * 0.1, 0, Math.PI * 2);
    ctx.arc(character.x + character.width * 0.2, character.y - character.width * 0.3, character.width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(character.x - character.width * 0.15, character.y - character.width * 0.35, character.width * 0.05, 0, Math.PI * 2);
    ctx.arc(character.x + character.width * 0.25, character.y - character.width * 0.35, character.width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // 武器绘制
    ctx.fillStyle = currentWeapon.bulletColor;
    const weaponLength = character.width * 0.6;
    const weaponAngle = Math.atan2(character.direction.y, character.direction.x) || 0;
    
    ctx.beginPath();
    ctx.moveTo(character.x, character.y);
    ctx.lineTo(
        character.x + Math.cos(weaponAngle) * weaponLength,
        character.y + Math.sin(weaponAngle) * weaponLength
    );
    ctx.lineWidth = character.width * 0.1;
    ctx.stroke();
    
    // 生命值条
    drawHealthBar(character.x - character.width / 2, character.y - character.height / 2 - character.width / 2, character.width, 5, character.health, character.maxHealth);
    
    // 护盾效果
    if (character.shield) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(character.x, character.y, character.width / 2 + 5, 0, Math.PI * 2);
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

// 生成敌人
function spawnEnemies() {
    // 每波敌人数量随波次增加
    const enemiesPerWave = currentWave * 2 + 3;
    
    for (let i = 0; i < enemiesPerWave; i++) {
        const size = ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
        const x = Math.random() * (GAME_WIDTH - size) + size / 2;
        const y = Math.random() * (GAME_HEIGHT - size) + size / 2;
        
        // 确保敌人不会生成在角色附近
        const distanceFromCharacter = Math.sqrt(
            (x - character.x) * (x - character.x) + 
            (y - character.y) * (y - character.y)
        );
        
        if (distanceFromCharacter > GAME_WIDTH * 0.3) {
            enemies.push({
                x,
                y,
                width: size,
                height: size,
                health: 10 + currentWave * 5, // 敌人生命值随波次增加
                maxHealth: 10 + currentWave * 5,
                speed: 2 + currentWave * 0.2, // 敌人速度随波次增加
                color: getRandomEnemyColor(),
                targetX: character.x,
                targetY: character.y
            });
        }
    }
}

// 更新敌人状态
function updateEnemies(timestamp) {
    // 每波次开始时生成敌人
    if (enemies.length === 0 && gameState === 'playing') {
        currentWave++;
        spawnEnemies();
    }
    
    // 移动敌人并更新目标
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.targetX = character.x;
        enemy.targetY = character.y;
        
        // 计算敌人到角色的距离和方向
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        
        // 检测敌人与角色的碰撞
        if (checkCollision(character, enemy)) {
            // 角色受到伤害
            if (!character.shield) {
                character.health -= 5;
                if (character.health <= 0) {
                    character.health = 0;
                }
            }
            
            // 敌人击退效果
            const knockback = 20;
            enemy.x += (dx / distance) * knockback;
            enemy.y += (dy / distance) * knockback;
        }
        
        // 移除死亡的敌人
        if (enemy.health <= 0) {
            // 增加分数和金币
            score += 10 + currentWave * 5;
            coins += 5 + currentWave;
            
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
        // 敌人主体
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 敌人眼睛
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(enemy.x - enemy.width * 0.2, enemy.y - enemy.width * 0.3, enemy.width * 0.1, 0, Math.PI * 2);
        ctx.arc(enemy.x + enemy.width * 0.2, enemy.y - enemy.width * 0.3, enemy.width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // 敌人生命值条
        drawHealthBar(
            enemy.x - enemy.width / 2, 
            enemy.y - enemy.height / 2 - enemy.width / 2, 
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
    const angle = Math.atan2(character.direction.y, character.direction.x) || 0;
    
    bullets.push({
        x: character.x + Math.cos(angle) * (character.width / 2 + 10),
        y: character.y + Math.sin(angle) * (character.width / 2 + 10),
        width: BULLET_SIZE,
        height: BULLET_SIZE,
        speed: weapon.bulletSpeed,
        damage: weapon.damage,
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
        
        // 检测子弹与敌人的碰撞
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(i, 1);
                break;
            }
        }
        
        // 移除超出屏幕的子弹
        if (
            bullet.x < -BULLET_SIZE || 
            // 原代码未完整，可根据需求补充后续逻辑
        ) {
            bullets.splice(i, 1);
        }
    }
}