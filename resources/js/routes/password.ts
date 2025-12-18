import { createRoute } from './index';

export const request = createRoute('/forgot-password');
export const email = createRoute('/forgot-password', 'post');
export const update = createRoute('/reset-password', 'post');

const routes = { request, email, update };
export default routes;
