import { createRoute } from './index';

export const edit = createRoute('/settings/profile');
export const update = createRoute('/settings/profile', 'patch');
export const destroy = createRoute('/settings/profile', 'delete');

const routes = { edit, update, destroy };
export default routes;
