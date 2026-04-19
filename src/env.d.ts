/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_TITLE?: string;
  readonly SITE_DESCRIPTION?: string;
  readonly GITHUB_USERNAME?: string;
  readonly GITHUB_TOKEN?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
