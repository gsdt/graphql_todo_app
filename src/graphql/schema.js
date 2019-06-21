
const {
    graphql,
    GraphQLSchema,
    GraphQLInputObjectType,
    GraphQLBoolean,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt
} = require('graphql');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db');
const {
    APP_SECRET,
    getUserId,
} = require('./utils')

const UserType = new GraphQLObjectType({
    name: 'user',
    fields: () => ({
        id: { type: GraphQLInt },
        username: { type: GraphQLString },
        tasks: { type: GraphQLList(TaskType) }
    })
})

const TaskType = new GraphQLObjectType({
    name: 'task',
    fields: () => ({
        id: { type: GraphQLInt },
        content: { type: GraphQLString },
        done: {type: GraphQLBoolean},
        user: { type: UserType }
    })
})

const TokenType = new GraphQLObjectType({
    name: 'token',
    fields: ()=>({
        token: {type: GraphQLString},
        user: {type: UserType}
    })
})

var schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            users: {
                type: GraphQLList(UserType),
                resolve() {
                    return db.User.findAll({
                        include: [db.Task]
                    });
                }
            },
            tasks: {
                type: GraphQLList(TaskType),
                resolve(parent, args, context) {
                    const userId = getUserId(context)
                    return db.Task.findAll({
                        include: [db.User],
                        where: {
                            userId: userId
                        }
                    });
                }
            }
        }
    }),
    mutation: new GraphQLObjectType({
        name: 'RootMutationType',
        fields: () => ({
            signup: {
                type: TokenType,
                args: {
                    username: { type: GraphQLString },
                    password: { type: GraphQLString }
                },
                resolve: async (parent, {username, password}) => {
                    const hashed_password = await bcrypt.hash(password, 10)
                    const user = await db.User.create({
                        username : username,
                        password : hashed_password
                    })
                    const token = jwt.sign({ userId: user.id }, APP_SECRET)
                    return {
                        token,
                        user,
                    }
                }
            },

            login: {
                type: TokenType,
                args: {
                    username: {type: GraphQLString},
                    password: {type: GraphQLString}
                },
                resolve: async (parent, {username, password}) => {
                    const token = db.User.findOne({
                        where: {
                            username: username
                        }
                    }).then(async user => {
                        if (!user) {
                            throw new Error('No such user found')
                        }

                        const valid = await bcrypt.compare(password, user.password)
                        if (!valid) {
                            throw new Error('Invalid password')
                        }
    
                        const token = jwt.sign({ userId: user.id }, APP_SECRET)
                        return {
                            token,
                            user,
                        }
                    });
                    return token;
                }
            },

            create: {
                type: TaskType,
                args: {
                    content: {type: GraphQLString}
                },
                resolve: async (parent, {content}, context) => {
                    const userId = getUserId(context)
                    return db.Task.create({
                        content: content,
                        userId: userId
                    })
                }
            },

            update: {
                type: TaskType,
                args: {
                    id: {type: GraphQLInt},
                    content: {type: GraphQLString},
                    done: {type: GraphQLBoolean}
                },
                resolve: async (parent, args, context) => {
                    const userId = getUserId(context)
                    const task = db.Task.findOne({
                        where: {
                            id: args.id,
                            userId: userId
                        }
                    }).then(task => {
                        if (task === null) {
                            throw new Error("Invalid task")
                        }
                        task = task.update(args);
                        return task;
                    });

                    return task;
                }
            }            
        })
    })
});

module.exports = {
    schema
}