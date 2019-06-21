const Sequelize = require('sequelize');
const Model = Sequelize.Model;

const sequelize = new Sequelize('Todos', 'root', 'gsdt', {
    dialect: 'mysql'
})

class User extends Model { }
User.init({
    username: {
        type: Sequelize.STRING,
        unique: true     
    },
    password: Sequelize.STRING
}, { sequelize, modelName: 'user' });

class Task extends Model { }
Task.init({
    content: Sequelize.STRING,
    done: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, { sequelize, modelName: 'task' })

User.hasMany(Task)
Task.belongsTo(User)

User.sync()
Task.sync()

db = {
    User,
    Task
}

module.exports = db