const fs = require('fs');
const path = require('path');

function getFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, ext, fileList);
    } else if (file.endsWith(ext)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const pages = getFiles('C:\\Users\\Njongo\\my-mvp1\\app', 'page.tsx');
const apiRoutes = getFiles('C:\\Users\\Njongo\\my-mvp1\\app', 'route.ts');

let out = "=== PAGES ===\n";
pages.forEach(p => out += p.replace('C:\\Users\\Njongo\\my-mvp1\\app\\', '').replace(/\\/g, '/') + '\n');
out += "\n=== API ROUTES ===\n";
apiRoutes.forEach(p => out += p.replace('C:\\Users\\Njongo\\my-mvp1\\app\\', '').replace(/\\/g, '/') + '\n');

fs.writeFileSync('C:\\Users\\Njongo\\my-mvp1\\tmp\\routes_output.json', JSON.stringify({ out }, null, 2), 'utf8');
