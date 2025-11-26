#!/usr/bin/env node

/**
 * Hugo to Eleventy Migration Script
 * 
 * Usage:
 *   node migrate.js <hugo-content-dir> <eleventy-src-dir>
 * 
 * Example:
 *   node migrate.js ../hugo-blog/content ./src
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node migrate.js <hugo-content-dir> <eleventy-src-dir>');
  process.exit(1);
}

const [hugoDir, eleventyDir] = args;

// Regex untuk parse front matter
const frontMatterRegex = /^---\n([\s\S]*?)\n---/;

// Convert Hugo date format ke simple date
function convertDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle ISO format dengan timezone
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return dateStr;
}

// Parse YAML-like front matter (simple parser)
function parseFrontMatter(content) {
  const match = content.match(frontMatterRegex);
  if (!match) return { frontMatter: {}, body: content };
  
  const yamlContent = match[1];
  const body = content.slice(match[0].length).trim();
  
  // Simple YAML parser
  const frontMatter = {};
  let currentKey = null;
  let inArray = false;
  let arrayItems = [];
  
  yamlContent.split('\n').forEach(line => {
    // Array item
    if (line.match(/^\s+-\s+/)) {
      const value = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '');
      arrayItems.push(value);
      return;
    }
    
    // If we were in array, save it
    if (inArray && currentKey) {
      frontMatter[currentKey] = arrayItems;
      arrayItems = [];
      inArray = false;
    }
    
    // Key: value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      let value = kvMatch[2].trim();
      
      // Check if starting array
      if (value === '' || value === '[]') {
        inArray = true;
        arrayItems = [];
        return;
      }
      
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      
      // Convert booleans
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      
      frontMatter[currentKey] = value;
    }
  });
  
  // Handle last array
  if (inArray && currentKey) {
    frontMatter[currentKey] = arrayItems;
  }
  
  return { frontMatter, body };
}

// Convert front matter untuk Eleventy
function convertFrontMatter(fm) {
  const newFm = { ...fm };
  
  // Convert dates
  if (newFm.date) {
    newFm.date = convertDate(newFm.date);
  }
  if (newFm.lastmod) {
    newFm.lastmod = convertDate(newFm.lastmod);
  }
  
  // Remove Hugo-specific fields
  delete newFm.url;
  delete newFm.images; // akan di-handle berbeda
  
  return newFm;
}

// Generate YAML dari object
function toYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        yaml += `${spaces}  - ${typeof item === 'string' && item.includes(':') ? `"${item}"` : item}\n`;
      });
    } else if (typeof value === 'object') {
      yaml += `${spaces}${key}:\n`;
      yaml += toYaml(value, indent + 1);
    } else if (typeof value === 'boolean') {
      yaml += `${spaces}${key}: ${value}\n`;
    } else if (typeof value === 'string' && (value.includes(':') || value.includes('"'))) {
      yaml += `${spaces}${key}: "${value.replace(/"/g, '\\"')}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }
  
  return yaml;
}

// Process single file
function processFile(srcPath, destPath) {
  const content = fs.readFileSync(srcPath, 'utf-8');
  const { frontMatter, body } = parseFrontMatter(content);
  const newFm = convertFrontMatter(frontMatter);
  
  const newContent = `---\n${toYaml(newFm)}---\n\n${body}`;
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, newContent);
  
  console.log(`✓ Migrated: ${srcPath} → ${destPath}`);
}

// Process directory recursively
function processDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    return;
  }
  
  const items = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item.name);
    const destPath = path.join(destDir, item.name);
    
    if (item.isDirectory()) {
      // Skip _index.md files, process subdirectories
      processDirectory(srcPath, destPath);
    } else if (item.name.endsWith('.md')) {
      // Skip _index.md (handled separately)
      if (item.name === '_index.md') {
        console.log(`⊘ Skipped: ${srcPath} (index file - needs manual conversion)`);
        continue;
      }
      processFile(srcPath, destPath);
    } else {
      // Copy non-markdown files (images, etc)
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`→ Copied: ${srcPath} → ${destPath}`);
    }
  }
}

// Main
console.log('🚀 Starting Hugo → Eleventy migration...\n');
console.log(`Source: ${hugoDir}`);
console.log(`Destination: ${eleventyDir}\n`);

processDirectory(hugoDir, eleventyDir);

console.log('\n✅ Migration complete!');
console.log('\nNext steps:');
console.log('1. Review migrated files');
console.log('2. Update _index.md files manually to use Eleventy layouts');
console.log('3. Convert Hugo shortcodes to Eleventy format');
console.log('4. Run: npm install && npm run dev');
