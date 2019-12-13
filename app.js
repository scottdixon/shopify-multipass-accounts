require('dotenv-safe').config()
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const { sequelize } = require('./models')
const { login, register } = require('./routes')

app.use(bodyParser.urlencoded({ extended: true }))

app.post('/register', register)
app.post('/login', login)

sequelize.sync().then(() => {
  app.listen(port, () => console.log(`Listening on port ${port}!`))
})
