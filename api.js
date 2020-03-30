const Koa = require('koa')
const Router = require('koa-router')
const cors = require('@koa/cors')
const ratelimit = require('koa-ratelimit')
const { MongoClient, ObjectID } = require('mongodb')

const app = new Koa()
const router = new Router()
const uri = 'mongodb://mescal:27017'
const client = new MongoClient(uri)

// Will be set in connect()
let db = null

async function connect(dbname) {
  await client.connect()
  db = client.db(dbname)
}

router.get('/person/:id', async ctx => {
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


router.get('/search/:name', async ctx => {
  const name = ctx.params.name

  const cur = await db.collection('actormovies').find({ actor: new RegExp(`${name}`, 'i')}, { projection: { movies: 0 } })
  const res = await cur.toArray()
  if (res === null) {
    ctx.status = 404
    return
  }
  
  ctx.body = JSON.stringify(res) 
})

app
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

connect('test').catch(console.error).then(() => {
  console.log("Listening on :3000...")
  app.listen(3000)
})