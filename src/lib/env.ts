const required = <T extends string>(value: T | undefined, name: string): T => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getSitePassword = () => required(process.env.SITE_ACCESS_PASSWORD, 'SITE_ACCESS_PASSWORD');
export const getSiteSalt = () => process.env.SITE_ACCESS_SALT ?? 'water-report-salt';
