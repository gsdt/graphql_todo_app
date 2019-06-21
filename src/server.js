const Koa = require('koa');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const { schema } = require('./graphql/schema')
const app = new Koa();


app.use(mount('/graphql', graphqlHTTP({
	schema: schema,
	graphiql: true
})));

app.listen(4000, () => {
	console.log("Listening on: http://127.0.0.1:4000")
});