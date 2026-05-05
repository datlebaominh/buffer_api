/**
 * Trích xuất URL từ nhiều sitemap XML → ghi vào file urls.txt
 * Chạy: node extract_sitemap.js
 */

const https = require("https");
const http = require("http");
const fs = require("fs");

// ─── DANH SÁCH SITEMAP CẦN TRÍCH XUẤT ───────────────────────
const SITEMAPS = [
  "https://giaonhanh.vn/post-sitemap-1.xml",
  "https://giaonhanh.vn/post-sitemap-2.xml",
  "https://giaonhanh.vn/post-sitemap-3.xml",
  "https://giaonhanh.vn/post-sitemap-4.xml",
  "https://giaonhanh.vn/page-sitemap.xml",
  "https://giaonhanh.vn/category-sitemap.xml",
  "https://giaonhanh.vn/product-sitemap.xml",
  "https://giaonhanh.vn/product_cat-sitemap.xml"
];

const URLS_PER_FILE = 500;       // Số URL tối đa mỗi file
const OUTPUT_PREFIX = "urls";    // Tên file: urls_1.txt, urls_2.txt, ...
// ─────────────────────────────────────────────────────────────
 
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}
 
function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((m) => m[1].trim())
    .filter(Boolean);
}
 
function writeChunks(allUrls) {
  const files = [];
  let fileIndex = 1;
 
  for (let i = 0; i < allUrls.length; i += URLS_PER_FILE) {
    const chunk = allUrls.slice(i, i + URLS_PER_FILE);
    const filename = `${OUTPUT_PREFIX}_${fileIndex}.txt`;
    fs.writeFileSync(filename, chunk.join("\n") + "\n", "utf8");
    files.push({ filename, count: chunk.length });
    fileIndex++;
  }
 
  return files;
}
 
(async () => {
  console.log(`\n🚀 Bắt đầu trích xuất ${SITEMAPS.length} sitemap...\n`);
 
  const allUrls = [];
 
  for (let i = 0; i < SITEMAPS.length; i++) {
    const url = SITEMAPS[i];
    process.stdout.write(`[${i + 1}/${SITEMAPS.length}] ${url} ... `);
    try {
      const xml = await fetchUrl(url);
      const urls = extractLocs(xml);
      allUrls.push(...urls);
      console.log(`✅ ${urls.length} URL`);
    } catch (e) {
      console.log(`❌ Lỗi: ${e.message}`);
    }
  }
 
  if (allUrls.length === 0) {
    console.log("\n⚠️  Không có URL nào để ghi.\n");
    return;
  }
 
  const files = writeChunks(allUrls);
 
  console.log(`\n📊 Kết quả:`);
  files.forEach((f) => console.log(`   💾 ${f.filename} — ${f.count} URL`));
  console.log(`\n✅ Tổng cộng: ${allUrls.length} URL → ${files.length} file\n`);
})();