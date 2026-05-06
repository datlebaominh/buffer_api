/**
 * BufferClient — Orchestrator chính cho Buffer GraphQL API.
 *
 * Hỗ trợ multi-account (free tier 3 channels/account):
 *   Mỗi platform lưu channels riêng trong .env (BUFFER_FACEBOOK_CHANNELS, v.v.)
 *   Mỗi channel JSON mang apiKey của account sở hữu nó.
 *
 * Cấu trúc .env:
 *   BUFFER_API_KEY=...                    ← fallback nếu channel không có apiKey
 *   BUFFER_FACEBOOK_CHANNELS='[...]'
 *   BUFFER_INSTAGRAM_CHANNELS='[...]'
 *   BUFFER_TIKTOK_CHANNELS='[...]'
 *   ...
 *
 * Cách dùng:
 *   const client = BufferClient.fromEnv();
 *   await client.facebook.createPost(channelId, { text, imageUrls });
 *   await client.postToChannels({ platforms: ["facebook"], text: "..." });
 */

const FacebookPlatform       = require("./platforms/facebook");
const InstagramPlatform      = require("./platforms/instagram");
const TikTokPlatform         = require("./platforms/tiktok");
const ThreadsPlatform        = require("./platforms/threads");
const TwitterPlatform        = require("./platforms/twitter");
const LinkedInPlatform       = require("./platforms/linkedin");
const YouTubePlatform        = require("./platforms/youtube");
const BlueskyPlatform        = require("./platforms/bluesky");
const PinterestPlatform      = require("./platforms/pinterest");
const MastodonPlatform       = require("./platforms/mastodon");
const GoogleBusinessPlatform = require("./platforms/google_business");

// service name từ Buffer API → tên property trên BufferClient
const SERVICE_TO_CLIENT = {
  facebook:        "facebook",
  instagram:       "instagram",
  tiktok:          "tiktok",
  threads:         "threads",
  twitter:         "twitter",
  x:               "twitter",
  linkedin:        "linkedin",
  youtube:         "youtube",
  bluesky:         "bluesky",
  pinterest:       "pinterest",
  mastodon:        "mastodon",
  google:          "googleBusiness",
  google_business: "googleBusiness",
  googlebusiness:  "googleBusiness",
};

// platform name (canonical) → tên biến môi trường
const PLATFORM_ENV_KEYS = {
  facebook:        "BUFFER_FACEBOOK_CHANNELS",
  instagram:       "BUFFER_INSTAGRAM_CHANNELS",
  tiktok:          "BUFFER_TIKTOK_CHANNELS",
  threads:         "BUFFER_THREADS_CHANNELS",
  twitter:         "BUFFER_TWITTER_CHANNELS",
  linkedin:        "BUFFER_LINKEDIN_CHANNELS",
  youtube:         "BUFFER_YOUTUBE_CHANNELS",
  bluesky:         "BUFFER_BLUESKY_CHANNELS",
  pinterest:       "BUFFER_PINTEREST_CHANNELS",
  mastodon:        "BUFFER_MASTODON_CHANNELS",
  google_business: "BUFFER_GOOGLE_BUSINESS_CHANNELS",
};

// service name (từ Buffer API, kể cả alias) → canonical platform name
const SERVICE_TO_CANONICAL = {
  facebook:        "facebook",
  instagram:       "instagram",
  tiktok:          "tiktok",
  threads:         "threads",
  twitter:         "twitter",
  x:               "twitter",
  linkedin:        "linkedin",
  youtube:         "youtube",
  bluesky:         "bluesky",
  pinterest:       "pinterest",
  mastodon:        "mastodon",
  google:          "google_business",
  google_business: "google_business",
  googlebusiness:  "google_business",
};

const BUFFER_API_URL = "https://api.buffer.com/graphql";

class BufferClient {
  /**
   * @param {object} [options]
   * @param {string} [options.apiKey] - API key mặc định (fallback cho channel không có apiKey)
   */
  constructor({ apiKey } = {}) {
    this._defaultApiKey = apiKey || null;
    this._channelApiKeyMap = new Map(); // channelId → apiKey
    this._loadChannelApiKeys();

    const req = this._buildRequest();

    this.facebook       = new FacebookPlatform(req);
    this.instagram      = new InstagramPlatform(req);
    this.tiktok         = new TikTokPlatform(req);
    this.threads        = new ThreadsPlatform(req);
    this.twitter        = new TwitterPlatform(req);
    this.linkedin       = new LinkedInPlatform(req);
    this.youtube        = new YouTubePlatform(req);
    this.bluesky        = new BlueskyPlatform(req);
    this.pinterest      = new PinterestPlatform(req);
    this.mastodon       = new MastodonPlatform(req);
    this.googleBusiness = new GoogleBusinessPlatform(req);
  }

