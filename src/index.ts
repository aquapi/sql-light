import { type BaseSchema, Table, type TableOptions, type TableExtension } from './table';

const proxyHandler = {
    get: (_, prop) => typeof prop === 'string' ? '$' + prop : null,
} as ProxyHandler<{}>, payload = {};

namespace sql {
    /**
     * Create a SQLite table
     */
    export function table<Name extends string, Schema extends BaseSchema>(options: TableOptions<Name, Schema>): Table<Name, Schema> & TableExtension<Name, Schema> {
        return new Table(options) as any;
    }

    /**
     * Create a query
     */
    export function query<Params extends Record<string, any>>(fn: ($: Params) => string): string & {
        infer: { [K in Extract<keyof Params, string> as `$${K}`]: Params[K] }
    } {
        return fn(new Proxy(payload, proxyHandler) as Params) as any;
    }
}

export default sql;
