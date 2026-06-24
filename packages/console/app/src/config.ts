/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://makcode.ai",

  // GitHub
  github: {
    repoUrl: "https://github.com/shahnawaz-pathan/makcode",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/makcode",
    discord: "https://discord.gg/makcode",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
