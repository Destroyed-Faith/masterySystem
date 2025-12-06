/**
 * Post-build script to add .js extensions to ES module imports
 * Required for Foundry VTT ES module loading
 */

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix: import ... from './path' or import ... from '../path'
    const importPatterns = [
      /from\s+['"](\.\/[^'"]+?)(?!\.js)['"]/g,
      /from\s+['"](\.\.\/[^'"]+?)(?!\.js)['"]/g
    ];
    
    for (const pattern of importPatterns) {
      const newContent = content.replace(pattern, (match, p1) => {
        if (!p1.endsWith('.js')) {
          modified = true;
          return match.replace(p1, `${p1}.js`);
        }
        return match;
      });
      if (newContent !== content) {
        content = newContent;
      }
    }
    
    // Fix: export * from './path' or export * from '../path'
    const exportStarPatterns = [
      /export\s+\*\s+from\s+['"](\.\/[^'"]+?)(?!\.js)['"]/g,
      /export\s+\*\s+from\s+['"](\.\.\/[^'"]+?)(?!\.js)['"]/g
    ];
    
    for (const pattern of exportStarPatterns) {
      const newContent = content.replace(pattern, (match, p1) => {
        if (!p1.endsWith('.js')) {
          modified = true;
          return `export * from '${p1}.js'`;
        }
        return match;
      });
      if (newContent !== content) {
        content = newContent;
      }
    }
    
    // Fix: export { ... } from './path' or export { ... } from '../path'
    const exportNamedPatterns = [
      /export\s+\{[^}]*\}\s+from\s+['"](\.\/[^'"]+?)(?!\.js)['"]/g,
      /export\s+\{[^}]*\}\s+from\s+['"](\.\.\/[^'"]+?)(?!\.js)['"]/g
    ];
    
    for (const pattern of exportNamedPatterns) {
      const newContent = content.replace(pattern, (match, p1) => {
        if (!p1.endsWith('.js')) {
          modified = true;
          return match.replace(p1, `${p1}.js`);
        }
        return match;
      });
      if (newContent !== content) {
        content = newContent;
      }
    }
    
    // Fix: export type { ... } from './path'
    const exportTypePatterns = [
      /export\s+type\s+\{[^}]*\}\s+from\s+['"](\.\/[^'"]+?)(?!\.js)['"]/g,
      /export\s+type\s+\{[^}]*\}\s+from\s+['"](\.\.\/[^'"]+?)(?!\.js)['"]/g
    ];
    
    for (const pattern of exportTypePatterns) {
      const newContent = content.replace(pattern, (match, p1) => {
        if (!p1.endsWith('.js')) {
          modified = true;
          return match.replace(p1, `${p1}.js`);
        }
        return match;
      });
      if (newContent !== content) {
        content = newContent;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Fix all .js files in dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  walkDir(distDir);
  console.log('Finished fixing imports');
} else {
  console.error('dist directory not found');
  process.exit(1);
}










