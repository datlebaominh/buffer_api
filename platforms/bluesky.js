const BasePlatform = require("./base");
const { resolveAssets } = require("../utils/media");

/**
 * Bluesky platform.
 *
 * BlueskyPostMetadataInput: thread ([ThreadedPostInput!]), linkAttachment
 */
class BlueskyPlatform extends BasePlatform {
  /**
   * Đăng bài đơn lên Bluesky.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]      - Tối đa 4 ảnh
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {object}   [options.linkAttachment] - { url: string }
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    linkAttachment,
    saveToDraft,
  } = {}) {
    const meta = {};
    if (linkAttachment) meta.linkAttachment = linkAttachment;

    const metadata = Object.keys(meta).length > 0 ? { bluesky: meta } : undefined;
    return this._createPost({ channelId, text, imageUrls, videoUrl, scheduledAt, metadata, saveToDraft });
  }

  /**
   * Đăng thread nhiều bài lên Bluesky.
   * @param {string} channelId
   * @param {object} options
   * @param {Array<{ text?: string, imageUrls?: string[], videoUrl?: string }>} options.posts
   * @param {string}  [options.scheduledAt]
   * @param {boolean} [options.saveToDraft]
   */
  async createThread(channelId, {
    posts = [],
    scheduledAt,
    saveToDraft,
  } = {}) {
    if (posts.length < 2) {
      throw new Error("createThread cần ít nhất 2 posts. Dùng createPost() cho post đơn.");
    }

    const [opener, ...continuations] = posts;
    const metadata = {
      bluesky: {
        thread: continuations.map(({ text, imageUrls = [], videoUrl } = {}) => {
          const item = {};
          if (text) item.text = text;
          const assets = resolveAssets({ imageUrls, videoUrl });
          if (assets) item.assets = assets;
          return item;
        }),
      },
    };

    return this._createPost({
      channelId,
      text:      opener.text ?? "",
      imageUrls: opener.imageUrls ?? [],
      videoUrl:  opener.videoUrl,
      scheduledAt, metadata, saveToDraft,
    });
  }
}

module.exports = BlueskyPlatform;
