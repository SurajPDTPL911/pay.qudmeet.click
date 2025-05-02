// This script fixes route handlers to work with Next.js 15
// Run it with: node scripts/fix-route-handlers.js

const fs = require('fs');
const path = require('path');

// Function to recursively find all route.ts files in the app directory
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (
      (file === 'route.ts' || file === 'route.js') && 
      dir.includes('[') && 
      dir.includes(']')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to fix a route file
function fixRouteFile(filePath) {
  console.log(`Checking ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix GET handlers
  const getRegex = /export\s+async\s+function\s+GET\s*\(\s*(?:req|request)\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string\s*\}\s*\}\s*\)/g;
  if (getRegex.test(content)) {
    content = content.replace(
      getRegex,
      'export async function GET(req: Request, context: { params: { $1: string } })\n{\n  const { params } = context'
    );
    modified = true;
  }

  // Fix PATCH handlers
  const patchRegex = /export\s+async\s+function\s+PATCH\s*\(\s*(?:req|request)\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string\s*\}\s*\}\s*\)/g;
  if (patchRegex.test(content)) {
    content = content.replace(
      patchRegex,
      'export async function PATCH(req: Request, context: { params: { $1: string } })\n{\n  const { params } = context'
    );
    modified = true;
  }

  // Fix PUT handlers
  const putRegex = /export\s+async\s+function\s+PUT\s*\(\s*(?:req|request)\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string\s*\}\s*\}\s*\)/g;
  if (putRegex.test(content)) {
    content = content.replace(
      putRegex,
      'export async function PUT(req: Request, context: { params: { $1: string } })\n{\n  const { params } = context'
    );
    modified = true;
  }

  // Fix DELETE handlers
  const deleteRegex = /export\s+async\s+function\s+DELETE\s*\(\s*(?:req|request)\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*[a-zA-Z0-9_]+\s*:\s*string\s*\}\s*\}\s*\)/g;
  if (deleteRegex.test(content)) {
    content = content.replace(
      deleteRegex,
      'export async function DELETE(req: Request, context: { params: { $1: string } })\n{\n  const { params } = context'
    );
    modified = true;
  }

  // If the file was modified, write the changes
  if (modified) {
    console.log(`Fixing ${filePath}...`);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main function
function main() {
  const appDir = path.join(__dirname, '..', 'app');
  const routeFiles = findRouteFiles(appDir);
  
  console.log(`Found ${routeFiles.length} route files with dynamic parameters`);
  
  let fixedCount = 0;
  
  routeFiles.forEach(filePath => {
    if (fixRouteFile(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} route files`);
}

main();
