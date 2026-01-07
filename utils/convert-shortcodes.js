const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

/**
 * Convert Hugo shortcodes to Eleventy/Nunjucks shortcodes
 */
function convertShortcodes(content) {
  // Convert all remaining Hugo figure shortcodes using a more robust approach
  // This pattern handles various parameter orders and escapes quotes in caption
  content = content.replace(/\{\{<\s*figure\s+([^>]+)>\}\}/g, (match, params) => {
    // Extract parameters
    const srcMatch = params.match(/src="([^"]+)"/);
    const altMatch = params.match(/alt="([^"]+)"/);
    const widthMatch = params.match(/width="([^"]+)"/);
    const captionMatch = params.match(/caption="([^"]+)"/);

    const src = srcMatch ? srcMatch[1] : "";
    const alt = altMatch ? altMatch[1].replace(/"/g, '\\"') : "";
    const width = widthMatch ? widthMatch[1] : "";
    const caption = captionMatch ? captionMatch[1].replace(/"/g, '\\"') : "";

    let result = `{% figure "${src}", "${alt}"`;
    if (width) result += `, "${width}"`;
    if (caption) result += `, "${caption}"`;
    result += " %}";
    return result;
  });

  // Convert {{< photo src="..." alt="..." caption="..." >}}
  content = content.replace(/\{\{<\s*photo\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*>\}\}/g,
    '{% photo "$1", "$2", "$3" %}'
  );

  // Convert {{< photo src="..." alt="..." >}}
  content = content.replace(/\{\{<\s*photo\s+src="([^"]+)"\s+alt="([^"]+)"\s*>\}\}/g,
    '{% photo "$1", "$2" %}'
  );

  return content;
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  // Convert shortcodes
  const newContent = convertShortcodes(content);

  // Fix front matter issues
  // - Remove empty description
  if (data.description === "") {
    delete data.description;
  }

  // - Convert date format if needed
  if (data.date && typeof data.date === "string" && data.date.includes("T")) {
    data.date = data.date.split("T")[0];
  }
  if (data.lastmod && typeof data.lastmod === "string" && data.lastmod.includes("T")) {
    data.lastmod = data.lastmod.split("T")[0];
  }
  if (data.shot_date && typeof data.shot_date === "string" && data.shot_date.includes("T")) {
    data.shot_date = data.shot_date.split("T")[0];
  }

  // Write back
  const newFileContent = matter.stringify(newContent, data);
  fs.writeFileSync(filePath, newFileContent);
  console.log(`Converted: ${filePath}`);
}

/**
 * Recursively process directory
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (path.extname(file) === ".md") {
      processFile(filePath);
    }
  }
}

// Process src directory
const srcDir = path.resolve(process.cwd(), "src");
console.log("Converting Hugo shortcodes to Eleventy...");
processDirectory(srcDir);
console.log("Done!");
