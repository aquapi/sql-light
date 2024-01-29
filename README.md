# `sql-light`
A simple SQLite query builder.

Example using Bun SQLite:
```ts
import sql from 'sql-light';
import db from './my-db.db' with { type: 'sqlite' };

// Create user table
const userTable = sql.table({
    name: 'Users',
    schema: {
        name: 'text not null',
        pass: 'text not null'
    },
    // Type hint here
    primaryKeys: ['name']
});

// Run create table statement
db.run(userTable.init);

// Create a query
const selectUser = sql.query<{
    name: string
}>($ => `select ${userTable.col('pass')} from ${userTable} where ${userTable.$name} = ${$.name}`);

// Feed to Bun query initializer
const query = db.query<{ pass: string }, typeof selectUser.infer>(selectUser);
```
