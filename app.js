require('dotenv-safe').config()
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const { User } = require('./models')

app.use(bodyParser.urlencoded({ extended: true }))

app.post('/register', async (req, res) => {
  const { email, password } = req.body.customer

  try {
    const user = await User.create({ email, password })
    return res.redirect(user.generateMultipassUrl())
  } catch (err) {
    console.log(err)
  }
})

app.post('/login', async (req, res) => {
  const now = new Date
  const { email, password } = req.body.customer

  let user

  // Look up user
  try {
    user = await User.findOne({ where: { email }})
    if (!user) {
      console.log('User not found')
      return res.redirect('?message=incorrect email/password')
    }
  } catch (err) {
    console.log(err)
  }

  // Confirm password
  if (!await user.validatePassword(password)) {
    console.log('Incorrect password')
    return res.redirect('?message=incorrect email/password')
  }

  return res.redirect(user.generateMultipassUrl())
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
