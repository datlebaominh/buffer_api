const BasePlatform = require("./base");

/**
 * LinkedIn platform.
 *
 * LinkedInPostMetadataInput: annotations, firstComment, linkAttachment
 */
class LinkedInPlatform extends BasePlatform {
  /**
   * Đăng bài lên LinkedIn.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {object}   [options.linkAttachment]  - { url: string }
   * @param {string}   [options.firstComment]
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
    const meta = {};
    if (linkAttachment) meta.linkAttachment = linkAttachment;
    if (firstComment)   meta.firstComment   = firstComment;

    const metadata = Object.keys(meta).length > 0 ? { linkedin: meta } : undefined;
    return this._createPost({ channelId, text, imageUrls, videoUrl, scheduledAt, metadata, saveToDraft });
  }
}

module.exports = LinkedInPlatform;
