 const express = require('express')
 const next = require('next')

 const PORT = process.env.PORT || 3000
 const dev = process.env.NODE_ENV !== 'production'
 const app = next({ dev })
 const handle = app.getRequestHandler()

 app.prepare()
  .then( () => {
    const server = express()

    const weekRoutes = require('./routes/index.js')
    server.use('/api', weekRoutes)

    // all routes not handled by express will be handled by next
    server.get('*', (req, res) => {
      return handle(req, res)
    })

    server.listen(PORT, err => {
      if (err) {
        throw err
      }else {
        console.log(`Server listening at port ${PORT}`)
      }
    })
  })
  .catch(ex => {
    console.error(ex.stack)
    process.exit(1)
  })
