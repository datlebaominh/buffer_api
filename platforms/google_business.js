const BasePlatform = require("./base");

/**
 * Google Business Profile platform.
 *
 * GoogleBusinessPostMetadataInput:
 *   type (PostTypeGoogleBusiness!): update | offer | event | whatsNew
 *   title, detailsOffer, detailsEvent, detailsWhatsNew
 */
class GoogleBusinessPlatform extends BasePlatform {
  /**
   * Đăng bài cập nhật (update) lên Google Business Profile.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.title]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createUpdate(channelId, { text, imageUrls = [], title, scheduledAt, saveToDraft } = {}) {
    const meta = { type: "update" };
    if (title) meta.title = title;

    return this._createPost({
      channelId, text, imageUrls, scheduledAt,
      metadata: { google: meta }, saveToDraft,
    });
  }

  /**
   * Đăng ưu đãi (offer) lên Google Business Profile.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {object}   options.offer           - detailsOffer: { title!, startDate!, endDate!, code?, link?, terms? }
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createOffer(channelId, { text, offer, imageUrls = [], scheduledAt, saveToDraft } = {}) {
    if (!offer) throw new Error("offer (detailsOffer) là bắt buộc cho loại post offer");

    return this._createPost({
      channelId, text, imageUrls, scheduledAt,
      metadata: { google: { type: "offer", detailsOffer: offer } }, saveToDraft,
    });
  }

  /**
   * Đăng sự kiện (event) lên Google Business Profile.
   * @param {string} channelId
   * @param {object} options
   * @param {string}   options.text
   * @param {object}   options.event           - detailsEvent: { title!, startDate!, endDate!, isFullDayEvent!, button!, link? }
   * @param {string[]} [options.imageUrls]
   * @param {string}   [options.scheduledAt]
   * @param {boolean}  [options.saveToDraft]
   */
  async createEvent(channelId, { text, event, imageUrls = [], scheduledAt, saveToDraft } = {}) {
    if (!event) throw new Error("event (detailsEvent) là bắt buộc cho loại post event");

    return this._createPost({
      channelId, text, imageUrls, scheduledAt,
      metadata: { google: { type: "event", detailsEvent: event } }, saveToDraft,
    });
  }

  /** Alias — mặc định dùng createUpdate. */
  async createPost(channelId, options = {}) {
    return this.createUpdate(channelId, options);
  }
}

module.exports = GoogleBusinessPlatform;
