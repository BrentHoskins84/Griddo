interface PaymentOption {
  type: string;
  handle: string;
  link?: string;
}

interface SquareClaimedEmailParams {
  participantName: string;
  contestName: string;
  rowTeamName: string;
  colTeamName: string;
  rowIndex: number;
  colIndex: number;
  squarePrice: number;
  contestUrl: string;
  paymentOptions: PaymentOption[];
}

export function squareClaimedEmail({
  participantName,
  contestName,
  rowTeamName,
  colTeamName,
  rowIndex,
  colIndex,
  squarePrice,
  contestUrl,
  paymentOptions,
}: SquareClaimedEmailParams): { subject: string; html: string } {
  const subject = `You claimed a square in ${contestName}!`;

  const paymentOptionsHtml = paymentOptions
    .map(
      (option) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
          <strong style="color: #fafafa;">${option.type}:</strong>
          ${
            option.link
              ? `<a href="${option.link}" style="color: #F97316; text-decoration: none; margin-left: 8px;">${option.handle}</a>`
              : `<span style="color: #a1a1aa; margin-left: 8px;">${option.handle}</span>`
          }
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #18181B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181B;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #F97316; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Fundwell</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #27272A; padding: 32px; border-radius: 0 0 8px 8px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #fafafa; font-size: 16px;">
                Hi ${participantName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #fafafa; font-size: 16px;">
                You've claimed a square in <strong style="color: #F97316;">${contestName}</strong>!
              </p>
              
              <!-- Square Details Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 16px 0; color: #fafafa; font-size: 18px; font-weight: 600;">
                      Square Details
                    </h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Position:</td>
                        <td style="padding: 8px 0; color: #fafafa; font-size: 14px; text-align: right;">
                          Row ${rowIndex}, Column ${colIndex}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Teams:</td>
                        <td style="padding: 8px 0; color: #fafafa; font-size: 14px; text-align: right;">
                          ${rowTeamName} vs ${colTeamName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Amount Due:</td>
                        <td style="padding: 8px 0; color: #F97316; font-size: 16px; font-weight: bold; text-align: right;">
                          $${squarePrice.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Payment Section -->
              ${
                paymentOptions.length > 0
                  ? `
              <h3 style="margin: 0 0 16px 0; color: #fafafa; font-size: 16px; font-weight: 600;">
                Complete your payment using one of these options:
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${paymentOptionsHtml}
              </table>
              `
                  : ''
              }
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${contestUrl}" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      View Contest
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 14px;">
                Good luck! - The Fundwell Team
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

