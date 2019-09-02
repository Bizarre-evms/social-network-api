const express = require('express')
require('./db/mongoose')
const postRouter = require('./routers/post')
const userRouter = require('./routers/user')
const socialRouter = require('./routers/social')

const app = express()

const port = process.env.PORT || 3000

app.use(express.json())
app.use(userRouter)
app.use(postRouter)
app.use(socialRouter)


app.listen(port, () => {
    console.log(`Server start at port ${port}`)
})