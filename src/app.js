const express = require('express')
require('./db/mongoose')
const postRouter = require('./routers/post')
const userRouter = require('./routers/user')
const socialRouter = require('./routers/social')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(postRouter)
app.use(socialRouter)

module.exports = app