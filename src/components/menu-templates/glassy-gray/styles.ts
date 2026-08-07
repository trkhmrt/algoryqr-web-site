export const GLASSY_GRAY_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;700&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap");
  .glassy-gray-menu {
    --gg-font-display: "Plus Jakarta Sans", sans-serif;
    --gg-font-body: "Hanken Grotesk", sans-serif;
    --gg-bg: #131313;
    --gg-primary: #ffb693;
    --gg-primary-container: #ff6b00;
    --gg-on-primary-container: #572000;
    --gg-muted: #e2bfb0;
    --gg-outline: #a98a7d;
    --gg-accent: #caf300;
    --gg-on-surface: #e5e2e1;
    --menu-frame-bg: #0a0a0a;
    --menu-frame-border: rgba(255, 255, 255, 0.08);
    background-color: var(--gg-bg);
    color: var(--gg-on-surface);
    font-family: var(--gg-font-body);
  }
  .glassy-gray-menu .gg-display { font-family: var(--gg-font-display); }
  .glassy-gray-menu .gg-primary { color: var(--gg-primary); }
  .glassy-gray-menu .gg-muted { color: var(--gg-muted); }
  .glassy-gray-menu .gg-on-surface { color: var(--gg-on-surface); }
  .glassy-gray-menu .gg-accent { color: var(--gg-accent); }
  .glassy-gray-menu .gg-outline { color: var(--gg-outline); }
  .glassy-gray-menu .gg-card { min-width: 280px; }
  .glassy-gray-menu .gg-placeholder {
    background: rgba(255, 255, 255, 0.05);
    color: var(--gg-outline);
  }
  .glassy-gray-menu .gg-badge {
    background: rgba(255, 182, 147, 0.1);
    color: var(--gg-primary);
  }
  .glassy-gray-menu .gg-nav {
    background: rgba(19, 19, 19, 0.8);
  }
  .glassy-gray-menu .gg-aside {
    background: rgba(14, 14, 14, 0.9);
  }
  .glassy-gray-menu .gg-footer {
    background: rgba(19, 19, 19, 0.6);
  }
  .glassy-gray-menu .gg-cta {
    background: var(--gg-primary-container);
    color: var(--gg-on-primary-container);
  }
  .glassy-gray-menu .gg-cta-icon {
    background: var(--gg-primary-container);
    color: var(--gg-on-primary-container);
  }
  .glassy-gray-menu .gg-dot { background: var(--gg-accent); }
  .glassy-gray-menu .gg-hero-fade {
    background: linear-gradient(to bottom, #131313, rgba(19, 19, 19, 0.4), #131313);
  }
  .glassy-gray-menu .gg-glow-a {
    background: rgba(255, 182, 147, 0.2);
  }
  .glassy-gray-menu .gg-glow-b {
    background: rgba(202, 243, 0, 0.1);
  }
  .glassy-gray-menu .gg-active-chip {
    background: var(--gg-primary-container);
    color: var(--gg-on-primary-container);
  }
  .glassy-gray-menu .gg-mobile-tab {
    max-width: 4.5rem;
  }
  .glassy-gray-menu .gg-mobile-tab-label {
    font-size: 0.5rem;
  }
  .glassy-gray-menu .material-symbols-outlined {
    font-family: "Material Symbols Outlined";
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  }
  .gg-glass {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .gg-glass-heavy {
    background: rgba(19, 19, 19, 0.60);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .gg-text-glow {
    text-shadow: 0 0 20px rgba(255, 182, 147, 0.3);
  }
  .gg-shimmer {
    position: relative;
    overflow: hidden;
  }
  .gg-shimmer::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: gg-shimmer 3s infinite;
  }
  @keyframes gg-shimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
  .gg-no-scrollbar::-webkit-scrollbar { display: none; }
  .gg-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

export const GLASSY_GRAY_HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBM_pr-HBuexEH2kGEtpHF3f72QShFLTSolPtJG3-85F7IKonHcBnYtQNL5VPR8TkUXfBPCp54LaoqLhlagjdkZkR_o1mtImdOhaKM0I1Bdyb2SsPQAgLGgrVNQ41IR1AAxaRV1EBSRt-5rL-D47OiofduEa3ivrFsL-fQUOHcipY12yH5Mv9UYnWd7fRwWWssGHwA9orvmbvuOwvSVZtkRKQvvAXrPTIcppujXfh7IFzkNkignXfLD8WvsMI8YYpSBehH_rejrCav8";

export const GLASSY_GRAY_FEATURE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDVhIrA3-3JwPaMCVS5OkReN7hIjPLV9HSOiSSRowZIg8puK5I6i4Ndpb-tvHaRFGhyVAV4KS4IrpFRgf7cS_pJFGHjMqXhLNur-ceGkSnIlGs2w-q-m5o8SLto7HXj0iDkmkUyTh_2TYZu4WlZ8Ff-TTNbK-c1HMsMfbEpUO8YjoXErTzRJVO-fO-WocOHHwxflo6wQXo4yQ3Myd6bPOsZHZ9Shz-VtOSoAfr19LasIlG-DA1fFXEvO5u6afljdS87uACA1umWO3Ni";

export const GLASSY_GRAY_CATEGORY_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBW4yZRJiZiLbJyCWf_1vJVE9IkZGCHpHsT8Kky1YVCcEBxCxvT689pFoQaBoRkZ_WWgCJt000zqE0-4de_xexdDTQ5h0-wNjASN2C47pfTyZcVWGhVD8D7RNE23TTnXQZoY7_FUd-P02kAwKazdLKW6IxqsylpgNoNnDqqGra9ACjIJej5s7FJb974n4QR6q2pgsWOvXmBZJhTTZRdn_luMcrKFJ22cRmPpAT-w6qarPdxU5U9FafDwIA21me0M5kP1aBBH4HAu_fb";
