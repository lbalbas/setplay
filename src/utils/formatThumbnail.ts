/**
 * Formats a Twitch preview thumbnail URL by replacing the `{width}` and `{height}`
 * template parameters with specific dimensions.
 *
 * @param url The raw Twitch thumbnail URL template (e.g. `https://.../preview-{width}x{height}.jpg`)
 * @param width Desired image width in pixels (default: 640)
 * @param height Desired image height in pixels (default: 360)
 * @returns The formatted URL ready for image elements, or an empty string if url is missing.
 */
export function getTwitchThumbnail(
  url?: string | null,
  width: number = 640,
  height: number = 360,
): string {
  if (!url) return "";
  return url.replace("{width}", String(width)).replace("{height}", String(height));
}
