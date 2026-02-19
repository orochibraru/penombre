import type { RequestHandler } from "./$types";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>OpenDrive API Documentation</title>
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
	<style>
		body { margin: 0; padding: 0; }
		#swagger-ui .topbar { display: none; }
	</style>
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
	<script>
		SwaggerUIBundle({
			url: '/api/v1/openapi.json',
			dom_id: '#swagger-ui',
			deepLinking: true,
			presets: [
				SwaggerUIBundle.presets.apis,
				SwaggerUIBundle.SwaggerUIStandalonePreset,
			],
			layout: 'BaseLayout',
		});
	</script>
</body>
</html>`;

export const GET: RequestHandler = async () => {
	return new Response(html, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
