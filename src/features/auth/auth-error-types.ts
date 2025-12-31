export type AuthErrorType =
  | 'email_already_exists'
  | 'invalid_credentials'
  | 'rate_limit_exceeded'
  | 'invalid_magic_link'
  | 'email_not_confirmed'
  | 'generic_error';

const ERROR_MESSAGES: Record<AuthErrorType, string> = {
  email_already_exists: 'This email is already registered. Try logging in instead.',
  invalid_credentials: 'Invalid email or password. Please try again.',
  rate_limit_exceeded: 'Too many requests. Please wait a minute and try again.',
  invalid_magic_link: 'This link has expired or is invalid. Please request a new one.',
  email_not_confirmed: 'Please check your email and confirm your account.',
  generic_error: 'Something went wrong. Please try again.',
};

export function getUserFriendlyErrorMessage(error: any): {
  type: AuthErrorType;
  message: string;
} {
  const errorMessage = error?.message?.toLowerCase() ?? '';
  const errorCode = error?.code ?? '';

  let type: AuthErrorType = 'generic_error';

  if (
    errorMessage.includes('user already registered') ||
    errorCode === 'user_already_exists'
  ) {
    type = 'email_already_exists';
  } else if (
    errorMessage.includes('invalid login credentials') ||
    errorCode === 'invalid_credentials'
  ) {
    type = 'invalid_credentials';
  } else if (errorMessage.includes('rate')) {
    type = 'rate_limit_exceeded';
  } else if (
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid')
  ) {
    type = 'invalid_magic_link';
  } else if (
    errorMessage.includes('email not confirmed') ||
    errorCode === 'email_not_confirmed'
  ) {
    type = 'email_not_confirmed';
  }

  return {
    type,
    message: ERROR_MESSAGES[type],
  };
}

