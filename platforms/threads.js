const BasePlatform = require("./base");
const { resolveAssets } = require("../utils/media");

/**
 * Threads (Meta) platform.
 *
 * ThreadsPostMetadataInput: type, thread[], linkAttachment, topic, locationId, locationName
 * ThreadedPostInput: text, assets
 */
class ThreadsPlatform extends BasePlatform {
  /**
   * Đăng một bài đơn lên Threads.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {object}   [options.linkAttachment]  - { url: string } — loại trừ lẫn nhau với videoUrl
   * @param {string}   [options.topic]
   * @param {string}   [options.locationId]
   * @param {string}   [options.locationName]
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    linkAttachment,
    topic,
    locationId,
    locationName,
    saveToDraft,
  } = {}) {
    if (!text && imageUrls.length === 0 && !videoUrl) {
      throw new Error("Threads post cần ít nhất text hoặc media");
    }

    const meta = { type: "post" };
    if (linkAttachment) meta.linkAttachment = linkAttachment;
    if (topic)          meta.topic          = topic;
    if (locationId)     meta.locationId     = locationId;
    if (locationName)   meta.locationName   = locationName;

    return this._createPost({
      channelId, text: text ?? "", imageUrls, videoUrl, scheduledAt,
      metadata: { threads: meta }, saveToDraft,
    });
  }

  /**
   * Đăng chuỗi thread nhiều bài (long-form thread).
   *
   * posts[0] là bài mở đầu (opener), posts[1..n] là các reply nối tiếp nhau.
   * Drive URLs trong từng bài được auto-convert.
   *
   * @param {string} channelId
   * @param {object} options
   * @param {Array<{ text?: string, imageUrls?: string[], videoUrl?: string }>} options.posts
   *   Tối thiểu 2 bài, tối đa 10 bài.
   * @param {string}  [options.scheduledAt]
   * @param {string}  [options.topic]
   * @param {string}  [options.locationId]
   * @param {string}  [options.locationName]
   * @param {boolean} [options.saveToDraft]
   */
  async createThread(channelId, {
    posts = [],
    scheduledAt,
    topic,
    locationId,
    locationName,
    saveToDraft,
  } = {}) {
    if (posts.length < 2) {
      throw new Error("createThread cần ít nhất 2 bài. Dùng createPost() cho bài đơn.");
    }
    if (posts.length > 10) {
      throw new Error("Threads chỉ hỗ trợ tối đa 10 bài trong một chuỗi.");
    }

    const [opener, ...continuations] = posts;
    if (!opener.text && !opener.videoUrl && (!opener.imageUrls?.length)) {
      throw new Error("Bài mở đầu (posts[0]) phải có text hoặc media.");
    }

    const meta = {
      type: "post",
      thread: continuations.map(({ text, imageUrls = [], videoUrl } = {}) => {
        const item = {};
        if (text) item.text = text;
        const assets = resolveAssets({ imageUrls, videoUrl });
        if (assets) item.assets = assets;
        return item;
      }),
    };
    if (topic)        meta.topic        = topic;
    if (locationId)   meta.locationId   = locationId;
    if (locationName) meta.locationName = locationName;

    return this._createPost({
      channelId,
      text:      opener.text ?? "",
      imageUrls: opener.imageUrls ?? [],
      videoUrl:  opener.videoUrl,
      scheduledAt,
      metadata:  { threads: meta },
      saveToDraft,
    });
  }
}

module.exports = ThreadsPlatform;
