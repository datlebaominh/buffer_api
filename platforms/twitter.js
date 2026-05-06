const BasePlatform = require("./base");
const { resolveAssets } = require("../utils/media");

/**
 * Twitter / X platform.
 *
 * TwitterPostMetadataInput: retweet (RetweetMetadataInput), thread ([ThreadedPostInput!])
 */
class TwitterPlatform extends BasePlatform {
  /**
   * Đăng tweet đơn.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]    - Tối đa 4 ảnh
   * @param {string}   [options.videoUrl]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createPost(channelId, {
    text,
    imageUrls = [],
    videoUrl,
    scheduledAt,
    saveToDraft,
  } = {}) {
    return this._createPost({ channelId, text, imageUrls, videoUrl, scheduledAt, saveToDraft });
  }

  /**
   * Đăng thread nhiều tweet.
   * @param {string} channelId
   * @param {object} options
   * @param {Array<{ text?: string, imageUrls?: string[], videoUrl?: string }>} options.posts
   *   Tối thiểu 2 tweets.
   * @param {string}  [options.scheduledAt]
   * @param {boolean} [options.saveToDraft]
   */
  async createThread(channelId, {
    posts = [],
    scheduledAt,
    saveToDraft,
  } = {}) {
    if (posts.length < 2) {
      throw new Error("createThread cần ít nhất 2 tweets. Dùng createPost() cho tweet đơn.");
    }

    const [opener, ...continuations] = posts;
    const metadata = {
      twitter: {
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

  /**
   * Retweet một bài đã tồn tại.
   * @param {string} channelId
   * @param {object} options
   * @param {string}  options.tweetId      - ID tweet cần retweet
   * @param {string}  [options.scheduledAt]
   * @param {boolean} [options.saveToDraft]
   */
  async retweet(channelId, { tweetId, scheduledAt, saveToDraft } = {}) {
    if (!tweetId) throw new Error("tweetId là bắt buộc để retweet");

    return this._createPost({
      channelId,
      text: "",
      scheduledAt,
      metadata: { twitter: { retweet: { id: tweetId } } },
      saveToDraft,
    });
  }
}

module.exports = TwitterPlatform;
