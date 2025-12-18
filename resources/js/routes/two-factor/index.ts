import { createRoute } from '../index';

export const show = createRoute('/settings/two-factor');
export const enable = createRoute('/user/two-factor-authentication', 'post');
export const disable = createRoute('/user/two-factor-authentication', 'delete');
export const qrCode = createRoute('/user/two-factor-qr-code');
export const secretKey = createRoute('/user/two-factor-secret-key');
export const recoveryCodes = createRoute('/user/two-factor-recovery-codes');
export const regenerateRecoveryCodes = createRoute(
    '/user/two-factor-recovery-codes',
    'post',
);
export const confirm = createRoute(
    '/user/confirmed-two-factor-authentication',
    'post',
);

const routes = {
    show,
    enable,
    disable,
    qrCode,
    secretKey,
    recoveryCodes,
    regenerateRecoveryCodes,
    confirm,
};

export default routes;
