/**
 * Script to fix TypeScript errors in power files
 * Run with: node fix-power-types.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const powersDir = path.join(__dirname, 'src', 'utils', 'powers');
const powerFiles = glob.sync('*.ts', { cwd: powersDir, absolute: false });

console.log(`Found ${powerFiles.length} power files to fix`);

let totalFixes = 0;

powerFiles.forEach(file => {
    const filePath = path.join(powersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let fixes = 0;
    
    // Fix 1: Remove lvl: X, lines
    const lvlPattern = /^\s+lvl:\s*\d+,?\s*$/gm;
    if (lvlPattern.test(content)) {
        content = content.replace(lvlPattern, '');
        fixes++;
    }
    
    // Fix 2: radiusM -> m
    if (content.includes('radiusM:')) {
        content = content.replace(/radiusM:/g, 'm:');
        fixes++;
    }
    
    // Fix 3: value -> rank in specials
    if (content.includes('value:')) {
        content = content.replace(/(\{[^}]*key:\s*['"][^'"]+['"],\s*)value:/g, '$1rank:');
        fixes++;
    }
    
    // Fix 4: Remove raiseCost from specials
    if (content.includes('raiseCost:')) {
        content = content.replace(/,\s*raiseCost:\s*\d+/g, '');
        fixes++;
    }
    
    // Fix 5: 'utility' -> 'none' in action
    if (content.includes("action: 'utility'")) {
        content = content.replace(/action:\s*'utility'/g, "action: 'none'");
        fixes++;
    }
    
    // Fix 6: 'aura' -> 'radius' in aoe shape (keep m value)
    if (content.includes("shape: 'aura'")) {
        content = content.replace(/shape:\s*'aura'/g, "shape: 'radius'");
        fixes++;
    }
    
    // Fix 7: 'masteryRankRounds' -> 'masteryRounds'
    if (content.includes("'masteryRankRounds'")) {
        content = content.replace(/'masteryRankRounds'/g, "'masteryRounds'");
        fixes++;
    }
    
    // Fix 8: Remove invalid EffectSpec fields
    const invalidEffectFields = ['flat:', 'tempHpDice:', 'notes:'];
    invalidEffectFields.forEach(field => {
        if (content.includes(field)) {
            // Remove field: value, patterns
            content = content.replace(new RegExp(`,\\s*${field}\\s*[^,}]+`, 'g'), '');
            content = content.replace(new RegExp(`${field}\\s*[^,}]+,\\s*`, 'g'), '');
            fixes++;
        }
    });
    
    if (fixes > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed ${fixes} issues in ${file}`);
        totalFixes += fixes;
    }
});

console.log(`\nTotal fixes applied: ${totalFixes}`);

