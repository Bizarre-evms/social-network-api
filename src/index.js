const app = require('./app')

const port = process.env.PORT

app.listen(port, () => {
    console.log(`Server start at port ${port}`)
})