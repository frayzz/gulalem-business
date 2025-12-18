import { createRoute } from '../index';

export const store = createRoute('/confirm-password', 'post');

const routes = { store };
export default routes;
