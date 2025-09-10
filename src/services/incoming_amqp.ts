import { Incoming } from './incoming'
import { amqpGetChannel } from '../amqp'
import { v1 as uuid } from 'uuid'
import { jidToPhoneNumber } from './transformer'
import { getConfig } from './config'

const EXCHANGE = 'unoapi.outgoing'
let initialized = false

const initExchange = async () => {
  if (initialized) {
    return
  }
  const channel = await amqpGetChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })
  await channel.assertQueue('outgoing.baileys', { durable: true })
  await channel.bindQueue('outgoing.baileys', EXCHANGE, 'provider.baileys.*')
  await channel.assertQueue('outgoing.baileys.dlq', { durable: true })
  await channel.assertQueue('outgoing.whatsmeow', { durable: true, exclusive: false })
  await channel.bindQueue('outgoing.whatsmeow', EXCHANGE, 'provider.whatsmeow.*')
  await channel.assertQueue('outgoing.whatsmeow.dlq', { durable: true, exclusive: false })
  initialized = true
}

export class IncomingAmqp implements Incoming {
  private getConfig: getConfig

  constructor(getConfig: getConfig) {
    this.getConfig = getConfig
  }

  public async send(phone: string, payload: object, options: object = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { status, type, to } = payload as any
    const config = await this.getConfig(phone)
    const provider = config.provider || 'baileys'
    await initExchange()
    const channel = await amqpGetChannel()
    const routingKey = `provider.${provider}.${phone}`
    if (status) {
      options['type'] = 'direct'
      options['priority'] = 3 // update status is always middle important
      const data = { payload, options }
      channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(data)), {
        contentType: 'application/json',
        messageId: (payload as any).message_id,
        persistent: true,
      })
      return { ok: { success: true } }
    } else if (type) {
      const id = uuid()
      if (!options['priority']) {
        options['priority'] = 5 // send message without bulk is very important
      }
      const data = { payload, id, options }
      channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(data)), {
        contentType: 'application/json',
        messageId: id,
        persistent: true,
      })
      const ok = {
        messaging_product: 'whatsapp',
        contacts: [
          {
            wa_id: jidToPhoneNumber(to, ''),
          },
        ],
        messages: [
          {
            id,
          },
        ],
      }
      return { ok }
    } else {
      throw `Unknown incoming message ${JSON.stringify(payload)}`
    }
  }
}
