/**
 * Chạy 1 lần cho mỗi Buffer account để lấy danh sách channels,
 * sau đó thêm output vào .env.
 *
 * Yêu cầu: BUFFER_API_KEY trong .env (key của account cần setup)
 * Lệnh:    node --env-file=.env setup.js
 *
 * Multi-account (free tier 3 channels/account):
 *   1. Đặt BUFFER_API_KEY=<key account 1> trong .env, chạy setup → copy output vào .env
 *   2. Đặt BUFFER_API_KEY=<key account 2> trong .env, chạy setup → copy thêm vào .env
 *   3. Lặp lại cho các account tiếp theo
 *
 * Cấu trúc .env sau khi setup:
 *   BUFFER_FACEBOOK_CHANNELS='[{"id":"...","name":"...","service":"facebook","apiKey":"key1"}]'
 *   BUFFER_INSTAGRAM_CHANNELS='[{"id":"...","name":"...","service":"instagram","apiKey":"key1"}]'
 *   BUFFER_TIKTOK_CHANNELS='[{"id":"...","name":"...","service":"tiktok","apiKey":"key2"}]'
 *   ...
 */

const BufferClient = require("./buffer_api");

// Normalize tên service Buffer API → tên biến môi trường
const SERVICE_TO_ENV_PREFIX = {
  facebook:        "BUFFER_FACEBOOK_CHANNELS",
  instagram:       "BUFFER_INSTAGRAM_CHANNELS",
  tiktok:          "BUFFER_TIKTOK_CHANNELS",
  threads:         "BUFFER_THREADS_CHANNELS",
  twitter:         "BUFFER_TWITTER_CHANNELS",
  x:               "BUFFER_TWITTER_CHANNELS",
  linkedin:        "BUFFER_LINKEDIN_CHANNELS",
  youtube:         "BUFFER_YOUTUBE_CHANNELS",
  bluesky:         "BUFFER_BLUESKY_CHANNELS",
  pinterest:       "BUFFER_PINTEREST_CHANNELS",
  mastodon:        "BUFFER_MASTODON_CHANNELS",
  google:          "BUFFER_GOOGLE_BUSINESS_CHANNELS",
  google_business: "BUFFER_GOOGLE_BUSINESS_CHANNELS",
};

(async () => {
  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    console.error("❌ Thiếu BUFFER_API_KEY trong .env");
    process.exit(1);
  }

  const client = BufferClient.fromEnv();

  // ── Bước 1: Lấy tổ chức ─────────────────────────────────────
  console.log("🔍 Đang lấy danh sách tổ chức...");
  const orgs = await client.getOrganizations();

  if (orgs.length === 0) {
    throw new Error("Không tìm thấy tổ chức nào. Kiểm tra lại BUFFER_API_KEY.");
  }

  const org = orgs[0];
  console.log(`   → Tổ chức: "${org.name}" (${org.id})\n`);

  // ── Bước 2: Lấy channels ─────────────────────────────────────
  console.log("📡 Đang lấy danh sách channels...");
  const channels = await client.getChannels(org.id);

  if (channels.length === 0) {
    throw new Error(
      "Không tìm thấy channel nào. Hãy kết nối ít nhất một mạng xã hội trong Buffer."
    );
  }

  console.log(`   Tìm thấy ${channels.length} channel(s):\n`);
  channels.forEach((ch, i) => {
    console.log(`   ${i + 1}. [${ch.service.toUpperCase().padEnd(14)}] ${ch.name}`);
    console.log(`      ID: ${ch.id}`);
  });

  // ── Bước 3: Gom channels theo platform ───────────────────────
  const byEnvKey = {};
  for (const ch of channels) {
    const envKey = SERVICE_TO_ENV_PREFIX[ch.service?.toLowerCase()];
    if (!envKey) {
      console.warn(`   ⚠️  Service "${ch.service}" chưa được hỗ trợ, bỏ qua.`);
      continue;
    }
    if (!byEnvKey[envKey]) byEnvKey[envKey] = [];
    byEnvKey[envKey].push({ id: ch.id, name: ch.name, service: ch.service, apiKey });
  }

  // ── Bước 4: In output ─────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("✅ Thêm các dòng sau vào file .env:\n");

  for (const [envKey, chList] of Object.entries(byEnvKey)) {
    console.log(`${envKey}='${JSON.stringify(chList)}'`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("💡 Nếu bạn có nhiều account (free tier), đổi BUFFER_API_KEY sang");
  console.log("   account tiếp theo và chạy lại setup.js để lấy thêm channels.\n");
})().catch((e) => {
  console.error("❌ Lỗi:", e.message);
  process.exit(1);
});
