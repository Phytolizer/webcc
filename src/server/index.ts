import { getApp } from './app'

const server = getApp({
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  }
})

server.listen({ port: 8080 }, (err, address) => {
  if (err !== null) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`server listening on ${address}`)
})
