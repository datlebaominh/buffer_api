/**
 * VÍ DỤ SỬ DỤNG Buffer API Wrapper
 * ===================================
 * Yêu cầu: BUFFER_API_KEY, BUFFER_ORG_ID, BUFFER_CHANNELS trong .env
 * Nếu chưa có BUFFER_ORG_ID và BUFFER_CHANNELS, chạy setup.js trước:
 *   node --env-file=.env setup.js
 *
 * Cách chạy example:
 *   node --env-file=.env buffer_api_examples.js <1-6>
 */

const { createPost, createPostMultiChannel, POST_TYPE_CONFIG, driveToDirectUrl, dropboxToDirectUrl } = require("./buffer_api");

// Helper: đọc channels từ .env, báo lỗi nếu chưa có
function getChannelsFromEnv() {
  const raw = process.env.BUFFER_CHANNELS;
  if (!raw) {
    throw new Error("Chưa có BUFFER_CHANNELS trong .env. Hãy chạy: node --env-file=.env setup.js");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("BUFFER_CHANNELS trong .env không hợp lệ JSON. Hãy chạy lại setup.js");
  }
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 1: Đăng text đơn giản vào queue tự động
// ─────────────────────────────────────────────────────────────
async function example1_textPost() {
  console.log("📝 Example 1: Đăng text vào queue tự động\n");

  const channels = getChannelsFromEnv();
  const channel = channels[0];
  console.log(`   Đăng lên: ${channel.service} - ${channel.name}`);

  const service = channel.service.toLowerCase();
  const metadata = POST_TYPE_CONFIG[service]?.post ?? undefined;
  const post = await createPost({
    channelId: channel.id,
    text: "Đây là bài đăng tự động từ Buffer API! 🎉",
    metadata,
  });

  console.log("   ✅ Thành công!");
  console.log(`   Post ID : ${post.id}`);
  console.log(`   Nội dung: ${post.text}`);
  console.log(`   Lên lịch: ${post.dueAt}`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 2: Đăng bài kèm hình ảnh, lên lịch 3 phút tới
// ─────────────────────────────────────────────────────────────
async function example2_imagePostScheduled() {
  console.log("🖼️  Example 2: Đăng ảnh + lên lịch 3 phút tới\n");

  const channels = getChannelsFromEnv();
  const igChannel = channels.find((c) => c.service === "instagram") || channels[0];
  console.log(`   Đăng lên: ${igChannel.service} - ${igChannel.name}`);

  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  console.log(`   Lên lịch lúc: ${scheduledAt}`);

  // Ảnh từ Google Drive: paste sharing link, hàm tự chuyển thành direct URL
  // const imageUrl = driveToDirectUrl("https://drive.google.com/file/d/FILE_ID/view?usp=sharing");
  const imageUrl = "https://picsum.photos/1080/1080";

  const service = igChannel.service.toLowerCase();
  const metadata = POST_TYPE_CONFIG[service]?.post ?? undefined;
  const post = await createPost({
    channelId: igChannel.id,
    text: "Sản phẩm mới ra mắt! Đừng bỏ lỡ. #newproduct #launch",
    scheduledAt,
    imageUrls: [imageUrl],
    metadata,
  });

  console.log("   ✅ Thành công!");
  console.log(`   Post ID : ${post.id}`);
  console.log(`   Lên lịch: ${post.dueAt}`);
  console.log(`   Ảnh đính kèm: ${post.assets?.length ?? 0} file`);
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 3: Đăng bài lên NHIỀU nền tảng cùng lúc (use case chính)
// ─────────────────────────────────────────────────────────────
async function example3_multiPlatform() {
  console.log("🌐 Example 3: Đăng bài lên nhiều nền tảng\n");

  const result = await createPostMultiChannel({
    text: `🚀 Ra mắt tính năng mới!

Chúng tôi vừa cập nhật phiên bản mới với nhiều cải tiến vượt trội.
Trải nghiệm ngay hôm nay!

#update #newfeature #tech`,

    platforms: ["tiktok", "facebook"],
    scheduledAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    imageUrls: [
      "https://picsum.photos/1080/1080",
    ],
  });

  console.log("   📊 Tổng hợp kết quả:");
  console.log(`   Tổng số nền tảng : ${result.summary.total}`);
  console.log(`   Thành công        : ${result.summary.succeeded}`);
  console.log(`   Thất bại          : ${result.summary.failed}`);
  console.log("\n   Chi tiết từng nền tảng:");

  result.results.forEach((r) => {
    if (r.status === "success") {
      console.log(`   ✅ [${r.platform.toUpperCase()}] ${r.channelName}`);
      console.log(`      Post ID : ${r.post.id}`);
      console.log(`      Lên lịch: ${r.post.dueAt}`);
    } else {
      console.log(`   ❌ [${r.platform.toUpperCase()}] ${r.channelName}`);
      console.log(`      Lỗi: ${r.error}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 4: Đăng lên TẤT CẢ channels (không lọc platform)
// ─────────────────────────────────────────────────────────────
async function example4_allChannels() {
  console.log("📡 Example 4: Đăng lên TẤT CẢ channels\n");
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  const result = await createPostMultiChannel({
    text: "Thông báo quan trọng! Vui lòng đọc tin tức mới nhất từ chúng tôi.",
    platforms: [],
    scheduledAt,
    imageUrls: [
      "https://picsum.photos/1080/1080",
    ],
  });

  console.log(`   Tổng: ${result.summary.succeeded}/${result.summary.total} thành công\n`);
  result.results.forEach((r) => {
    if (r.status === "success") {
      console.log(`   ✅ [${r.platform.toUpperCase()}] ${r.channelName}`);
      console.log(`      Post ID : ${r.post.id}`);
      console.log(`      Lên lịch: ${r.post.dueAt}`);
    } else {
      console.log(`   ❌ [${r.platform.toUpperCase()}] ${r.channelName}`);
      console.log(`      Lỗi: ${r.error}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 5: Xem danh sách channels (đọc từ .env, không gọi API)
// ─────────────────────────────────────────────────────────────
async function example5_listChannels() {
  console.log("📋 Example 5: Liệt kê channels khả dụng\n");

  const channels = getChannelsFromEnv();
  console.log(`   Tìm thấy ${channels.length} channel(s):\n`);

  channels.forEach((ch, i) => {
    console.log(`   ${i + 1}. [${ch.service.toUpperCase().padEnd(12)}] ${ch.name}`);
    console.log(`      Channel ID: ${ch.id}`);
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMPLE 6: Đăng video (reel) lên TẤT CẢ nền tảng
// ─────────────────────────────────────────────────────────────
async function example6_videoAllPlatforms() {
  console.log("🎬 Example 6: Đăng video lên TẤT CẢ nền tảng\n");

  // Cách lấy URL video (chọn một trong các cách sau):
  //   Drive (thử trước, có thể thất bại nếu Google chặn phía server Buffer):
  //     const videoUrl = driveToDirectUrl("https://drive.google.com/file/d/FILE_ID/view", "video");
  //   Dropbox (ổn định hơn):
  //     const videoUrl = dropboxToDirectUrl("https://www.dropbox.com/s/.../video.mp4?dl=0");
  //   Direct URL:
  //     const videoUrl = "https://storage.googleapis.com/BUCKET/video.mp4";
  //
  // TikTok: ≤ 287 MB, 3–60 giây | Instagram Reel: ≤ 100 MB, 3–90 giây | Facebook Reel: ≤ 1 GB, 3–90 giây
  const videoUrl = driveToDirectUrl("https://drive.google.com/file/d/1hvQssAnImZqcbOvLih3S919FKaoON-GF/view?usp=sharing", "video"); // ← đổi FILE_ID
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  console.log(`   Video URL : ${videoUrl}`);
  console.log(`   Lên lịch  : ${scheduledAt}`);
  console.log(`   Post type : reel (Facebook/Instagram) | video (TikTok auto-fallback)\n`);

  // postType "reel" → Facebook/Instagram dùng reel, TikTok tự fallback về "video"
  const result = await createPostMultiChannel({
    text: `🎬 Video mới ra mắt!

Xem ngay để không bỏ lỡ những khoảnh khắc thú vị.

#video #reel #newcontent`,
    platforms: [],
    postType: "reel",
    scheduledAt,
    videoUrl,
  });

  console.log("   📊 Tổng hợp kết quả:");
  console.log(`   Tổng số nền tảng : ${result.summary.total}`);
  console.log(`   Thành công        : ${result.summary.succeeded}`);
  console.log(`   Thất bại          : ${result.summary.failed}`);
  console.log("\n   Chi tiết từng nền tảng:");

  result.results.forEach((r) => {
    if (r.status === "success") {
      console.log(`   ✅ [${r.platform.toUpperCase()}] ${r.channelName} (${r.postType})`);
      console.log(`      Post ID : ${r.post.id}`);
      console.log(`      Lên lịch: ${r.post.dueAt}`);
    } else {
      console.log(`   ❌ [${r.platform.toUpperCase()}] ${r.channelName} (${r.postType})`);
      console.log(`      Lỗi: ${r.error}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// CHẠY ĐỀ MÔ
// ─────────────────────────────────────────────────────────────
(async () => {
  const examples = {
    1: example1_textPost,
    2: example2_imagePostScheduled,
    3: example3_multiPlatform,
    4: example4_allChannels,
    5: example5_listChannels,
    6: example6_videoAllPlatforms,
  };

  const exNum = parseInt(process.argv[2]);

  if (exNum && examples[exNum]) {
    console.log(`\n${"=".repeat(50)}`);
    await examples[exNum]().catch((e) => console.error("❌ Lỗi:", e.message));
    console.log(`${"=".repeat(50)}\n`);
  } else {
    console.log("\n💡 Chạy example cụ thể: node --env-file=.env buffer_api_examples.js <1-6>\n");
    console.log(`${"=".repeat(50)}`);
    await example5_listChannels().catch((e) => console.error("❌ Lỗi:", e.message));
    console.log(`${"=".repeat(50)}\n`);
  }
})();
