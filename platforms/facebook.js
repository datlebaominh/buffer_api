const BasePlatform = require("./base");

/**
 * Facebook platform.
 *
 * Post types (PostTypeFacebook): post | story | reel
 */
class FacebookPlatform extends BasePlatform {
  /**
   * Đăng bài thông thường lên Facebook.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {object}   [options.linkAttachment]  - { url: string }
   * @param {string}   [options.firstComment]    - Bình luận đầu tiên tự động
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    linkAttachment,
    firstComment,
    saveToDraft,
  } = {}) {
    const meta = { type: "post" };
    if (linkAttachment) meta.linkAttachment = linkAttachment;
    if (firstComment)   meta.firstComment   = firstComment;

    return this._createPost({
      channelId, text, imageUrls, videoUrl, scheduledAt,
      metadata: { facebook: meta }, saveToDraft,
    });
  }

  /**
   * Đăng Story lên Facebook.
   * @param {string} channelId
   * @param {object} options
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createStory(channelId, {
    imageUrls = [],
    videoUrl,
    scheduledAt,
    saveToDraft,
  } = {}) {
    return this._createPost({
      channelId, text: "", imageUrls, videoUrl, scheduledAt,
      metadata: { facebook: { type: "story" } }, saveToDraft,
    });
  }

  /**
   * Đăng Reel lên Facebook.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.videoUrl          - Bắt buộc (≤ 1 GB, 3–90 giây)
   * @param {string}   [options.text]
   * @param {string}   [options.scheduledAt]
   * @param {string}   [options.firstComment]
   * @param {boolean}  [options.saveToDraft]
   */
  async createReel(channelId, {
    videoUrl,
    text = "",
    scheduledAt,
    firstComment,
    saveToDraft,
  } = {}) {
    if (!videoUrl) throw new Error("videoUrl là bắt buộc cho Facebook Reel");

    const meta = { type: "reel" };
    if (firstComment) meta.firstComment = firstComment;

    return this._createPost({
      channelId, text, videoUrl, scheduledAt,
      metadata: { facebook: meta }, saveToDraft,
    });
  }
}

module.exports = FacebookPlatform;
