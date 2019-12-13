const Multipassify = require('multipassify');
const { MULTIPASS_SECRET, PASSWORD_MIN_LENGTH, PASSWORD_MUST_CONTAIN_LOWER_CASE, PASSWORD_MUST_CONTAIN_UPPER_CASE, PASSWORD_MUST_CONTAIN_NUMBERS, PASSWORD_MUST_CONTAIN_SPECIAL_CHARACTERS } = process.env
const multipassify = new Multipassify(MULTIPASS_SECRET)
const { Sequelize, Model, DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')
const yn = require('yn')

console.log(JSON.stringify(PASSWORD_MUST_CONTAIN_LOWER_CASE), JSON.stringify(true), JSON.stringify('true'))

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
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        minimumLength: (password) => {
          if (PASSWORD_MIN_LENGTH && password.length < PASSWORD_MIN_LENGTH) {
            throw new Error(`Minimum password length ${PASSWORD_MIN_LENGTH} characters`)
          }
        },
        passwordComplexity: (password) => {
          if (yn(PASSWORD_MUST_CONTAIN_LOWER_CASE) && !/(?=.*[a-z])/.test(password)) {
            throw new Error(`Password must contain a lower case character`)

          }
          if (yn(PASSWORD_MUST_CONTAIN_UPPER_CASE) && !/(?=.*[A-Z])/.test(password)) {
            throw new Error(`Password must contain an upper case character`)
          }
          if (yn(PASSWORD_MUST_CONTAIN_NUMBERS) && !/(?=.*[0-9])/.test(password)) {
            throw new Error(`Password must contain a number`)
          }
          if (yn(PASSWORD_MUST_CONTAIN_SPECIAL_CHARACTERS) && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
            throw new Error(`Password must contain a special character`)
          }
        }
      }
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
