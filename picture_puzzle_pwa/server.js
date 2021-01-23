const express = require('express')
const app = express()
const port = 3000

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })


// Serving static files in Express
// https://expressjs.com/en/starter/static-files.html

app.use(express.static('./dist'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
