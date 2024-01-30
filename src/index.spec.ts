import { test } from 'bun:test';
import sql from '.';

// Create some table scheme
const users = sql.table({
    name: 'users',

    schema: {
        name: 'text not null',
        pass: 'text not null'
    },

    primaryKeys: ['name']
});

const posts = sql.table({
    name: 'posts',

    schema: {
        id: 'int not null',
        title: 'text not null',
        content: 'text not null',
        author: 'text not null'
    },

    primaryKeys: ['id'],
    foreignKeys: [{
        keys: ['author'],
        ref: users('name')
    }]
})

test('Table', () => {
    // Log init query
    console.log(users.init);
    console.log(posts.init);

    // Log create query
    console.log(sql.query(`select * from ${users} where id = $id`));
});
