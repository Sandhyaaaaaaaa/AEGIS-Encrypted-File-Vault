/**
 * Key Strength Validation Module
 * Rule-Based Analyzer for encryption key strength
 */

export const validateKeyStrength = (key) => {
  if (!key) {
    return {
      score: 0,
      strength: 'none',
      feedback: ['Please enter a secret phrase'],
      color: '#ef4444',
    };
  }

  let score = 0;
  const feedback = [];
  const checks = {
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    special: false,
    diversity: false,
  };

  // Length check (0-30 points)
  if (key.length >= 16) {
    score += 30;
    checks.length = true;
  } else if (key.length >= 12) {
    score += 20;
    feedback.push('Try making the phrase at least 16 characters long');
  } else if (key.length >= 8) {
    score += 10;
    feedback.push('This phrase is a bit short. 16 characters would be better');
  } else {
    feedback.push('Please use a longer phrase (at least 16 characters)');
  }

  // Character diversity checks (70 points total)
  if (/[A-Z]/.test(key)) {
    score += 15;
    checks.uppercase = true;
  } else {
    feedback.push('Try adding some CAPITAL letters (A-Z)');
  }

  if (/[a-z]/.test(key)) {
    score += 15;
    checks.lowercase = true;
  } else {
    feedback.push('Try adding small letters (a-z)');
  }

  if (/[0-9]/.test(key)) {
    score += 15;
    checks.numbers = true;
  } else {
    feedback.push('Try adding some numbers (0-9)');
  }

  if (/[ !@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(key)) {
  // Key contains special characters

    score += 15;
    checks.special = true;
  } else {
    feedback.push('Try adding symbols like ! or @');
  }

  // Character diversity bonus
  const uniqueChars = new Set(key).size;
  if (uniqueChars >= key.length * 0.7) {
    score += 10;
    checks.diversity = true;
  } else {
    feedback.push('Try using different types of letters');
  }

  // Common patterns penalty
  const commonPatterns = [
    /123|234|345|456|567|678|789/,
    /abc|bcd|cde|def|efg|fgh/i,
    /password|admin|user|key|secret/i,
    /qwerty|asdf|zxcv/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(key)) {
      score -= 15;
      feedback.push('Avoid using simple patterns or repeat letters');
      break;
    }
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let strength, color;
  if (score >= 80) {
    strength = 'strong';
    color = '#10b981';
    if (feedback.length === 0) feedback.push('Great! This is a very strong phrase');
  } else if (score >= 60) {
    strength = 'good';
    color = '#3b82f6';
    if (feedback.length === 0) feedback.push('Nice! This is a good phrase');
  } else if (score >= 40) {
    strength = 'medium';
    color = '#f59e0b';
    if (feedback.length === 0) feedback.push('This phrase is okay, but could be stronger');
  } else if (score >= 20) {
    strength = 'weak';
    color = '#ef4444';
    if (feedback.length === 0) feedback.push('This phrase is quite weak');
  } else {
    strength = 'very weak';
    color = '#dc2626';
    if (feedback.length === 0) feedback.push('This phrase is very weak');
  }

  return {
    score,
    strength,
    feedback: feedback.slice(0, 3), // Limit to 3 suggestions
    color,
    checks,
  };
};

// Generate a strong key suggestion
export const generateStrongKey = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';
  
  const all = uppercase + lowercase + numbers + special;
  let key = '';
  
  // Ensure at least one of each type
  key += uppercase[Math.floor(Math.random() * uppercase.length)];
  key += lowercase[Math.floor(Math.random() * lowercase.length)];
  key += numbers[Math.floor(Math.random() * numbers.length)];
  key += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly (total 20 characters)
  for (let i = 4; i < 20; i++) {
    key += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the key
  return key.split('').sort(() => Math.random() - 0.5).join('');
};
