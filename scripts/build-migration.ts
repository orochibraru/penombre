import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['scripts/migrate.ts'],
	bundle: true,
	platform: 'node',
	target: 'node18',
	outfile: 'dist/migrate.js',
	format: 'esm',
	external: ['drizzle-orm/postgres-js']
});
