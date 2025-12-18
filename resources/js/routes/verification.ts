import { createRoute } from './index';

export const send = createRoute('/email/verification-notification', 'post');

const routes = { send };
export default routes;
