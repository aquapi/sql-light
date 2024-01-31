import { type BaseSchema, Table as BaseTable, type TableOptions } from './table';

// Table proxy handler stuff
export type TableExtension<Name extends string, Schema extends BaseSchema> = { [K in Extract<keyof Schema, string> as `$${K}`]: `${Name}.${K}` }
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
    export type Value = string | number | null | Buffer;

    type EndToken = ',' | ' ' | ';' | ')';

    type Analyze<T extends string, Current extends string = ''> = T extends `${infer Char}${infer Rest}`
        ? CharCheck<Char, Current, Rest>
        : T extends EndToken ? {} : PropObject<`${Current}${T}`>;

    type CharCheck<Char extends string, Current extends string, Rest extends string = ''> = Char extends EndToken
        ? PropObject<Current> & QueryInfer<Rest>
        : Analyze<Rest, `${Current}${Char}`>

    type PropObject<Name extends string> = { [K in `$${Name}`]: Value };

    type SliceEnd<T extends string, Token extends string> = T extends `${string}${Token}${infer Rest}` ? Rest : ''

    /**
     * Infer from a query string
     */
    export type QueryInfer<T extends string> =
        // Escape string
        T extends `${infer X}'${infer Y}`
        ? QueryInfer<X> & QueryInfer<SliceEnd<Y, `'`>>

        : T extends `${infer X}"${infer Y}`
        ? QueryInfer<X> & QueryInfer<SliceEnd<Y, `"`>>

        // Check token stuff
        : T extends `${string}$${infer Rest}`
        ? Analyze<Rest> : {};

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
    export function query<Q extends string>(query: Q): Q & { infer: QueryInfer<Q>, value: Q } {
        return query as any;
    }
}

export default sql;
