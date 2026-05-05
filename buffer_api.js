/**
 * Buffer API Wrapper
 * REST-style interface trên Buffer GraphQL API (https://api.buffer.com)
 *
 * Tài liệu tham khảo: https://developers.buffer.com/
 *
 * Các chức năng chính:
 *  - getOrganizations()          → Lấy danh sách tổ chức
 *  - getChannels(orgId)          → Lấy danh sách channels (nền tảng đã kết nối)
 *  - createPost(options)         → Đăng bài lên MỘT channel
 *  - createPostMultiChannel(...) → Đăng bài lên NHIỀU channel cùng lúc
 *
 * Yêu cầu: Node.js >= 18. Biến môi trường: BUFFER_API_KEY, BUFFER_CHANNELS (xem setup.js)
 */

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const BUFFER_API_URL = "https://api.buffer.com/graphql";

function getApiKey() {
  const key = process.env.BUFFER_API_KEY;
  if (!key) {
    throw new Error("Thiếu BUFFER_API_KEY. Hãy thêm vào file .env");
  }
  return key;
}

// ─────────────────────────────────────────────────────────────
// POST TYPE CONFIG: KEYMAP ĐẦY ĐỦ CHO TỪNG PLATFORM
// ─────────────────────────────────────────────────────────────

/**
 * Keymap metadata bắt buộc cho từng platform và từng loại bài đăng.
 *
 * Nguồn: schema introspection Buffer GraphQL API
 *   - facebook:  FacebookPostMetadataInput → type: PostTypeFacebook! (post | story | reel)
 *   - instagram: InstagramPostMetadataInput → type: PostType!, shouldShareToFeed: Boolean!
 *   - tiktok:    TikTokPostMetadataInput   → không có field type/bắt buộc;
 *                loại bài được xác định bởi asset (imageUrls → photo, videoUrl → video)
 *
 * Sử dụng:
 *   POST_TYPE_CONFIG.facebook.reel   → metadata để đăng reel lên Facebook
 *   POST_TYPE_CONFIG.instagram.story → metadata để đăng story lên Instagram
 */
const POST_TYPE_CONFIG = {
  facebook: {
    post:  { facebook: { type: "post"  } },
    story: { facebook: { type: "story" } },
    reel:  { facebook: { type: "reel"  } },
  },
  instagram: {
    post:  { instagram: { type: "post",  shouldShareToFeed: true  } },
    story: { instagram: { type: "story", shouldShareToFeed: false } },
    reel:  { instagram: { type: "reel",  shouldShareToFeed: true  } },
  },
  tiktok: {
    video: null,  // không cần metadata — loại được xác định bởi asset
    photo: null,
  },
};

/**
 * Loại bài mặc định cho từng platform khi không chỉ định postType.
 * Dùng khi gọi createPostMultiChannel() mà không truyền postType.
 */
const DEFAULT_POST_TYPE = {
  facebook:  "post",
  instagram: "post",
  tiktok:    "video",
};

// ─────────────────────────────────────────────────────────────
// CORE: GỬI GRAPHQL REQUEST
// ─────────────────────────────────────────────────────────────

/**
 * Gửi một GraphQL query hoặc mutation đến Buffer API.
 * @param {string} query     - GraphQL query/mutation string
 * @param {object} variables - GraphQL variables (tuỳ chọn)
 * @returns {Promise<object>}
 */
