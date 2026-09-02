export const typography = {
  heading: {
    fontSize: 26,
    fontWeight: '800' as const,
    lineHeight: 32,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  medium: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
} as const;

export type AppTypography = typeof typography;
