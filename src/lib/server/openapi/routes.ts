/**
 * This file ensures all v1 route definitions are loaded and registered
 * with the OpenAPI registry. Import this file before generating the spec.
 *
 * Route definitions are defined here (registering with the registry as a
 * side effect), then imported by the actual +server.ts route handlers.
 */

// Schema registrations
import "#lib/server/openapi/schemas.js";

// Route definition modules (side-effect: register with the OpenAPI registry)
import "#lib/server/openapi/v1/account.js";
import "#lib/server/openapi/v1/activity.js";
import "#lib/server/openapi/v1/auth.js";
import "#lib/server/openapi/v1/drives.js";
import "#lib/server/openapi/v1/notes.js";
import "#lib/server/openapi/v1/notifications.js";
import "#lib/server/openapi/v1/preferences.js";
import "#lib/server/openapi/v1/shares.js";
import "#lib/server/openapi/v1/sharings.js";
import "#lib/server/openapi/v1/storage.js";
import "#lib/server/openapi/v1/version.js";
import "#lib/server/openapi/v1/volumes.js";
