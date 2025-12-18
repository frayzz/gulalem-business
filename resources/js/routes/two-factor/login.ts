import { createRoute } from '../index';

export const store = createRoute('/two-factor-challenge', 'post');

const routes = { store };
export default routes;
