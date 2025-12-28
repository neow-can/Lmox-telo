const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

// Default configuration
const defaultConfig = {
    logChannelId: null,
    adminLogChannelId: null,
    showTellonym: true,
    bannedUsers: [],
    rateLimits: {}, // Store rate limit data
    rateLimitConfig: {
        limit: 5, // 5 messages
        window: 1  // per 1 minute
    },
    messageStats: {
        question: 0,
        compliment: 0,
        advice: 0,
        confession: 0
    }
};

// Ensure config file exists
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
}

function getConfig() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading config:', err);
        return defaultConfig;
    }
}

function setConfig(newConfig) {
    try {
        const currentConfig = getConfig();
        const updatedConfig = { ...currentConfig, ...newConfig };
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 4));
        return updatedConfig;
    } catch (err) {
        console.error('Error writing config:', err);
        return null;
    }
}

// Rate limiting functions
function getUserRateLimit(userId) {
    const config = getConfig();
    return config.rateLimits[userId] || { count: 0, lastReset: Date.now() };
}

function updateUserRateLimit(userId, count) {
    const config = getConfig();
    const rateLimitConfig = config.rateLimitConfig || defaultConfig.rateLimitConfig;
    const windowMs = rateLimitConfig.window * 60000; // Convert minutes to milliseconds
    const now = Date.now();
    
    // Reset count if more than the window time has passed
    const userLimit = config.rateLimits[userId] || { count: 0, lastReset: now };
    if (now - userLimit.lastReset > windowMs) {
        userLimit.count = 0;
        userLimit.lastReset = now;
    }
    
    userLimit.count = count;
    config.rateLimits[userId] = userLimit;
    
    setConfig({ rateLimits: config.rateLimits });
    return userLimit;
}

function isRateLimited(userId) {
    const config = getConfig();
    const rateLimitConfig = config.rateLimitConfig || defaultConfig.rateLimitConfig;
    
    // If rate limiting is disabled
    if (rateLimitConfig.limit === 0) {
        return false;
    }
    
    const windowMs = rateLimitConfig.window * 60000; // Convert minutes to milliseconds
    const userLimit = getUserRateLimit(userId);
    const now = Date.now();
    
    // Reset count if more than the window time has passed
    if (now - userLimit.lastReset > windowMs) {
        userLimit.count = 0;
        userLimit.lastReset = now;
        updateUserRateLimit(userId, 0);
    }
    
    return userLimit.count >= rateLimitConfig.limit;
}

function getTimeLeft(userId) {
    const config = getConfig();
    const rateLimitConfig = config.rateLimitConfig || defaultConfig.rateLimitConfig;
    const windowMs = rateLimitConfig.window * 60000; // Convert minutes to milliseconds
    
    const userLimit = getUserRateLimit(userId);
    const now = Date.now();
    
    return Math.ceil((windowMs - (now - userLimit.lastReset)) / 1000);
}

// Message statistics functions
function incrementMessageType(type) {
    const config = getConfig();
    const messageStats = config.messageStats || defaultConfig.messageStats;
    
    if (messageStats.hasOwnProperty(type)) {
        messageStats[type]++;
        setConfig({ messageStats });
    }
}

function getMessageStats() {
    const config = getConfig();
    return config.messageStats || defaultConfig.messageStats;
}

module.exports = {
    getConfig,
    setConfig,
    getUserRateLimit,
    updateUserRateLimit,
    isRateLimited,
    getTimeLeft,
    incrementMessageType,
    getMessageStats
};