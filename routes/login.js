const express = require('express')
const router = express.Router()
const { User } = require('../models')
const { redirect } = require('../utils')
const { LOCKOUT_ATTEMPS, LOCKOUT_DURATION_MINUTES } = process.env

router.post('/login', async (req, res) => {
  const now = new Date
  const { email, password } = req.body.customer
  let user

  // Look up user
  try {
    user = await User.findOne({ where: { email }})
    if (!user) {
      console.log('User not found')
      return redirect(res, 'login', 'incorrect email/password')
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
      return redirect(res, 'login', 'too many attempts')
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
    return redirect(res, 'login', 'incorrect email/password')
  }

  // Correct password, reset login attempts
  user.setDataValue('loginAttempts', 0)
  user.save()
  return res.redirect(user.generateMultipassUrl())
})

module.exports = router
