export type QueryParams = Record<string, string | number | boolean | null | undefined>;

type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type FormConfig = {
    action: string;
    method?: FormMethod;
    query?: QueryParams;
};

type RouteHelper = ((params?: QueryParams) => string) & {
    url: string;
    form: (options?: Partial<FormConfig>) => FormConfig;
};

export function queryParams(params?: QueryParams): string {
    if (!params) {
        return '';
    }

    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        search.append(key, String(value));
    });

    const queryString = search.toString();

    return queryString ? `?${queryString}` : '';
}

function createRoute(path: string, method: FormMethod = 'get'): RouteHelper {
    const route = (params?: QueryParams) => `${path}${queryParams(params)}`;

    return Object.assign(route, {
        url: path,
        form: (options: Partial<FormConfig> = {}) => ({
            action: route(options.query),
            method,
            ...options,
        }),
    });
}

export const home = createRoute('/');
export const dashboard = createRoute('/dashboard');
export const login = createRoute('/login');
export const register = createRoute('/register');
export const logout = createRoute('/logout', 'post');
