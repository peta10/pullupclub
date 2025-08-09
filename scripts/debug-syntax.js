#!/usr/bin/env node

/**
 * Debug script to check for JavaScript syntax errors
 * This helps identify issues that might cause "Invalid or unexpected token" errors
 */

const fs = require('fs');
const path = require('path');

// Files to check for syntax errors
const filesToCheck = [
  'app/layout.tsx',
  'app/page.tsx', 
  'app/providers.tsx',
  'app/leaderboard/page.tsx',
  'next.config.js'
];

console.log('🔍 Checking for JavaScript syntax errors...\n');

filesToCheck.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  ${filePath} - File not found`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Basic syntax checks
    const issues = [];
    
    // Check for common syntax issues
    if (content.includes('</') && !content.match(/<\/[^>]+>/)) {
      issues.push('Malformed closing tags');
    }
    
    // Check for unmatched brackets
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
    
    // Check for unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for unclosed strings (basic check)
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    const backticks = (content.match(/`/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      issues.push('Unclosed single quotes detected');
    }
    if (doubleQuotes % 2 !== 0) {
      issues.push('Unclosed double quotes detected');
    }
    if (backticks % 2 !== 0) {
      issues.push('Unclosed template literals detected');
    }
    
    if (issues.length === 0) {
      console.log(`✅ ${filePath} - Syntax looks good`);
    } else {
      console.log(`❌ ${filePath} - Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.log(`❌ ${filePath} - Error reading file: ${error.message}`);
  }
});

console.log('\n🏁 Syntax check complete!');
console.log('\nIf syntax errors persist:');
console.log('1. Check browser developer console for exact error location');
console.log('2. Run: npm run build (to get more detailed error messages)');
console.log('3. Check for invisible/special characters in code files');