  /**
   * Tạo client từ biến môi trường.
   * BUFFER_API_KEY không bắt buộc nếu mọi channel đã mang apiKey riêng.
   */
  static fromEnv() {
    return new BufferClient({ apiKey: process.env.BUFFER_API_KEY || null });
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL: API KEY RESOLUTION
  // ─────────────────────────────────────────────────────────────

  /** Đọc tất cả BUFFER_*_CHANNELS và xây map channelId → apiKey. */
  _loadChannelApiKeys() {
    for (const envKey of Object.values(PLATFORM_ENV_KEYS)) {
      const raw = process.env[envKey];
      if (!raw) continue;
      try {
        const channels = JSON.parse(raw);
        for (const ch of channels) {
          if (ch.id && ch.apiKey) this._channelApiKeyMap.set(ch.id, ch.apiKey);
        }
      } catch {
        // parse error handled lazily in getChannelsFromEnv
      }
    }
  }

  /**
   * Tạo hàm request được truyền vào từng Platform class.
   * Tự động resolve đúng API key cho mỗi channelId.
   */
  _buildRequest() {
    return (query, variables, channelId) => {
      const apiKey =
        (channelId && this._channelApiKeyMap.get(channelId)) ||
        this._defaultApiKey;

      if (!apiKey) {
        throw new Error(
          channelId
            ? `Không tìm thấy API key cho channel "${channelId}". ` +
              `Kiểm tra BUFFER_*_CHANNELS trong .env hoặc đặt BUFFER_API_KEY làm fallback.`
            : "Thiếu BUFFER_API_KEY trong .env"
        );
      }

      return this._graphqlRequest(query, variables, apiKey);
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CORE: GRAPHQL REQUEST
  // ─────────────────────────────────────────────────────────────

  async _graphqlRequest(query, variables = {}, apiKey = null) {
    const key = apiKey || this._defaultApiKey;
    if (!key) throw new Error("Thiếu API key để gọi Buffer API");

    let response;
    try {
      response = await fetch(BUFFER_API_URL, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${key}`,
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
    try { json = await response.json(); } catch {
      throw new Error("Buffer API trả về response không hợp lệ (không phải JSON)");
    }

    if (json.errors?.length > 0) {
      throw new Error(`GraphQL Error: ${json.errors.map((e) => e.message).join("; ")}`);
    }

    return json.data;
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY: ORGANIZATION & CHANNELS
  // ─────────────────────────────────────────────────────────────

  /** Lấy danh sách tổ chức. Yêu cầu BUFFER_API_KEY. */
  async getOrganizations() {
    const data = await this._graphqlRequest(`
      query { account { organizations { id name } } }
    `);
    return data.account.organizations;
  }

  /**
   * Lấy danh sách channels của một tổ chức. Yêu cầu BUFFER_API_KEY.
   * @param {string} organizationId
   */
  async getChannels(organizationId) {
    if (!organizationId) throw new Error("organizationId là bắt buộc");
    const data = await this._graphqlRequest(
      `query GetChannels($orgId: OrganizationId!) {
        channels(input: { organizationId: $orgId }) { id name service }
      }`,
      { orgId: organizationId }
    );
    return data.channels;
  }

  /**
   * Đọc channels từ các biến BUFFER_*_CHANNELS trong .env.
   * Không gọi API.
   *
   * @param {string[]} [platforms] - Lọc theo platform: ["facebook", "instagram"]
   *                                 Bỏ qua hoặc [] → trả về tất cả
   * @returns {Array<{id, name, service, apiKey?}>}
   */
  getChannelsFromEnv(platforms = []) {
    const canonicalFilter = platforms
      .map((p) => SERVICE_TO_CANONICAL[p.toLowerCase()] || p.toLowerCase());

    const all = [];

    for (const [canonical, envKey] of Object.entries(PLATFORM_ENV_KEYS)) {
      if (canonicalFilter.length > 0 && !canonicalFilter.includes(canonical)) continue;

      const raw = process.env[envKey];
      if (!raw) continue;

      try {
        all.push(...JSON.parse(raw));
      } catch {
        throw new Error(`${envKey} trong .env không hợp lệ JSON. Hãy chạy lại setup.js`);
      }
    }

    return all;
  }

  // ─────────────────────────────────────────────────────────────
  // MULTI-CHANNEL: ĐĂNG LÊN NHIỀU NỀN TẢNG
  // ─────────────────────────────────────────────────────────────

  /**
   * Đăng bài lên nhiều channel cùng lúc.
   * Lỗi ở một channel không làm gián đoạn các channel khác.
   *
   * @param {object}   options
   * @param {string[]} [options.platforms]   - ["facebook","instagram"]; [] → tất cả
   * @param {string}   [options.text]
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   * @returns {Promise<{ summary, results }>}
   */
  async postToChannels({ platforms = [], ...postOptions } = {}) {
    const targets = this.getChannelsFromEnv(platforms);

    if (targets.length === 0) {
      const hint = platforms.length > 0
        ? `platforms: [${platforms.join(", ")}]`
        : "bất kỳ platform nào";
      throw new Error(
        `Không tìm thấy channel nào cho ${hint}. ` +
        `Kiểm tra BUFFER_*_CHANNELS trong .env hoặc chạy setup.js`
      );
    }

    const results = await Promise.all(
      targets.map(async (ch) => {
        const clientKey  = SERVICE_TO_CLIENT[ch.service?.toLowerCase()];
        const platform   = clientKey ? this[clientKey] : undefined;

        if (!platform) {
          return {
            platform: ch.service, channelName: ch.name, channelId: ch.id,
            status: "error",
            error:  `Platform "${ch.service}" chưa được hỗ trợ`,
          };
        }

        try {
          const post = await platform.createPost(ch.id, postOptions);
          return { platform: ch.service, channelName: ch.name, channelId: ch.id, status: "success", post };
        } catch (err) {
          return { platform: ch.service, channelName: ch.name, channelId: ch.id, status: "error", error: err.message };
        }
      })
    );

    const succeeded = results.filter((r) => r.status === "success").length;
    return {
      summary: { total: results.length, succeeded, failed: results.length - succeeded },
      results,
    };
  }
}

module.exports = BufferClient;
