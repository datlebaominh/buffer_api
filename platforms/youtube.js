const BasePlatform = require("./base");

/**
 * YouTube platform.
 *
 * YoutubePostMetadataInput:
 *   title (String!), categoryId (String!), privacy (YoutubePrivacy),
 *   license (YoutubeLicense), notifySubscribers, embeddable, madeForKids
 *
 * YoutubePrivacy: public | unlisted | private
 * YoutubeLicense: youtube | creativeCommon
 */
class YouTubePlatform extends BasePlatform {
  /**
   * Đăng video lên YouTube.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.videoUrl           - Bắt buộc
   * @param {string}   options.title              - Tiêu đề video (bắt buộc)
   * @param {string}   [options.text]             - Mô tả video
   * @param {string}   [options.scheduledAt]
   * @param {string}   [options.privacy]          - "public" | "unlisted" | "private" (mặc định: "public")
   * @param {string}   [options.categoryId]       - ID danh mục YouTube (mặc định: "22" = People & Blogs)
   * @param {string}   [options.license]          - "youtube" | "creativeCommon" (mặc định: "youtube")
   * @param {boolean}  [options.notifySubscribers] - Thông báo người đăng ký (mặc định: true)
   * @param {boolean}  [options.embeddable]       - Cho phép nhúng (mặc định: true)
   * @param {boolean}  [options.madeForKids]      - Nội dung dành cho trẻ em (mặc định: false)
   * @param {boolean}  [options.saveToDraft]
   */
  async createVideo(channelId, {
    videoUrl,
    title,
    text = "",
    scheduledAt,
    privacy = "public",
    categoryId = "22",
    license = "youtube",
    notifySubscribers = true,
    embeddable = true,
    madeForKids = false,
    saveToDraft,
  } = {}) {
    if (!videoUrl) throw new Error("videoUrl là bắt buộc cho YouTube video");
    if (!title)    throw new Error("title là bắt buộc cho YouTube video");

    return this._createPost({
      channelId,
      text,
      videoUrl,
      scheduledAt,
      metadata: {
        youtube: { title, categoryId, privacy, license, notifySubscribers, embeddable, madeForKids },
      },
      saveToDraft,
    });
  }

  /** Alias cho createVideo — tuân theo interface chung. */
  async createPost(channelId, options = {}) {
    return this.createVideo(channelId, options);
  }
}

module.exports = YouTubePlatform;
