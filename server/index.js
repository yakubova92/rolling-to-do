 const express = require('express')
 const next = require('next')
 const bodyParser = require('body-parser')
 const graphqlHttp = require('express-graphql')
 const { buildSchema } = require('graphql')

 const PORT = process.env.PORT || 3000
 const dev = process.env.NODE_ENV !== 'production'
 const app = next({ dev })
 const handle = app.getRequestHandler()

 const events = []

 app.prepare()
  .then( () => {
    const server = express()

    server.use(bodyParser.json())

    server.use('/graphql', graphqlHttp({
      schema: buildSchema(`
        type Event {
          _id: ID!
          title: String!
          description: String!
          date: String!
        }
        input EventInput {
          title: String!
          description: String!
          date: String!
        }
        type RootQuery {
          events: [Event!]!
        }
        type RootMutation {
          createEvent(eventInput: EventInput): Event
        }
        schema {
          query: RootQuery
          mutation: RootMutation
        }
      `),
      rootValue: {
        events: () => {
          return events
        },
        createEvent: args => {
          const event = {
            _id: Math.random().toString(),
            title: args.eventInput.title,
            description: args.eventInput.description,
            date: args.eventInput.date
          }
          events.push(event)
          return event
        }
      },
      graphiql: true
    }))

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
