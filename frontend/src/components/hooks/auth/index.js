// src/components/hooks/auth/index.js
// Export all 2FA hooks for easy importing

export { use2FAStatus } from './use2FAStatus';
export { use2FASetup } from './use2FASetup';
export { use2FAVerifySetup } from './use2FAVerifySetup';
export { use2FADisable } from './use2FADisable';
export { use2FABackupCodes } from './use2FABackupCodes';
export { use2FALogin } from './use2FALogin';

// Export existing auth hooks
export { useLogin } from './useLogin';
export { useRegister } from './useRegister';
export { useLogout } from './useLogout';
export { useGetUser } from './useGetUser';
export { useChangePassword } from './useChangePassword';
export { useCurrentUser } from './useCurrentUser';