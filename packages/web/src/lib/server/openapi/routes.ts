/**
 * This file ensures all v1 route definitions are loaded and registered
 * with the OpenAPI registry. Import this file before generating the spec.
 *
 * Route definitions are defined here (registering with the registry as a
 * side effect), then imported by the actual +server.ts route handlers.
 */

// Schema registrations
import "$lib/server/openapi/schemas";

// Route definition modules (side-effect: register with the OpenAPI registry)
import "$lib/server/openapi/v1/activity";
import "$lib/server/openapi/v1/auth";
import "$lib/server/openapi/v1/preferences";
import "$lib/server/openapi/v1/storage";
import "$lib/server/openapi/v1/version";
