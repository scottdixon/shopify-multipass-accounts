require('dotenv-safe').config()
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const { User } = require('./models')
const { LOCKOUT_ATTEMPS, LOCKOUT_DURATION_MINUTES, SHOP } = process.env

app.use(bodyParser.urlencoded({ extended: true }))

app.post('/register', async (req, res) => {
  const { email, password } = req.body.customer

  try {
    const user = await User.create({ email, password })
    return res.redirect(user.generateMultipassUrl())
  } catch (err) {
    if (err.errors[0].type === 'unique violation') {
      return res.redirect(`https://${SHOP}/account/register?message=account already exists`)
    }
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
      return res.redirect(`https://${SHOP}/account/login?message=incorrect email/password`)
    }
  } catch (err) {
    console.log(err)
  }

  // Are they locked out?
  const minutesSinceLastAttempt = (now - new Date(user.lastAttempt)) / 1000 / 60
  console.log('Minutes since last attempt: ', minutesSinceLastAttempt)

  if (user.loginAttempts >= LOCKOUT_ATTEMPS) {
    if (minutesSinceLastAttempt < LOCKOUT_DURATION_MINUTES) {
      console.log('Locked Out')
      return res.redirect(`https://${SHOP}/account/login?message=too many attempts`)
    } else {
      // Reset
      user.setDataValue('loginAttempts', 0)
      user.save()
    }
  }

  // Confirm password
  if (!await user.validatePassword(password)) {
    console.log('Incorrect password')
    user.set('loginAttempts', user.loginAttempts + 1)
    user.set('lastAttempt', now.toJSON())
    user.save()

    return res.redirect(`https://${SHOP}/account/login?message=incorrect email/password`)
  }

  // Correct password, reset login attempts
  user.setDataValue('loginAttempts', 0)
  user.save()
  return res.redirect(user.generateMultipassUrl())
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
