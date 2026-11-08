/**
 * Largest file a visitor may send through an upload link. The body is held in
 * memory while it is written, twice over, so this bounds what one anonymous
 * request can cost the server.
 */
export const SHARE_UPLOAD_MAX_BYTES = 1024 ** 3;
