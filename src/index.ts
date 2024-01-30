import { type BaseSchema, Table, type TableOptions } from './table';

// Table proxy handler stuff
export type TableExtension<Name extends string, Schema extends BaseSchema> = {
    [K in `$${Extract<keyof Schema, string>}`]: `${Name}.${K}`
} & (<K extends Extract<keyof Schema, string>[]>(...keys: K) => string);

const tableProxyHandler = {
    apply: (target, _, keys) => `${target.name}(${keys.join(',')})`,
    get: (target, prop) => {
        if (prop in target)
            return Reflect.get(target, prop);

        if (typeof prop === 'string' && prop.startsWith('$'))
            // @ts-ignore
            return target[prop] = `${target.options.name}.${prop.substring(1)}`;

        return null;
    }
} as ProxyHandler<Table<any, any>>;

// Query proxy handler stuff
const queryProxyHandler = {
    get: (_, prop) => typeof prop === 'string' ? '$' + prop : null,
} as ProxyHandler<{}>, payload = {};

namespace sql {
    /**
     * Create a SQLite table
     */
    export function table<Name extends string, Schema extends BaseSchema>(options: TableOptions<Name, Schema>): Table<Name, Schema> & TableExtension<Name, Schema> {
        return new Proxy(new Table(options), tableProxyHandler) as any;
    }

    /**
     * Create a query
     */
    export function query<Params extends Record<string, any>>(fn: ($: Params) => string): string & {
        infer: { [K in Extract<keyof Params, string> as `$${K}`]: Params[K] }
    } {
        return fn(new Proxy(payload, queryProxyHandler) as Params) as any;
    }
}

export default sql;
