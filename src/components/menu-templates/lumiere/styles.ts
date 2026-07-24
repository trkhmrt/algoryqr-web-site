export const LUMIERE_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap");
  .lumiere-menu {
    --lm-primary: #b80035;
    --lm-primary-container: #e11d48;
    --lm-on-primary: #ffffff;
    --lm-on-primary-container: #fffaf9;
    --lm-surface: #f8f9fb;
    --lm-background: #f8f9fb;
    --lm-on-surface: #191c1e;
    --lm-on-surface-variant: #5c3f40;
    --lm-outline-variant: #e5bdbe;
    --lm-outline: #906f70;
    --lm-surface-container: #edeef0;
    --lm-surface-container-low: #f3f4f6;
    --lm-surface-container-lowest: #ffffff;
    --lm-surface-container-highest: #e1e2e4;
    --lm-secondary-container: #d9dff5;
    --lm-on-secondary-container: #5c6274;
    --lm-margin: 1.25rem;
    background-color: var(--lm-background);
    color: var(--lm-on-surface);
    font-family: Inter, sans-serif;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
  }
  .lumiere-menu .lm-headline-md {
    font-size: 20px;
    line-height: 1.4;
    letter-spacing: -0.01em;
    font-weight: 600;
  }
  .lumiere-menu .lm-headline-lg {
    font-size: 24px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    font-weight: 600;
  }
  .lumiere-menu .lm-label-caps {
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .lumiere-menu .lm-body-lg {
    font-size: 16px;
    line-height: 1.6;
    font-weight: 400;
  }
  .lumiere-menu .lm-body-sm {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 400;
  }
  .lumiere-menu .lm-primary { color: var(--lm-primary); }
  .lumiere-menu .lm-on-surface { color: var(--lm-on-surface); }
  .lumiere-menu .lm-muted { color: var(--lm-on-surface-variant); }
  .lumiere-menu .lm-cta {
    background: var(--lm-primary-container);
    color: var(--lm-on-primary-container);
  }
  .lumiere-menu .lm-badge {
    background: var(--lm-primary);
    color: var(--lm-on-primary);
  }
  .lumiere-menu .lm-placeholder {
    background: var(--lm-surface-container-low);
    color: var(--lm-on-surface-variant);
  }
  .lumiere-menu .lm-no-scrollbar::-webkit-scrollbar { display: none; }
  .lumiere-menu .lm-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .lumiere-menu .material-symbols-outlined {
    font-family: "Material Symbols Outlined";
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  }
  .lumiere-menu .material-symbols-outlined.lm-fill {
    font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
  }
`;

export const LUMIERE_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDHP7xWtTAXPdlGlU1imuL5lpc8Gn0txL78ZowOyaL9Bgkf2fzzWQEYq_gt5xIAD6Zc19sRnDZ1lantZMkWJ1bLdlpPiCndr3ZD4b45h4ca-YfMh3ZTzVZdm6l7XXx7TYMsfGfaaravAix0r3vEzY9WEWNHWvaDWL5ogDAvYgahDEWXwBD87dtP7gAmP3-rHdEv52ZFOesVJy6NWPR4xhIc5FA6nrvIcAJTgqu3tBJPTcsMWEJvCD6ng_2bdbwI3nnz5qGMlF4uLT14";

export const LUMIERE_CATEGORY_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAByiirPvmNcq4AaCOe97vX0-gpTn-EBQsRfJLtu9iI_H1iQmDsFvMPWLDq2HArzajhH-JXDA9YAnJLt9YHi5zozaWCPld8Kk27Vr2MxNIu_SKkXyDb_zkvZQX8fSSp_rnXoS3n47flDC3SWOgcMTYY4VOw-GnvJY4okD4_fC2-vaerOUEQmCs7i-pj9jyoBEKi2AzBBCnHVmtCzWRmScwf3cpH1lMyPJy8Aa62gJ3cwVZOUvUIPkGM4t1AOyseoXyyeKz636c9fDMA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6QUQaFtsI_YqyFqPGQh31ZqNdPx2-Qz7daCpoFJHUECKDNDcD1vYpocYPUaO6Ruo46SDf5ysLexh0R65iS3m6I-ZkMg9QFK7maNsqG6zDoYs1QHf-vxtARP3FHkXCcUyCc80Y0aQSXZHVwqIKWil9OMl--nOxBoWk66ypDe_l6SQzRLsKXut9wtU2CaBL3f92TFCGgbFXMfdEIxirzyC_s7stJvvt6Hb9C9kasStpvrLwo6NKp80qsvoVdM6JDPLeymbw9Ow89To2",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4syMM9PZnOcdIlD1weNmy7UiLxGrjBCGWg9QRkGNKuQkFEdIfOXbJSAgM_Uadd6GYDQRw37HHHV4Ko4SMyv-aBaNuPztkMth_m7qcbt1_LXfVCayDDfEARg_dSaeh9u3BpOu35FHTXQVrPpWioCN-nFntypdjrs7s7GEd3tt8XdDG9bXQA127eZwZXZ7B-zLI2z0RVeb8I-CgBJsCvW_YveNi0EwbGJyH88nMwuPj_GEDQCtLj04rbJZY-of60x4bu9JFig88FDdB",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDF1CpzVLOnPN0hQRFnwLGFb6-_R5OnifpCWrwc7VtI4mzzvzyoLZchow2mCP6-z9m2bLMoygJhNtbhsWV2oF4ZpnwVTN3L5RMUVlxTbogOEK2hawdICXkS66GuE7dWt6AqNrZjnNUv-0Ja8FnME_Mdc2gmIWueKNvJCkMDU_7OKeN27JU3xdAjWjydypGtsKCEDl3qh6wc0w8eC4TUKiNWHC3LhtRIelUJZl2nb9CYDZHnOnzhkwcfZ5ZKWGK7HNFeiE6OXuKn7Mvh",
] as const;

export const LUMIERE_CATEGORY_HERO = LUMIERE_CATEGORY_IMAGES[1];

export const LUMIERE_DETAIL_FOOTER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6xBDBwc4BIi1Y1WIoIjn8MYlO7djIHfCfY8jv6szluyqe7Zr4Jvb6VeoXiUe0my9vZ5ntHVkVVm1xdgEIh2OCah1tqmHcIccuuLhXLVuWzKATjy_VIvZxy1FBxj8w8rwPxTWXvJ-og6We11IiL4BWXLrBPGDriUD3u86dLG2WIylop6Du-2mBGmCXAx5TsAPDZ3MlgWnl13W3si7UhAAZ3Tj89PETiP0ZviDpiSjqNL3zQL5OVt1HgUOgy3VU61KkaMg1qFPIWSjz";

export function lumiereCategoryImage(index: number) {
  return LUMIERE_CATEGORY_IMAGES[index % LUMIERE_CATEGORY_IMAGES.length];
}
