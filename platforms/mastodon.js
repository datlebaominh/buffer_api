const BasePlatform = require("./base");
const { resolveAssets } = require("../utils/media");

/**
 * Mastodon platform.
 *
 * MastodonPostMetadataInput: thread ([ThreadedPostInput!]), spoilerText
 */
class MastodonPlatform extends BasePlatform {
  /**
   * Đăng toot đơn lên Mastodon.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {string}   [options.spoilerText]  - Content Warning / CW
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    spoilerText,
    saveToDraft,
  } = {}) {
    const meta = {};
    if (spoilerText) meta.spoilerText = spoilerText;

    const metadata = Object.keys(meta).length > 0 ? { mastodon: meta } : undefined;
    return this._createPost({ channelId, text, imageUrls, videoUrl, scheduledAt, metadata, saveToDraft });
  }

  /**
   * Đăng thread toot nhiều bài.
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
      throw new Error("createThread cần ít nhất 2 toots. Dùng createPost() cho toot đơn.");
    }

    const [opener, ...continuations] = posts;
    const metadata = {
      mastodon: {
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

module.exports = MastodonPlatform;
