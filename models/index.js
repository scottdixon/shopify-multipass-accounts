const Multipassify = require('multipassify');
const { MULTIPASS_SECRET } = process.env
const multipassify = new Multipassify(MULTIPASS_SECRET)
const { Sequelize, Model, DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
})

class User extends Model {
  static async generateHash(password) {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds);
  }
  generateMultipassUrl() {
    const { email } = this
    return multipassify.generateUrl({ email }, 'test-shop-987.myshopify.com')
  }
  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    email: {
      type: Sequelize.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING
    },
    loginAttempts: DataTypes.INTEGER,
    lastAttempt: DataTypes.DATE
  },
  {
    sequelize,
    modelName: 'user',
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  }
)

User.beforeCreate(async (user, options) => {
  user.password = await User.generateHash(user.password)
});

sequelize.sync().then(() => console.log('Database ready'))

module.exports = { User }
