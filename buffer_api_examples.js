/**
 * VÍ DỤ SỬ DỤNG BufferClient
 * ===================================
 * Yêu cầu: BUFFER_API_KEY, BUFFER_CHANNELS trong .env
 * Chạy setup.js nếu chưa có BUFFER_CHANNELS:
 *   node --env-file=.env setup.js
 *
 * Cách chạy:
 *   node --env-file=.env buffer_api_examples.js <1-9>
 */

const BufferClient = require("./buffer_api");
const { isGoogleDriveUrl, resolveMediaUrl } = require("./utils/media");

const client = BufferClient.fromEnv();

function getChannel(service) {
  const channels = client.getChannelsFromEnv();
  return channels.find((c) => c.service.toLowerCase() === service.toLowerCase());
}

function requireChannel(service) {
  const ch = getChannel(service);
  if (!ch) throw new Error(`Không tìm thấy channel "${service}". Kiểm tra lại kết nối trong Buffer.`);
  return ch;
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 1: Liệt kê channels (đọc từ .env)
// ─────────────────────────────────────────────────────────────
async function example1_listChannels() {
  console.log("📋 Example 1: Liệt kê channels\n");

  const channels = client.getChannelsFromEnv();
  console.log(`   Tìm thấy ${channels.length} channel(s):\n`);
  channels.forEach((ch, i) => {
    console.log(`   ${i + 1}. [${ch.service.toUpperCase().padEnd(14)}] ${ch.name}`);
    console.log(`      ID: ${ch.id}`);
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 2: Facebook — post thường + lên lịch
// ─────────────────────────────────────────────────────────────
async function example2_facebookPost() {
  console.log("📘 Example 2: Facebook — post thường\n");

  const ch = requireChannel("facebook");
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  const post = await client.facebook.createPost(ch.id, {
    text: "Bài đăng mới từ Buffer API! 🚀\n\n#update #newfeature",
    imageUrls: ["https://picsum.photos/1200/630"],
    scheduledAt,
    // firstComment: "Cảm ơn mọi người đã theo dõi!",
    // linkAttachment: { url: "https://example.com" },
  });

  console.log(`   ✅ Post ID : ${post.id}`);
  console.log(`   Lên lịch  : ${post.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 3: Facebook Reel — video từ Google Drive (auto-detect)
// ─────────────────────────────────────────────────────────────
async function example3_facebookReel() {
  console.log("🎬 Example 3: Facebook Reel — video từ Drive\n");

  const ch = requireChannel("facebook");

  // Paste sharing link Drive trực tiếp — auto-convert bên trong
  const videoUrl = "https://drive.google.com/file/d/REPLACE_VIDEO_FILE_ID/view?usp=sharing";
  if (isGoogleDriveUrl(videoUrl)) {
    console.log(`   Drive URL → ${resolveMediaUrl(videoUrl, "video")}`);
  }

  const post = await client.facebook.createReel(ch.id, {
    videoUrl,
    text: "Reel mới ra mắt! 🎉 #reel #video",
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  });

  console.log(`   ✅ Post ID : ${post.id}`);
  console.log(`   Lên lịch  : ${post.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 4: Instagram — post ảnh từ Drive + Story
// ─────────────────────────────────────────────────────────────
async function example4_instagram() {
  console.log("📸 Example 4: Instagram — post ảnh + story\n");

  const ch = requireChannel("instagram");
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  // Post ảnh thường
  const imageUrls = [
    "https://drive.google.com/file/d/REPLACE_IMAGE_FILE_ID/view?usp=sharing",
  ];
  console.log("   [Post]");
  const post = await client.instagram.createPost(ch.id, {
    text:      "Sản phẩm mới ra mắt! 🌟 #newproduct",
    imageUrls,
    scheduledAt,
    firstComment: "Link trong bio 👆",
  });
  console.log(`   ✅ Post ID: ${post.id} | Lên lịch: ${post.dueAt}`);

  // Story
  console.log("\n   [Story]");
  const story = await client.instagram.createStory(ch.id, {
    imageUrls: ["https://picsum.photos/1080/1920"],
    scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  console.log(`   ✅ Post ID: ${story.id} | Lên lịch: ${story.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 5: TikTok — video và photo slideshow
// ─────────────────────────────────────────────────────────────
async function example5_tiktok() {
  console.log("🎵 Example 5: TikTok — video + photo slideshow\n");

  const ch = requireChannel("tiktok");
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  // Video
  console.log("   [Video]");
  const video = await client.tiktok.createVideo(ch.id, {
    videoUrl:  "https://drive.google.com/file/d/REPLACE_VIDEO_FILE_ID/view?usp=sharing",
    text:      "Video trending hôm nay! 🔥 #tiktok #viral",
    scheduledAt,
  });
  console.log(`   ✅ Post ID: ${video.id}`);

  // Photo slideshow
  console.log("\n   [Photo slideshow]");
  const photo = await client.tiktok.createPhoto(ch.id, {
    imageUrls: [
      "https://picsum.photos/1080/1920",
      "https://picsum.photos/1080/1920?v=2",
    ],
    title:     "Album ảnh 2026",
    text:      "Slideshow mới nhất! 📸 #photo",
    scheduledAt: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
  });
  console.log(`   ✅ Post ID: ${photo.id}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 6: Threads — bài đơn với metadata đầy đủ
// ─────────────────────────────────────────────────────────────
async function example6_threadsPost() {
  console.log("🧵 Example 6: Threads — bài đơn\n");

  const ch = requireChannel("threads");

  const post = await client.threads.createPost(ch.id, {
    text:      "Viết code tốt không phải là viết nhanh — mà là viết rõ ràng 💡",
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    // imageUrls: ["https://..."],
    // linkAttachment: { url: "https://example.com/blog" },
    // topic: "technology",
  });

  console.log(`   ✅ Post ID : ${post.id}`);
  console.log(`   Lên lịch  : ${post.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 7: Threads — chuỗi thread nhiều bài
// ─────────────────────────────────────────────────────────────
async function example7_threadsThread() {
  console.log("🧵 Example 7: Threads — chuỗi thread 4 bài\n");

  const ch = requireChannel("threads");

  const posts = [
    { text: "🧵 3 bài học tôi rút ra sau 5 năm làm lập trình viên (1/4)" },
    { text: "1️⃣ Đọc code cũ trước khi viết code mới.\n\nPhần lớn bugs đến từ việc không hiểu context. (2/4)" },
    { text: "2️⃣ Đặt tên biến như đang giải thích cho người khác.\n\n`data` → `activeUserList` (3/4)" },
    { text: "3️⃣ Commit nhỏ và thường xuyên.\n\nMỗi commit làm đúng một việc. (4/4)\n\n— Bạn có thêm bài học nào? 👇" },
  ];

  console.log(`   Chuỗi ${posts.length} bài:`);
  posts.forEach((p, i) => console.log(`   [${i + 1}] ${p.text.split("\n")[0]}`));
  console.log();

  const post = await client.threads.createThread(ch.id, {
    posts,
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  });

  console.log(`   ✅ Post ID : ${post.id}`);
  console.log(`   Lên lịch  : ${post.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 8: Multi-channel — đăng lên Facebook + Instagram cùng lúc
// ─────────────────────────────────────────────────────────────
async function example8_multiChannel() {
  console.log("🌐 Example 8: Multi-channel — Facebook + Instagram\n");

  const result = await client.postToChannels({
    platforms: ["facebook", "instagram"],
    text: `🚀 Ra mắt tính năng mới!\n\nCập nhật phiên bản mới với nhiều cải tiến.\nTrải nghiệm ngay!\n\n#update #newfeature`,
    imageUrls:   ["https://picsum.photos/1080/1080"],
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  });

  console.log(`   Tổng: ${result.summary.succeeded}/${result.summary.total} thành công\n`);
  result.results.forEach((r) => {
    if (r.status === "success") {
      console.log(`   ✅ [${r.platform.toUpperCase()}] ${r.channelName} → ${r.post.id}`);
    } else {
      console.log(`   ❌ [${r.platform.toUpperCase()}] ${r.channelName} → ${r.error}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 9: Multi-channel — đăng lên TẤT CẢ platforms
// ─────────────────────────────────────────────────────────────
async function example9_allPlatforms() {
  console.log("📡 Example 9: TẤT CẢ platforms\n");

  const result = await client.postToChannels({
    text:        "Thông báo quan trọng từ chúng tôi 📢",
    imageUrls:   ["https://picsum.photos/1080/1080"],
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  });

  console.log(`   Tổng: ${result.summary.succeeded}/${result.summary.total} thành công\n`);
  result.results.forEach((r) => {
    const icon = r.status === "success" ? "✅" : "❌";
    const detail = r.status === "success" ? r.post.id : r.error;
    console.log(`   ${icon} [${r.platform.toUpperCase().padEnd(14)}] ${r.channelName}`);
    console.log(`      ${detail}`);
  });
}

// ─────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────
(async () => {
  const examples = {
    1: example1_listChannels,
    2: example2_facebookPost,
    3: example3_facebookReel,
    4: example4_instagram,
    5: example5_tiktok,
    6: example6_threadsPost,
    7: example7_threadsThread,
    8: example8_multiChannel,
    9: example9_allPlatforms,
  };

  const n = parseInt(process.argv[2]);

  if (n && examples[n]) {
    console.log(`\n${"=".repeat(55)}`);
    await examples[n]().catch((e) => console.error("❌ Lỗi:", e.message));
    console.log(`${"=".repeat(55)}\n`);
  } else {
    console.log("\n💡 node --env-file=.env buffer_api_examples.js <1-9>\n");
    console.log("   1 — Liệt kê channels");
    console.log("   2 — Facebook: post thường");
    console.log("   3 — Facebook: Reel từ Google Drive");
    console.log("   4 — Instagram: post ảnh + story");
    console.log("   5 — TikTok: video + photo slideshow");
    console.log("   6 — Threads: bài đơn");
    console.log("   7 — Threads: chuỗi thread 4 bài");
    console.log("   8 — Multi-channel: Facebook + Instagram");
    console.log("   9 — Tất cả platforms");
    console.log(`\n${"=".repeat(55)}`);
    await example1_listChannels().catch((e) => console.error("❌ Lỗi:", e.message));
    console.log(`${"=".repeat(55)}\n`);
  }
})();
