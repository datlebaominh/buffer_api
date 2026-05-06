/**
 * BasePlatform — lớp nền cho tất cả platform.
 * Chứa mutation createPost dùng chung và helpers xây dựng input.
 */

const { resolveAssets } = require("../utils/media");

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post {
          id
          text
          dueAt
          status
          assets { id mimeType }
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

class BasePlatform {
  /**
   * @param {Function} request - Bound graphqlRequest(query, variables) từ BufferClient
   */
  constructor(request) {
    this._request = request;
  }

  /**
   * Gửi createPost mutation.
   *
   * @param {object}   options
   * @param {string}   options.channelId     - Channel ID đích (bắt buộc)
   * @param {string}   [options.text]        - Nội dung bài đăng
   * @param {string}   [options.scheduledAt] - ISO 8601 UTC; bỏ qua → addToQueue
   * @param {string[]} [options.imageUrls]   - URL ảnh (Drive auto-convert)
   * @param {string}   [options.videoUrl]    - URL video (Drive auto-convert; ưu tiên hơn images)
   * @param {object}   [options.metadata]    - PostInputMetaData (platform-specific)
   * @param {boolean}  [options.saveToDraft] - Lưu nháp thay vì lên lịch
   * @returns {Promise<{id, text, dueAt, status, assets}>}
   */
  async _createPost({
    channelId,
    text = "",
    scheduledAt,
    imageUrls = [],
    videoUrl,
    metadata,
    saveToDraft = false,
  } = {}) {
    if (!channelId) throw new Error("channelId là bắt buộc");

    const input = {
      channelId,
      text,
      schedulingType: "automatic",
      mode: scheduledAt ? "customScheduled" : "addToQueue",
      ...(scheduledAt && { dueAt: scheduledAt }),
    };

    if (saveToDraft) input.saveToDraft = true;

    const assets = resolveAssets({ imageUrls, videoUrl });
    if (assets) input.assets = assets;
    if (metadata) input.metadata = metadata;

    const data = await this._request(CREATE_POST_MUTATION, { input }, channelId);

    const result = data?.createPost;
    if (!result) throw new Error("Buffer API trả về kết quả không hợp lệ");
    if (result.message) throw new Error(`Buffer từ chối tạo post: ${result.message}`);
    if (!result.post) throw new Error("Buffer không trả về thông tin post sau khi tạo");

    return result.post;
  }
}

module.exports = BasePlatform;
