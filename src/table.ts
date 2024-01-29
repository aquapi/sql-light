export type BaseSchema = Record<string, string>;

export interface ForeignKeysConstraint<Keys extends string> {
    keys: Keys[];
    ref: string;
}

export interface TableOptions<Name extends string, Schema extends BaseSchema> {
    name: Name,
    schema: Schema,

    primaryKeys?: keyof Schema[];
    foreignKeys?: ForeignKeysConstraint<Extract<keyof Schema, string>>[];

    withoutRowID?: boolean;
}

export interface Table<Name, Schema> {
    <K extends Extract<keyof Schema, string>[]>(...keys: K): string;
}

export type TableExtension<Name extends string, Schema extends BaseSchema> = {
    [K in `$${Extract<keyof Schema, string>}`]: `${Name}.${K}`
}

const proxyHandler = {
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

export class Table<Name extends string, Schema extends BaseSchema> extends Function {
    /**
     * Create table statement
     */
    readonly init: string;

    constructor(readonly options: TableOptions<Name, Schema>) {
        super();

        // Add normal props
        const {
            name, schema,
            primaryKeys, foreignKeys,
            withoutRowID
        } = this.options, rows = [];

        for (const prop in schema)
            rows.push(`${prop} ${schema[prop]}`);

        // Add primary keys
        if (Array.isArray(primaryKeys))
            rows.push(`PRIMARY KEY(${primaryKeys.join(',')})`);

        // Add foreign keys
        if (Array.isArray(foreignKeys))
            for (const ct of foreignKeys)
                rows.push(`FOREIGN KEY(${ct.keys.join(',')}) REFERENCES ${ct.ref}`);

        this.init = `CREATE TABLE IF NOT EXISTS ${name} (${rows.join(',')})${withoutRowID === true ? ' WITHOUT ROWID' : ''}`;

        return new Proxy(this, proxyHandler);
    }

    /**
     * Type-safe wrapper for accessing column
     */
    col<Keys extends (keyof Schema)[]>(...cols: Keys) {
        return cols;
    }

    /**
     * Get the name of the table
     */
    toString = () => this.options.name;
}
