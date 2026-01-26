// import { createClient } from 'redis';

// const client = createClient();

// client.on('error', err => console.log('Redis Client Error', err));

// await client.connect();

// await client.set('key', 'value');
// const value = await client.get('key');
// console.log(value); // >>> value

// await client.hSet('user-session:123', {
//     name: 'John',
//     surname: 'Smith',
//     company: 'Redis',
//     age: 29
// })

// let userSession = await client.hGetAll('user-session:123');
// console.log(JSON.stringify(userSession, null, 2));
// /* >>>
// {
//   "surname": "Smith",
//   "name": "John",
//   "company": "Redis",
//   "age": "29"
// }
//  */

// await client.quit();

import { createClient } from 'redis';
import "dotenv/config";

const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 19919
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar
await client.quit();


