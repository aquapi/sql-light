import { type BaseSchema, Table as BaseTable, type TableOptions } from './table';

// Table proxy handler stuff
export type TableExtension<Name extends string, Schema extends BaseSchema> = { [K in `$${Extract<keyof Schema, string>}`]: `${Name}.${K}` }
    & { [K in Extract<keyof Schema, string> as `:${K}`]: K }
    & (<K extends Extract<keyof Schema, string>[]>(...keys: K) => string);

const tableProxyHandler = {
    apply: (target, _, keys) => `${target.options.name}(${keys.join(',')})`,
    get: (target, prop) => {
        if (prop in target)
            return Reflect.get(target, prop);

        if (typeof prop === 'string') {
            switch (prop[0]) {
                case '$':
                    Reflect.set(target, prop, `${target.options.name}.${prop.substring(1)}`);
                    break;

                case ':':
                    Reflect.set(target, prop, prop.substring(1));
                    break;
            }

            // @ts-ignore
            return Reflect.get(target, prop);
        }

        return null;
    }
} as ProxyHandler<any>;

namespace sql {
    /**
     * Input value type
     */
    export type Value = string | number | boolean;

    type PropObject<Name extends string> = { [K in `$${Name}`]: Value };

    /**
     * Infer from a query string
     */
    export type QueryInfer<T extends string> =
        // Check token stuff
        T extends `${string}$${infer Prop},${infer Rest}`
        ? PropObject<Prop> & QueryInfer<Rest>
        : T extends `${string}$${infer Prop})${infer Rest}`
        ? PropObject<Prop> & QueryInfer<Rest>
        : T extends `${string}$${infer Prop}=${infer Rest}`
        ? PropObject<Prop> & QueryInfer<Rest>
        : T extends `${string}$${infer Prop} ${infer Rest}`
        ? PropObject<Prop> & QueryInfer<Rest>


        : T extends `${infer _}$${infer Prop}`
        ? PropObject<Prop>
        : T extends `$${infer Prop}`
        ? PropObject<Prop> : {};

    /**
     * Table type
     */
    export type Table<Name extends string, Schema extends BaseSchema> = BaseTable<Name, Schema> & TableExtension<Name, Schema> & Name;

    /**
     * Create a SQLite table
     */
    export function table<Name extends string, Schema extends BaseSchema>(options: TableOptions<Name, Schema>): Table<Name, Schema> {
        return new Proxy(new BaseTable(options), tableProxyHandler) as any;
    }

    /**
     * Yield back the query string with infered types
     */
    export function query<Q extends string>(query: Q): Q & { infer: QueryInfer<Q> } {
        return query as any;
    }
}

export default sql;
