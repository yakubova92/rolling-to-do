 const express = require('express')
 const next = require('next')
 const bodyParser = require('body-parser')
 const graphqlHttp = require('express-graphql')
 const { buildSchema } = require('graphql')
 const mongoose = require('mongoose')

 const bcrypt = require('bcryptjs')

 require('dotenv').config()

 const PORT = process.env.PORT || 3000
 const dev = process.env.NODE_ENV !== 'production'
 const mongoUser = process.env.MONGO_USER
 const mongoPassword = process.env.MONGO_PASSWORD
 const mongoDatabase = process.env.MONGO_DB

 const app = next({ dev })
 const handle = app.getRequestHandler()

 const Event = require('./models/event')
 const User = require('./models/user')

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
        type User {
          _id: ID!
          email: String!
          password: String
        }

        input EventInput {
          title: String!
          description: String!
          date: String!
        }
        input UserInput {
          email: String!
          password: String!
        }

        type RootQuery {
          events: [Event!]!
        }
        type RootMutation {
          createEvent(eventInput: EventInput): Event
          createUser(userInput: UserInput): User
        }
        schema {
          query: RootQuery
          mutation: RootMutation
        }
      `),
      rootValue: {
        events: () => {
          return Event.find().then(events => {
            return events.map(event => {
              return {...event._doc}
            })
          }).catch(err => {
            throw err
          })
        },
        createEvent: args => {
          const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            date: new Date(args.eventInput.date)
          })
          return event.save().then(result => {
            return {...result._doc}
          }).catch(err => {
            console.log(err)
            throw err
          })
        },
        createUser: args => {
          return User.findOne({email: args.userInput.email}).then(user => {
            if (user) {
              throw new Error('User with this email already exists')
            }
            return bcrypt.hash(args.userInput.password, 12)
          }).then(hashedPassword => {
              const user = new User({
                email: args.userInput.email,
                password: hashedPassword
              })
              return user.save()
            }).then(result => {
              return {...result._doc, password: null}
            }).catch(err => {
              throw err
            })

        }
      },
      graphiql: true
    }))

    // all routes not handled by express will be handled by next
    server.get('*', (req, res) => {
      return handle(req, res)
    })

    mongoose.connect(
      `mongodb+srv://${mongoUser}:${mongoPassword}@rolling-nyrqt.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`
      ).then(() => {
        server.listen(PORT, err => {
          if (err) {
            throw err
          }else {
            console.log(`Server listening at port ${PORT}`)
          }
        })
      }).catch(err => {
        console.log(err)

      })


  })
  .catch(ex => {
    console.error(ex.stack)
    process.exit(1)
  })
