 
const fs = require("fs");
const path = require("path");

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes("node_modules") && !dirFile.includes(".next")) {
        walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith(".ts") || dirFile.endsWith(".tsx")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, "app"));
let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("alert(") || content.includes("window.confirm(")) {
    let newContent = content;
    
    // Replace window.confirm
    newContent = newContent.replace(/window\.confirm\(/g, "confirm(");
    
    // Replace alerts
    newContent = newContent.replace(/alert\((.*(?:error|fail|required|blocked|Wait).*)\)/gi, "toast.error($1)");
    newContent = newContent.replace(/alert\((.*(?:success|Complete|copied|live).*)\)/gi, "toast.success($1)");
    newContent = newContent.replace(/alert\(/g, "toast.info("); // default
    
    // Add import if toast is used and not imported
    if (newContent.includes("toast.") && !newContent.includes("import { toast }")) {
      // Find the last import statment and add it after
      const importPos = newContent.lastIndexOf("import ");
      if (importPos !== -1) {
        const endOfImport = newContent.indexOf("\n", importPos);
        newContent = newContent.slice(0, endOfImport + 1) + "import { toast } from \"sonner\";\n" + newContent.slice(endOfImport + 1);
      } else {
        newContent = "import { toast } from \"sonner\";\n" + newContent;
      }
    }
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, "utf8");
      replacedCount++;
      console.log(`Updated ${file}`);
    }
  }
});
console.log(`Done. Updated ${replacedCount} files.`);

