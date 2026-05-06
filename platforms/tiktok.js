const BasePlatform = require("./base");

/**
 * TikTok platform.
 *
 * Loại bài được xác định bởi asset:
 *   - videoUrl  → TikTok video
 *   - imageUrls → TikTok photo (slide show)
 *
 * TikTokPostMetadataInput chỉ có một field: title (String) dùng cho photo post.
 */
class TikTokPlatform extends BasePlatform {
  /**
   * Đăng video lên TikTok.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.videoUrl      - Bắt buộc (≤ 287 MB, 3–60 giây)
   * @param {string}   [options.text]        - Caption
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createVideo(channelId, {
    videoUrl,
    text = "",
    scheduledAt,
    saveToDraft,
  } = {}) {
    if (!videoUrl) throw new Error("videoUrl là bắt buộc cho TikTok video");

    return this._createPost({ channelId, text, videoUrl, scheduledAt, saveToDraft });
  }

  /**
   * Đăng photo slideshow lên TikTok.
   * @param {string} channelId
   * @param {object} options
   * @param {string[]} options.imageUrls     - Bắt buộc (2–35 ảnh)
   * @param {string}   [options.title]       - Tiêu đề slideshow
   * @param {string}   [options.text]        - Caption
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createPhoto(channelId, {
    imageUrls = [],
    title,
    text = "",
    scheduledAt,
    saveToDraft,
  } = {}) {
    if (imageUrls.length === 0) throw new Error("imageUrls là bắt buộc cho TikTok photo");

    const metadata = title ? { tiktok: { title } } : undefined;
    return this._createPost({ channelId, text, imageUrls, scheduledAt, metadata, saveToDraft });
  }

  /** Alias — tự động chọn createVideo hoặc createPhoto dựa vào asset. */
  async createPost(channelId, { videoUrl, imageUrls = [], ...rest } = {}) {
    if (videoUrl) return this.createVideo(channelId, { videoUrl, ...rest });
    return this.createPhoto(channelId, { imageUrls, ...rest });
  }
}

module.exports = TikTokPlatform;
