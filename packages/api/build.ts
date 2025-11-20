await Bun.build({
    entrypoints: ["./index.ts"],
    outdir: "./build",
    compile: {
        outfile: "./opendrive",
    },
    external: [
        "drizzle-orm/bun-sql",
        "drizzle-orm/bun-sql/migrator",
        "koritsu",
    ],
});
