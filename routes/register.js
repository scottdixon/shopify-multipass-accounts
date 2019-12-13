const express = require('express')
const router = express.Router()
const { User } = require('../models')
const { redirect } = require('../utils')

router.post('/register', async (req, res) => {
  const { email, password } = req.body.customer

  try {
    const user = await User.create({ email, password })
    return res.redirect(user.generateMultipassUrl())
  } catch (error) {
    const { message } = error.errors[0]
    return redirect(res, 'register', message)
  }
})

module.exports = router
