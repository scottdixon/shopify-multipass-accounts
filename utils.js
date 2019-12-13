const { SHOP } = process.env

const redirect = (res, endpoint, message) => {
  return res.redirect(`https://${SHOP}/account/${endpoint}?message=${message}`)
}

module.exports = { redirect }
