// Every route in this site is static content resolved entirely at build time
// (the landing page's copy, every guide page's markdown), so the whole site
// prerenders : no server, nothing here needs $lib/server/-style runtime code.
export const prerender = true;
