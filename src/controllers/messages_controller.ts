/*
curl -X  POST \
 'https://graph.facebook.com/v13.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "text",
  "text": { // the text object
    "preview_url": false,
    "body": "MESSAGE_CONTENT"
  }
}'

{
    "messaging_product": "whatsapp",
    "contacts": [
        {
            "input": "16505076520",
            "wa_id": "16505076520"
        }
    ],
    "messages": [
        {
            "id": "wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA"
        }
    ]
}
*/
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#successful-response
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#text-messages
// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read

import { Request, Response } from 'express'
import { Response as ResponseUno } from '../services/response'
import { Incoming } from '../services/incoming'
import { Outgoing } from '../services/outgoing'
import logger from '../services/logger'

export class MessagesController {
  protected endpoint = 'messages'
  private incoming: Incoming
  private outgoing: Outgoing

  constructor(incoming: Incoming, outgoing: Outgoing) {
    this.incoming = incoming
    this.outgoing = outgoing
  }

  public async index(req: Request, res: Response) {
    logger.debug('%s method %s', this.endpoint, req.method)
    logger.debug('%s headers %s', this.endpoint, JSON.stringify(req.headers))
    logger.debug('%s params %s', this.endpoint, JSON.stringify(req.params))
    logger.debug('%s body %s', this.endpoint, JSON.stringify(req.body))
    const { phone } = req.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...req.body }
    try {
      // Minimal fallback: if "to" is empty, try contacts[].group_id (Chatwoot)
      if (!payload?.to || `${payload.to}`.trim() === '') {
        const contacts = payload?.contacts
        const findGroupId = (source: unknown): string | undefined => {
          if (!source) return undefined
          if (Array.isArray(source)) {
            for (const item of source) {
              const r = findGroupId(item)
              if (r) return r
            }
            return undefined
          }
          if (typeof source === 'object') {
            const obj = source as Record<string, unknown>
            if (typeof obj.group_id === 'string' && obj.group_id.includes('@g.us')) {
              return obj.group_id
            }
            for (const v of Object.values(obj)) {
              const r = findGroupId(v)
              if (r) return r
            }
          }
          return undefined
        }
        const groupId = findGroupId(contacts)
        if (groupId) {
          payload.to = groupId
        }
      }
      const response: ResponseUno = await this.incoming.send(phone, payload, { endpoint: this.endpoint })
      logger.debug('%s response %s', this.endpoint, JSON.stringify(response.ok))
      await res.status(200).json(response.ok)
      if (response.error) {
        logger.debug('%s return status %s', this.endpoint, JSON.stringify(response.error))
        await this.outgoing.send(phone, response.error)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return res.status(400).json({ status: 'error', message: e.message })
    }
  }
}
