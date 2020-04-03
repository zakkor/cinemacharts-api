const Koa = require('koa')
const Router = require('koa-router')
const cors = require('@koa/cors')
const ratelimit = require('koa-ratelimit')
const logger = require('koa-logger')
const { MongoClient, ObjectID } = require('mongodb')

const app = new Koa()
const router = new Router()
const uri = 'mongodb://mongo:27017'
const client = new MongoClient(uri, { useUnifiedTopology: true })
const port = 8080

// Will be set in connect()
let db = null

async function connect(dbname) {
  await client.connect()
  db = client.db(dbname)
}

app
  .use(logger())
  .use(cors())
  .use(ratelimit({
    driver: 'memory',
    db: new Map(),
    duration: 60000,
    errorMessage: 'You are being rate-limited, slow down.',
    id: ctx => ctx.ip,
    max: 100,
  }))
  .use(router.routes())
  .use(router.allowedMethods());

router.get('/api/person/:id', async ctx => {
  let id = null
  try {
    id = new ObjectID(ctx.params.id)
  } catch {
    // If ID is not valid
    ctx.status = 500
    return
  }

  const res = await db.collection('actormovies').findOne(id)
  if (res === null) {
    ctx.status = 404
    return
  }
  res.movies = res.movies.filter(m => m.rating > 0)

  ctx.body = JSON.stringify(res)
})


router.get('/api/search/:name', async ctx => {
  const name = ctx.params.name

  const cur = await db.collection('actors').find({ name: new RegExp(`${name}`, 'i')})
  const res = await cur.toArray()
  if (res === null) {
    ctx.status = 404
    return
  }
  
  ctx.body = JSON.stringify(res) 
})

connect('test').catch(console.error).then(() => {
  console.log(`Listening on :${port}...`)
  app.listen(port)
})
