import { amqpPublish } from '../amqp'
import { UNOAPI_EXCHANGE_BRIDGE_NAME, UNOAPI_EXCHANGE_BROKER_NAME, UNOAPI_QUEUE_RELOAD } from '../defaults'
import { getConfig } from './config'
import { Reload } from './reload'

export class ReloadAmqp extends Reload {
  private getConfig: getConfig

  constructor(getConfig: getConfig) {
    super()
    this.getConfig = getConfig
  }

  public async run(phone: string) {
    const config = await this.getConfig(phone)
    await amqpPublish(UNOAPI_EXCHANGE_BROKER_NAME, UNOAPI_QUEUE_RELOAD, phone, { phone }, { type: 'topic' })
    await amqpPublish(UNOAPI_EXCHANGE_BRIDGE_NAME, `${UNOAPI_QUEUE_RELOAD}.${config.server!}`, '', { phone }, { type: 'direct' })
  }
}
