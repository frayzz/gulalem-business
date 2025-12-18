import { createRoute } from './index';

export const edit = createRoute('/settings/password');
export const update = createRoute('/settings/password', 'put');

const routes = { edit, update };
export default routes;
