const BasePlatform = require("./base");

/**
 * Instagram platform.
 *
 * Post types (PostType): post | story | reel
 */
class InstagramPlatform extends BasePlatform {
  /**
   * Đăng bài thông thường lên Instagram (ảnh hoặc video).
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.shouldShareToFeed]  - Mặc định: true
   * @param {string}   [options.firstComment]
   * @param {string}   [options.link]               - Shop Grid link
   * @param {object}   [options.geolocation]        - { id?, text? }
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    shouldShareToFeed = true,
    firstComment,
    link,
    geolocation,
    saveToDraft,
  } = {}) {
    const meta = { type: "post", shouldShareToFeed };
    if (firstComment) meta.firstComment  = firstComment;
    if (link)         meta.link          = link;
    if (geolocation)  meta.geolocation   = geolocation;

    return this._createPost({
      channelId, text, imageUrls, videoUrl, scheduledAt,
      metadata: { instagram: meta }, saveToDraft,
    });
  }

  /**
   * Đăng Story lên Instagram.
   * @param {string} channelId
   * @param {object} options
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {object}   [options.stickerFields]  - { text?, music?, products?, topics?, other? }
   * @param {boolean}  [options.saveToDraft]
   */
  async createStory(channelId, {
    imageUrls = [],
    videoUrl,
    scheduledAt,
    stickerFields,
    saveToDraft,
  } = {}) {
    const meta = { type: "story", shouldShareToFeed: false };
    if (stickerFields) meta.stickerFields = stickerFields;

    return this._createPost({
      channelId, text: "", imageUrls, videoUrl, scheduledAt,
      metadata: { instagram: meta }, saveToDraft,
    });
  }

  /**
   * Đăng Reel lên Instagram.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.videoUrl              - Bắt buộc (≤ 100 MB, 3–90 giây)
   * @param {string}   [options.text]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.shouldShareToFeed]   - Mặc định: true
   * @param {string}   [options.firstComment]
   * @param {boolean}  [options.saveToDraft]
   */
  async createReel(channelId, {
    videoUrl,
    text = "",
    scheduledAt,
    shouldShareToFeed = true,
    firstComment,
    saveToDraft,
  } = {}) {
    if (!videoUrl) throw new Error("videoUrl là bắt buộc cho Instagram Reel");

    const meta = { type: "reel", shouldShareToFeed };
    if (firstComment) meta.firstComment = firstComment;

    return this._createPost({
      channelId, text, videoUrl, scheduledAt,
      metadata: { instagram: meta }, saveToDraft,
    });
  }
}

module.exports = InstagramPlatform;
