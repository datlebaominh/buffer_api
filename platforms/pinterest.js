const BasePlatform = require("./base");

/**
 * Pinterest platform.
 *
 * PinterestPostMetadataInput: boardServiceId (String!), title, url
 */
class PinterestPlatform extends BasePlatform {
  /**
   * Đăng Pin lên Pinterest.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.boardServiceId  - ID board đích (bắt buộc)
   * @param {string[]} [options.imageUrls]     - Ảnh Pin (hoặc dùng videoUrl)
   * @param {string}   [options.videoUrl]      - Video Pin
   * @param {string}   [options.text]          - Mô tả Pin
   * @param {string}   [options.title]         - Tiêu đề Pin
   * @param {string}   [options.url]           - Link đích khi click Pin
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createPin(channelId, {
    boardServiceId,
    imageUrls = [],
    videoUrl,
    text = "",
    title,
    url,
    scheduledAt,
    saveToDraft,
  } = {}) {
    if (!boardServiceId) throw new Error("boardServiceId là bắt buộc cho Pinterest Pin");
    if (imageUrls.length === 0 && !videoUrl) {
      throw new Error("Pinterest Pin cần ít nhất một ảnh hoặc video");
    }

    const meta = { boardServiceId };
    if (title) meta.title = title;
    if (url)   meta.url   = url;

    return this._createPost({
      channelId, text, imageUrls, videoUrl, scheduledAt,
      metadata: { pinterest: meta }, saveToDraft,
    });
  }

  /** Alias — tuân theo interface chung. */
  async createPost(channelId, options = {}) {
    return this.createPin(channelId, options);
  }
}

module.exports = PinterestPlatform;
