export type BaseSchema = Record<string, string>;

export interface ForeignKeysConstraint<Keys extends string> {
    keys: Keys[];
    ref: string;
}

export interface TableOptions<Name extends string, Schema extends BaseSchema> {
    name: Name,
    schema: Schema,

    primaryKeys?: (keyof Schema)[];
    foreignKeys?: ForeignKeysConstraint<Extract<keyof Schema, string>>[];

    withoutRowID?: boolean;
}

type TupleUnion<U extends string, R extends any[] = []> = {
    [S in U]: Exclude<U, S> extends never ? [...R, S] : TupleUnion<Exclude<U, S>, [...R, S]>;
}[U];

export class Table<Name extends string, Schema extends BaseSchema> extends Function {
    /**
     * Create table statement
     */
    readonly init: string;

    /**
     * All columns
     */
    readonly cols: TupleUnion<Extract<keyof Schema, string>>;

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

        // Init columns
        const cols = [];
        for (const key in schema)
            cols.push(key);

        this.cols = cols as any;
    }

    /**
     * Get the name of the table
     */
    toString = () => this.options.name;
}
