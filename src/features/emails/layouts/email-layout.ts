interface EmailLayoutOptions {
  headerStyle?: 'default' | 'gradient';
  children: string;
}

export const emailStyles = {
  greeting: 'margin: 0 0 24px 0; color: #fafafa; font-size: 16px;',
  detailsBox: 'background-color: #3f3f46; border-radius: 8px; margin-bottom: 24px;',
  detailsBoxPadding: 'padding: 20px;',
  detailsTitle: 'margin: 0 0 16px 0; color: #fafafa; font-size: 18px; font-weight: 600;',
  detailRow: 'padding: 8px 0; font-size: 14px;',
  detailLabel: 'color: #a1a1aa;',
  detailValue: 'color: #fafafa; text-align: right;',
  ctaButton:
    'display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;',
} as const;

export function emailLayout({ headerStyle = 'default', children }: EmailLayoutOptions): string {
  const headerBackground =
    headerStyle === 'gradient'
      ? 'background: linear-gradient(135deg, #F97316 0%, #FBBF24 100%);'
      : 'background-color: #F97316;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Fundwell</title>
</head>
<body style="margin: 0; padding: 0; background-color: #18181B; font-family: Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #18181B;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="${headerBackground} border-radius: 8px 8px 0 0; padding: 24px;">
              <span style="color: #ffffff; font-size: 28px; font-weight: bold;">Fundwell</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #27272A; padding: 32px; border-radius: 0 0 8px 8px;">
              ${children}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px;">
              <span style="color: #71717a; font-size: 14px;">- The Fundwell Team</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