async function graphqlRequest(query, variables = {}) {
  let response;
  try {
    response = await fetch(BUFFER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw new Error(`Không thể kết nối đến Buffer API: ${err.message}`);
  }

  if (!response.ok) {
    let detail = "";
    try { detail = await response.text(); } catch {}
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}` +
      (detail ? ` — ${detail}` : "")
    );
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error("Buffer API trả về response không hợp lệ (không phải JSON)");
  }

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new Error(`GraphQL Error: ${messages}`);
  }

  return json.data;
}

// ─────────────────────────────────────────────────────────────
// QUERY: TỔ CHỨC & CHANNELS
// ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tổ chức. Chỉ cần gọi một lần (xem setup.js).
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function getOrganizations() {
  const data = await graphqlRequest(`
    query GetOrganizations {
      account {
        organizations { id name }
      }
    }
  `);
  return data.account.organizations;
}

/**
 * Lấy danh sách channels. Chỉ cần gọi một lần (xem setup.js).
 * @param {string} organizationId
 * @returns {Promise<Array<{id: string, name: string, service: string}>>}
 */
async function getChannels(organizationId) {
  if (!organizationId) throw new Error("organizationId là bắt buộc");

  const data = await graphqlRequest(
    `
    query GetChannels($orgId: OrganizationId!) {
      channels(input: { organizationId: $orgId }) {
        id name service
      }
    }
    `,
    { orgId: organizationId }
  );
  return data.channels;
}

// ─────────────────────────────────────────────────────────────
// MUTATION: TẠO POST
// ─────────────────────────────────────────────────────────────

/**
 * Đăng bài lên MỘT channel.
 *
 * Thông thường nên dùng createPostMultiChannel() — hàm đó tự inject
 * metadata đúng theo platform. Dùng createPost() trực tiếp khi cần
 * kiểm soát metadata thủ công.
 *
 * @param {object}   options
 * @param {string}   options.channelId     - ID channel đích (bắt buộc)
 * @param {string}   options.text          - Nội dung bài đăng (bắt buộc)
 * @param {string}   [options.scheduledAt] - ISO 8601 UTC, VD: "2026-06-01T09:00:00.000Z"
 *                                           Bỏ qua → tự động xếp vào hàng đợi
 * @param {string[]} [options.imageUrls]   - Mảng URL hình ảnh (tối đa 10)
 * @param {string}   [options.videoUrl]    - URL video (dùng cho reel/video post)
 *                                           Ưu tiên hơn imageUrls nếu truyền cả hai
 * @param {object}   [options.metadata]    - Metadata platform-specific (xem POST_TYPE_CONFIG)
 *
 * @returns {Promise<{id: string, text: string, dueAt: string, status: string, assets: Array}>}
 */
async function createPost({ channelId, text, scheduledAt, imageUrls = [], videoUrl, metadata }) {
  if (!channelId) throw new Error("channelId là bắt buộc");
  if (!text) throw new Error("text (nội dung) là bắt buộc");

  const input = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: scheduledAt ? "customScheduled" : "addToQueue",
  };

  if (scheduledAt) input.dueAt = scheduledAt;

  if (videoUrl) {
    input.assets = { videos: [{ url: videoUrl }] };
  } else if (imageUrls.length > 0) {
    input.assets = { images: imageUrls.map((url) => ({ url })) };
  }

  if (metadata) input.metadata = metadata;

  const data = await graphqlRequest(
    `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            text
            dueAt
            status
            assets { id mimeType }
          }
        }
        ... on MutationError {
          message
        }
      }
    }
    `,
    { input }
  );

  const result = data?.createPost;
  if (!result) {
    throw new Error("Buffer API trả về kết quả không hợp lệ");
  }
  if (result.message) {
    throw new Error(`Buffer từ chối tạo post: ${result.message}`);
  }
  if (!result.post) {
    throw new Error("Buffer không trả về thông tin post sau khi tạo thành công");
  }

  return result.post;
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION: ĐĂNG BÀI LÊN NHIỀU NỀN TẢNG
// ─────────────────────────────────────────────────────────────

/**
 * Đăng bài lên NHIỀU channel cùng lúc.
 *
 * Tự động inject metadata đúng cho từng platform dựa trên postType.
 * Đọc danh sách channels từ BUFFER_CHANNELS trong .env (không gọi API thêm).
 * Các channel lỗi không làm gián đoạn các channel khác.
 *
 * Các loại bài hỗ trợ (postType):
 *   "post"  → Facebook, Instagram (mặc định)
 *   "story" → Facebook, Instagram
 *   "reel"  → Facebook, Instagram
 *   "video" → TikTok (mặc định, cần videoUrl)
 *   "photo" → TikTok (cần imageUrls)
 *
 * @param {object}   options
 * @param {string}   options.text           - Nội dung bài đăng (bắt buộc)
 * @param {string[]} [options.platforms]    - Danh sách nền tảng, VD: ["facebook", "instagram"]
 *                                            Để [] hoặc bỏ qua → đăng lên TẤT CẢ channels
 * @param {string}   [options.postType]     - Loại bài đăng: "post" | "story" | "reel" | "video" | "photo"
 *                                            Mặc định: "post" (Facebook/Instagram), "video" (TikTok)
 * @param {string}   [options.scheduledAt]  - ISO 8601 UTC (tuỳ chọn)
 * @param {string[]} [options.imageUrls]    - URL hình ảnh — bắt buộc với Instagram/TikTok photo
 * @param {string}   [options.videoUrl]     - URL video — dùng cho reel/video post
 *
 * @returns {Promise<{
 *   summary: { total: number, succeeded: number, failed: number },
 *   results: Array<{
 *     platform: string,
 *     channelName: string,
 *     channelId: string,
 *     postType: string,
 *     status: "success" | "error",
 *     post?: { id: string, text: string, dueAt: string, status: string, assets: Array },
 *     error?: string
 *   }>
 * }>}
 *
 * Ví dụ đăng reel lên Facebook + Instagram:
 *   const result = await createPostMultiChannel({
 *     text: "Reel mới ra mắt!",
 *     platforms: ["facebook", "instagram"],
 *     postType: "reel",
 *     videoUrl: "https://example.com/video.mp4",
 *   });
 *
 * Ví dụ đăng story lên tất cả platforms hỗ trợ:
 *   const result = await createPostMultiChannel({
 *     text: "Story hôm nay!",
 *     postType: "story",
 *     imageUrls: ["https://example.com/image.jpg"],
 *   });
 */
async function createPostMultiChannel({
  text,
  platforms = [],
  postType,
  scheduledAt,
  imageUrls = [],
  videoUrl,
}) {
  if (!text) throw new Error("text (nội dung) là bắt buộc");

  const rawChannels = process.env.BUFFER_CHANNELS;
  if (!rawChannels) {
    throw new Error(
      "Chưa có BUFFER_CHANNELS trong .env. Hãy chạy: node --env-file=.env setup.js"
    );
  }

  let allChannels;
  try {
    allChannels = JSON.parse(rawChannels);
  } catch {
    throw new Error("BUFFER_CHANNELS trong .env không hợp lệ JSON. Hãy chạy lại setup.js");
  }

  if (!Array.isArray(allChannels) || allChannels.length === 0) {
    throw new Error("Tài khoản Buffer chưa kết nối channel nào.");
  }

  const targetChannels =
    platforms.length === 0
      ? allChannels
      : allChannels.filter((ch) =>
          platforms.map((p) => p.toLowerCase()).includes(ch.service.toLowerCase())
        );

  if (targetChannels.length === 0) {
    const available = allChannels.map((c) => c.service).join(", ");
    throw new Error(
      `Không tìm thấy channel nào khớp với platforms: [${platforms.join(", ")}]. ` +
      `Các platform đang có: [${available}]`
    );
  }

  const results = await Promise.all(
    targetChannels.map(async (channel) => {
      const service = channel.service.toLowerCase();
      const platformConfig = POST_TYPE_CONFIG[service] ?? {};

      // Resolve postType: dùng postType được chỉ định nếu platform hỗ trợ,
      // ngược lại dùng default của platform đó.
      const resolvedType =
        postType && platformConfig[postType] !== undefined
          ? postType
          : (DEFAULT_POST_TYPE[service] ?? "post");

      // null nghĩa là platform không cần metadata cho loại này (VD: TikTok)
      const metadata = platformConfig[resolvedType] ?? undefined;

      try {
        const post = await createPost({
          channelId: channel.id,
          text,
          scheduledAt,
          imageUrls,
          videoUrl,
          metadata,
        });
        return {
          platform: channel.service,
          channelName: channel.name,
          channelId: channel.id,
          postType: resolvedType,
          status: "success",
          post,
        };
      } catch (err) {
        return {
          platform: channel.service,
          channelName: channel.name,
          channelId: channel.id,
          postType: resolvedType,
          status: "error",
          error: err.message,
        };
      }
    })
  );

  const succeeded = results.filter((r) => r.status === "success").length;

  return {
    summary: { total: results.length, succeeded, failed: results.length - succeeded },
    results,
  };
}

// ─────────────────────────────────────────────────────────────
// UTILITY: GOOGLE DRIVE → DIRECT URL
// ─────────────────────────────────────────────────────────────

/**
 * Chuyển Google Drive sharing URL thành direct URL dùng được với Buffer API.
 *
 * Dùng type để chọn đúng chế độ:
 *   "image" (mặc định) → export=view  — trả về file trực tiếp, ổn định
 *   "video"            → export=download&confirm=t — bypass virus-scan warning,
 *                        hoạt động với video công khai; vẫn có thể thất bại nếu
 *                        Google chặn phía server của Buffer (không có gì đảm bảo).
 *
 * Định dạng URL Drive được hỗ trợ:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *
 * @param {string} driveUrl          - Sharing URL từ Google Drive
 * @param {"image"|"video"} [type]   - Loại file, mặc định "image"
 * @returns {string} Direct URL
 * @throws {Error} Nếu URL không phải định dạng Drive hợp lệ
 */
function driveToDirectUrl(driveUrl, type = "image") {
  const match =
    driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(
      `URL Google Drive không hợp lệ: "${driveUrl}". ` +
      `Định dạng hợp lệ: https://drive.google.com/file/d/FILE_ID/view`
    );
  }
  const fileId = match[1];
  if (type === "video") {
    return `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
  }
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Chuyển Dropbox sharing URL thành direct download URL.
 * Đổi www.dropbox.com → dl.dropboxusercontent.com và xoá ?dl=0
 *
 * ✅ Hoạt động tốt với cả hình ảnh lẫn video.
 *
 * @param {string} dropboxUrl - Sharing URL từ Dropbox
 * @returns {string} Direct download URL
 */
function dropboxToDirectUrl(dropboxUrl) {
  return dropboxUrl
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace(/[?&]dl=\d/, "");
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  getOrganizations,
  getChannels,
  createPost,
  createPostMultiChannel,
  POST_TYPE_CONFIG,
  DEFAULT_POST_TYPE,
  driveToDirectUrl,
  dropboxToDirectUrl,
};
