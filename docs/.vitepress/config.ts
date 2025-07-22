import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Opendrive",
  description: "A self-hosted drive solution",
  themeConfig: {
    search: {
      provider: "local",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Opendrive",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/overview" },
    ],

    sidebar: [
      {
        text: "General",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Deployment", link: "/deployment" },
        ],
      },
    ],
    editLink: {
      pattern:
        "https://github.com/opendrivespace/opendrive/edit/main/docs/:path",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/opendrivespace/opendrive" },
    ],
  },
});
