/**
 * Tiện ích xử lý URL media: Google Drive, Dropbox, và các URL thông thường.
 */

function isGoogleDriveUrl(url) {
  return typeof url === "string" && url.includes("drive.google.com");
}

/**
 * Chuyển Google Drive sharing URL → direct URL.
 *   "image" → export=view      (ổn định)
 *   "video" → export=download  (có thể bị Google chặn phía server Buffer)
 */
function driveToDirectUrl(driveUrl, type = "image") {
  const match =
    driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(
      `URL Google Drive không hợp lệ: "${driveUrl}". ` +
      `Định dạng hợp lệ: https://drive.google.com/file/d/FILE_ID/view`
    );
  }
  const id = match[1];
  return type === "video"
    ? `https://drive.google.com/uc?export=download&confirm=t&id=${id}`
    : `https://drive.google.com/uc?export=view&id=${id}`;
}

/**
 * Chuyển Dropbox sharing URL → direct download URL.
 * Ổn định cho cả hình ảnh lẫn video.
 */
function dropboxToDirectUrl(dropboxUrl) {
  return dropboxUrl
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace(/[?&]dl=\d/, "");
}

/** Auto-convert nếu là Drive URL, giữ nguyên nếu không phải. */
function resolveMediaUrl(url, type) {
  return isGoogleDriveUrl(url) ? driveToDirectUrl(url, type) : url;
}

/**
 * Xây dựng AssetsInput từ imageUrls / videoUrl.
 * Drive URLs được auto-convert. Video được ưu tiên hơn images nếu cả hai có mặt.
 * @returns {object|null} AssetsInput hoặc null nếu không có media
 */
function resolveAssets({ imageUrls = [], videoUrl } = {}) {
  const resolvedVideo = videoUrl ? resolveMediaUrl(videoUrl, "video") : undefined;
  const resolvedImages = imageUrls.map((u) => resolveMediaUrl(u, "image"));

  if (resolvedVideo) {
    return { videos: [{ url: resolvedVideo }] };
  }
  if (resolvedImages.length > 0) {
    return { images: resolvedImages.map((url) => ({ url })) };
  }
  return null;
}

module.exports = {
  isGoogleDriveUrl,
  driveToDirectUrl,
  dropboxToDirectUrl,
  resolveMediaUrl,
  resolveAssets,
};
