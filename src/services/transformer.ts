import {
  AnyMessageContent,
  WAMessage,
  isJidNewsletter,
  isPnUser,
  isLidUser,
  normalizeMessageContent,
  proto,
} from '@whiskeysockets/baileys'
import mime from 'mime-types'
import { parsePhoneNumber } from 'awesome-phonenumber'
import vCard from 'vcf'
import logger from './logger'
import { Config } from './config'
import { MESSAGE_CHECK_WAAPP } from '../defaults'
import { t } from '../i18n'

export const TYPE_MESSAGES_TO_PROCESS_FILE = [
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'documentMessage',
  'stickerMessage',
  'ptvMessage',
]

export const TYPE_MESSAGES_MEDIA = ['image', 'audio', 'document', 'video', 'sticker']

const MESSAGE_STUB_TYPE_ERRORS = [
  'Message absent from node'.toLowerCase(),
  'Invalid PreKey ID'.toLowerCase(),
  'Key used already or never filled'.toLowerCase(),
  'No SenderKeyRecord found for decryption'.toLowerCase(),
  'No session record'.toLowerCase(),
  'No matching sessions found for message'.toLowerCase(),
]

export class BindTemplateError extends Error {
  constructor() {
    super('')
  }
}

export class DecryptError extends Error {
  private content: object

  constructor(content: object) {
    super('')
    this.content = content
  }

  getContent() {
    return this.content
  }
}

export const TYPE_MESSAGES_TO_READ = [
  'viewOnceMessage',
  'editedMessage',
  'ephemeralMessage',
  'documentWithCaptionMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'stickerMessage',
  'documentMessage',
  'contactMessage',
  'contactsArrayMessage',
  'extendedTextMessage',
  'reactionMessage',
  'locationMessage',
  'liveLocationMessage',
  'listResponseMessage',
  'conversation',
  'ptvMessage',
]

const OTHER_MESSAGES_TO_PROCESS = [
  'protocolMessage',
  'senderKeyDistributionMessage',
  'messageContextInfo',
  'messageStubType',
]

// -------------------- helpers --------------------

const toStr = (v: unknown) => (v == null ? undefined : String(v))

export const getMimetype = (payload: any) => {
  const { type } = payload
  const link: string | undefined = payload?.[type]?.link
  let mimetype: string | false = false

  if (link) {
    try {
      mimetype = mime.lookup(link.split('?')[0])
    } catch {
      mimetype = false
    }
    if (!mimetype) {
      try {
        const url = new URL(link)
        const qType = url.searchParams.get('response-content-type')
        if (qType) mimetype = qType
        if (!mimetype) {
          const cd = url.searchParams.get('response-content-disposition')
          if (cd) {
            const filename = cd.split('filename=')[1]?.split(';')[0]
            if (filename) mimetype = mime.lookup(filename)
          }
        }
      } catch {
        logger.error(`Error on parse url: ${link}`)
      }
    }
  }

  if (type === 'audio') {
    if (mimetype === 'audio/ogg') {
      mimetype = 'audio/ogg; codecs=opus'
    } else if (!mimetype) {
      mimetype = 'audio/mpeg'
    }
  }

  if (!mimetype && payload?.[type]?.filename) {
    mimetype = mime.lookup(payload[type].filename) || false
  }

  return mimetype ? `${mimetype}` : 'application/unknown'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMessageType = (payload: any) => {
  if (payload.update) {
    return 'update'
  } else if (payload.status && ![2, '2', 'SERVER_ACK'].includes(payload.status) && !payload.key?.fromMe) {
    return 'update'
  } else if (payload.receipt) {
    return 'receipt'
  } else if (payload.message) {
    const { message } = payload
    return (
      TYPE_MESSAGES_TO_READ.find((t) => (message as any)[t]) ||
      OTHER_MESSAGES_TO_PROCESS.find((t) => (message as any)[t]) ||
      Object.keys(payload.message)[0]
    )
  } else if (payload.messageStubType) {
    return 'messageStubType'
  }
}

export const isSaveMedia = (message: WAMessage) => {
  const normalizedMessage = getNormalizedMessage(message)
  const messageType = normalizedMessage && getMessageType(normalizedMessage)
  return !!(messageType && TYPE_MESSAGES_TO_PROCESS_FILE.includes(messageType))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBinMessage = (
  waMessage: WAMessage,
): { messageType: string; message: any } | undefined => {
  const message: proto.IMessage | undefined = normalizeMessageContent(waMessage.message)
  const messageType = getMessageType({ message })
  if (message && messageType && (message as any)[messageType]) {
    return { messageType, message: (message as any)[messageType] }
  }
}

export const getNormalizedMessage = (waMessage: WAMessage): WAMessage | undefined => {
  const binMessage = getBinMessage(waMessage)
  if (binMessage) {
    let { message } = binMessage
    if ((message as any)?.editedMessage) {
      message = (message as any)?.protocolMessage?.editedMessage
    } else if ((message as any)?.protocolMessage?.editedMessage) {
      message = (message as any)?.protocolMessage?.editedMessage
    }
    return { key: waMessage.key, message: { [binMessage.messageType]: message } }
  }
}

export const completeCloudApiWebHook = (phone, to: string, message: object) => {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: phone,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: phone,
                phone_number_id: phone,
              },
              messages: [message],
              contacts: [
                {
                  profile: {
                    name: to,
                  },
                  wa_id: to,
                },
              ],
              statuses: [],
              errors: [],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

// -------------------- outbound (send) --------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toBaileysMessageContent = (
  payload: any,
  customMessageCharactersFunction = (m) => m,
): AnyMessageContent => {
  const { type } = payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = {}
  switch (type) {
    case 'text':
      response.text = customMessageCharactersFunction(payload.text.body)
      break

    case 'interactive': {
      let listMessage = {}
      if (payload.interactive.header) {
        listMessage = {
          title: payload.interactive.header.text,
          description: payload.interactive.body.text,
          buttonText: payload.interactive.action.button,
          footerText: payload.interactive.footer.text,
          sections: payload.interactive.action.sections.map(
            (section: { title: string; rows: { title: string; rowId: string; description: string }[] }) => {
              return {
                title: section.title,
                rows: section.rows.map((row: { title: string; rowId: string; description: string }) => {
                  return {
                    title: row.title,
                    rowId: row.rowId,
                    description: row.description,
                  }
                }),
              }
            },
          ),
          listType: 2,
        }
      } else {
        listMessage = {
          title: '',
          description: payload.interactive.body.text || 'Nenhuma descriçao encontrada',
          buttonText: 'Selecione',
          footerText: '',
          sections: [
            {
              title: 'Opcões',
              rows: payload.interactive.action.buttons.map((button: { reply: { title: string; id: string; description: string } }) => {
                return {
                  title: button.reply.title,
                  rowId: button.reply.id,
                  description: '',
                }
              }),
            },
          ],
          listType: 2,
        }
      }
      response.listMessage = listMessage
      break
    }

    case 'image':
    case 'audio':
    case 'document':
    case 'video': {
      const link = payload[type].link
      if (link) {
        const mimetype: string = getMimetype(payload)
        if (type === 'audio') {
          // só marcamos ptt se de fato for ptt
          if (payload?.audio?.ptt === true) response.ptt = true
        }
        if (payload[type].filename) {
          response.fileName = payload[type].filename
        }
        if (mimetype) {
          response.mimetype = mimetype
        }
        if (payload[type].caption) {
          response.caption = customMessageCharactersFunction(payload[type].caption)
        }
        response[type] = { url: link }
        break
      }
      // se não tem link, cai para o default (erro)
    }

    case 'contacts': {
      const contact = payload[type][0]
      const contacName = contact['name']['formatted_name']
      const contacts: any[] = []
      for (let index = 0; index < contact['phones'].length; index++) {
        const phone = contact['phones'][index]
        const waid = phone['wa_id']
        const number = phone['phone']
        const vcard =
          'BEGIN:VCARD\n' +
          'VERSION:3.0\n' +
          `N:${contacName}\n` +
          `TEL;type=CELL;type=VOICE;waid=${waid}:${number}\n` +
          'END:VCARD'
        contacts.push({ vcard })
      }
      const displayName = contact['phones'].length > 1 ? `${contact['phones'].length} contacts` : contacName
      response[type] = { displayName, contacts }
      break
    }

    case 'template':
      throw new BindTemplateError()

    default:
      throw new Error(`Unknow message type ${type}`)
  }
  return response
}

// -------------------- jid/phone helpers --------------------

export const phoneNumberToJid = (phoneNumber: string) => {
  if (phoneNumber.indexOf('@') >= 0) {
    logger.debug('%s already is jid', phoneNumber)
    return phoneNumber
  } else {
    const jid = `${jidToPhoneNumber(phoneNumber, '')}@s.whatsapp.net`
    logger.debug('transform %s to %s', phoneNumber, jid)
    return jid
  }
}

export const isIndividualJid = (jid: string) => {
  // considere PN como individual; LID também é individual, mas neste helper
  // mantemos compatibilidade antiga: individual para PN ou sem @
  const isIndividual = isPnUser(jid) || jid.indexOf('@') < 0
  logger.debug('jid %s is individual? %s', jid, isIndividual)
  return isIndividual
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isIndividualMessage = (payload: any) => {
  const {
    key: { remoteJid },
  } = payload
  return isIndividualJid(remoteJid)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getChatAndNumberAndId = (payload: any): [string, string, string] => {
  const {
    key: { remoteJid },
  } = payload
  if (isIndividualJid(remoteJid)) {
    return [remoteJid, jidToPhoneNumber(remoteJid), remoteJid]
  } else {
    return [remoteJid, ...getNumberAndId(payload)]
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNumberAndId = (payload: any): [string, string] => {
  const {
    key: {
      remoteJidAlt,
      remoteJid,
      senderPn,
      participantPn,
      participant,
      senderLid,
      participantAlt,
      participantLid,
    },
    participant: participant2,
    participantPn: participantPn2,
  } = payload

  const value =
    senderLid || participantAlt || participantLid || participant || participant2 || remoteJidAlt || remoteJid

  const split = String(value).split('@')
  const id = `${split[0].split(':')[0]}@${split[1]}`

  // >>> preferir PN (remoteJid) a LID (remoteJidAlt) para o phone (tests)
  const phone = jidToPhoneNumber(
    participantPn ||
    senderPn ||
    participant ||
    participant2 ||
    participantPn2 ||
    remoteJid || // PN primeiro
    remoteJidAlt, // LID por último
    '',
  )

  return [phone, id]
}

export const formatJid = (jid: string) => {
  const jidSplit = jid.split('@')
  return `${jidSplit[0].split(':')[0]}@${jidSplit[1]}`
}

export const isValidPhoneNumber = (value: string, nine = false): boolean => {
  const number = `+${(value || '').split('@')[0].split(':')[0].replace('+', '')}`
  const country = number.replace('+', '').substring(0, 2)
  const parsed = parsePhoneNumber(number)
  const numbers = (parsed?.number?.significant as string) || ''
  const isInValid =
    !parsed.valid ||
    !parsed.possible ||
    (nine && country == '55' && numbers.length < 11 && ['6', '7', '8', '9'].includes(numbers[2]))
  if (isInValid) {
    logger.warn('phone number %s is invalid %s', value, isInValid)
  }
  return !isInValid
}

export const extractDestinyPhone = (payload: object, throwError = true) => {
  const data = payload as any
  const number =
    data?.to ||
    (data?.entry &&
      data.entry[0] &&
      data.entry[0].changes &&
      data.entry[0].changes[0] &&
      data.entry[0].changes[0].value &&
      ((data.entry[0].changes[0].value.contacts &&
          data.entry[0].changes[0].value.contacts[0] &&
          data.entry[0].changes[0].value.contacts[0].wa_id?.replace('+', '')) ||
        (data.entry[0].changes[0].value.statuses &&
          data.entry[0].changes[0].value.statuses[0] &&
          data.entry[0].changes[0].value.statuses[0].recipient_id?.replace('+', '')) ||
        (data.entry[0].changes[0].value.messages &&
          data.entry[0].changes[0].value.messages[0] &&
          data.entry[0].changes[0].value.messages[0].from?.replace('+', ''))))
  if (!number && throwError) {
    throw Error(`error on get phone number from ${JSON.stringify(payload)}`)
  }
  return number
}

export const getGroupId = (payload: object) => {
  const data = payload as any
  return (
    data.entry &&
    data.entry[0] &&
    data.entry[0].changes &&
    data.entry[0].changes[0] &&
    data.entry[0].changes[0].value &&
    data.entry[0].changes[0].value.contacts &&
    data.entry[0].changes[0].value.contacts[0] &&
    data.entry[0].changes[0].value.contacts[0].group_id
  )
}

export const isGroupMessage = (payload: object) => {
  return !!getGroupId(payload)
}

export const isNewsletterMessage = (payload: object) => {
  const groupId = getGroupId(payload)
  return groupId && isJidNewsletter(groupId)
}

export const extractSessionPhone = (payload: object) => {
  const data = payload as any
  const session =
    data.entry[0].changes[0].value.messages &&
    data.entry[0].changes[0].value.metadata &&
    data.entry[0].changes[0].value.metadata.display_phone_number

  return `${session || ''}`.replaceAll('+', '')
}

export const isOutgoingMessage = (payload: object) => {
  const from = extractDestinyPhone(payload, false)
  const session = extractSessionPhone(payload)
  return session && from && session == from
}

export const isUpdateMessage = (payload: object) => {
  const data = payload as any
  return data.entry[0].changes[0].value.statuses && data.entry[0].changes[0].value.statuses[0]
}

export const isIncomingMessage = (payload: object) => {
  const from = extractDestinyPhone(payload, false)
  const session = extractSessionPhone(payload)
  return session && from && session != from
}

export const extractTypeMessage = (payload: object) => {
  const data = payload as any
  return (
    data?.entry &&
    data.entry[0] &&
    data.entry[0].changes &&
    data.entry[0].changes[0] &&
    data.entry[0].changes[0].value &&
    data.entry[0].changes[0].value.messages &&
    data.entry[0].changes[0].value.messages[0] &&
    data.entry[0].changes[0].value.messages[0].type
  )
}

export const isAudioMessage = (payload: object) => {
  return 'audio' == extractTypeMessage(payload)
}

export const isFailedStatus = (payload: object) => {
  const data = payload as any
  return (
    'failed' ==
    (data.entry[0].changes[0].value.statuses &&
      data.entry[0].changes[0].value.statuses[0] &&
      data.entry[0].changes[0].value.statuses[0].status)
  )
}

// -------------------- inbound (receive) --------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jidToPhoneNumber = (value: any, plus = '+', retry = true): string => {
  if (isLidUser(value) || isJidNewsletter(value)) {
    return value
  }
  const number = String(value || '').split('@')[0].split(':')[0].replace('+', '')
  const country = number.substring(0, 2)
  if (country == '55') {
    const isValid = isValidPhoneNumber(`+${number}`, true)
    if (!isValid && number.length < 13 && retry) {
      const prefix = number.substring(2, 4)
      const digits = number.match('.{8}$')?.[0] || ''
      const digit = '9'
      const out = `${plus}${country}${prefix}${digit}${digits}`.replace('+', '')
      return jidToPhoneNumber(`${plus}${out}`, plus, false)
    }
  }
  return `${plus}${number.replace('+', '')}`
}

export const jidToPhoneNumberIfUser = (value: any): string => {
  return isIndividualJid(value) ? jidToPhoneNumber(value, '') : value
}

/**
 * Converte uma mensagem do Baileys para um payload no “formato Cloud API”.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fromBaileysMessageContent = (
  phone: string,
  payload: any,
  config?: Partial<Config>,
): [any, string, string] => {
  try {
    const {
      key: { id: whatsappMessageId, fromMe },
    } = payload
    const [chatJid, senderPhone, senderId] = getChatAndNumberAndId(payload)
    const messageType = getMessageType(payload)
    const binMessage =
      payload.update || payload.receipt || (messageType && payload.message && payload.message[messageType])
    const profileName = fromMe ? senderPhone : payload.verifiedBizName || payload.pushName || senderPhone

    let cloudApiStatus: string | undefined
    let messageTimestamp = payload.messageTimestamp

    // group metadata
    const groupMetadata: any = {}
    if (payload.groupMetadata) {
      groupMetadata.group_subject = payload.groupMetadata.subject
      groupMetadata.group_id = chatJid
      groupMetadata.group_picture = payload.groupMetadata.profilePicture
    }

    const statuses: any[] = []
    const messages: any[] = []
    const errors: any[] = []

    const contactEntry: any = {
      profile: { name: profileName },
      ...groupMetadata,
      wa_id: jidToPhoneNumber(senderPhone, ''),
    }
    if (payload.profilePicture) {
      contactEntry.profile.picture = payload.profilePicture
    }

    const change = {
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: phone,
          phone_number_id: phone,
        },
        messages,
        contacts: [contactEntry],
        statuses,
        errors,
      },
      field: 'messages',
    }

    const data = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: phone,
          changes: [change],
        },
      ],
    }

    const message: any = {
      from: (fromMe ? phone : senderPhone).replace('+', ''),
      id: whatsappMessageId,
    }
    if (payload.messageTimestamp) {
      message['timestamp'] = String(payload.messageTimestamp)
    }

    switch (messageType) {
      case 'imageMessage':
      case 'videoMessage':
      case 'audioMessage':
      case 'stickerMessage':
      case 'documentMessage':
      case 'ptvMessage': {
        let mediaType = messageType.replace('Message', '')
        const mediaKey = `${phone}/${whatsappMessageId}`
        const mimetype =
          (binMessage?.fileName && mime.lookup(binMessage.fileName)) ||
          (toStr(binMessage?.mimetype) || '').split(';')[0]
        const extension = mime.extension(mimetype || '') || 'bin'
        const filename = binMessage?.fileName || `${payload.key.id}.${extension}`

        // ptv => trate como o tipo do mime (geralmente video)
        if (mediaType === 'ptv') {
          mediaType = (mimetype || 'video').split('/')[0]
        }

        const media: any = {
          id: mediaKey,
          filename,
          mime_type: mimetype || 'application/octet-stream',
        }
        if (binMessage?.caption) media.caption = binMessage.caption
        
        if (binMessage?.fileSha256) {
          media.sha256 = Buffer.from(binMessage.fileSha256).toString('base64');
        }
        if (binMessage?.fileEncSha256) {
          media.enc_sha256 = Buffer.from(binMessage.fileEncSha256).toString('base64');
        }
        if (binMessage?.mediaKey) {
          media.media_key = Buffer.from(binMessage.mediaKey).toString('base64');
        }

        if (binMessage?.ptt === true) media.ptt = true
        if (typeof binMessage?.seconds === 'number') media.seconds = binMessage.seconds

        message[mediaType] = media
        message.type = mediaType
        break
      }

      case 'contactMessage':
      case 'contactsArrayMessage': {
        const vcards =
          messageType == 'contactMessage' ? [binMessage.vcard] : binMessage.contacts.map((c: any) => c.vcard)
        const contacts: any[] = []
        for (let i = 0; i < vcards.length; i++) {
          const vcard = vcards[i]
          if (vcard) {
            const card: vCard = new vCard().parse(vcard.replace(/\r?\n/g, '\r\n'))
            const contact = {
              name: {
                formatted_name: card.get('fn').valueOf(),
              },
              phones: [
                {
                  phone: card.get('tel').valueOf(),
                },
              ],
            }
            contacts.push(contact)
          }
        }
        message.contacts = contacts
        message.type = 'contacts'
        break
      }

      case 'editedMessage': {
        const editedMessage = binMessage.message?.protocolMessage
          ? binMessage.message.protocolMessage[messageType]
          : binMessage.message
        const editedMessagePayload = {
          ...payload,
          message: editedMessage,
        }
        const editedMessageType = getMessageType(editedMessagePayload)
        const editedBinMessage = getBinMessage(editedMessagePayload)
        // se for mídia editada sem URL, reaproveita a caption como texto
        if (
          editedMessageType &&
          TYPE_MESSAGES_TO_PROCESS_FILE.includes(editedMessageType) &&
          !editedBinMessage?.message?.url &&
          editedBinMessage?.message?.caption
        ) {
          editedMessagePayload.message = {
            conversation: editedBinMessage?.message?.caption,
          }
        }
        return fromBaileysMessageContent(phone, editedMessagePayload, config)
      }

      case 'protocolMessage':
        if (binMessage.editedMessage) {
          return fromBaileysMessageContent(
            phone,
            { ...payload, message: { editedMessage: { message: { protocolMessage: binMessage } } } },
            config,
          )
        } else {
          logger.debug(`Ignore message type ${messageType}`)
          return [null, senderPhone, senderId]
        }

      case 'ephemeralMessage':
      case 'viewOnceMessage':
      case 'viewOnceMessageV2':
      case 'documentWithCaptionMessage':
      case 'viewOnceMessageV2Extension': {
        const changedPayload = {
          ...payload,
          message: binMessage.message,
        }
        return fromBaileysMessageContent(phone, changedPayload, config)
      }

      case 'conversation':
      case 'extendedTextMessage':
        message.text = {
          body: binMessage?.text || binMessage,
        }
        message.type = 'text'
        break

      case 'reactionMessage': {
        const reactionId = binMessage.key.id
        if (config?.sendReactionAsReply) {
          message.text = { body: binMessage.text }
          message.type = 'text'
          message.context = { message_id: reactionId, id: reactionId }
        } else {
          message.reaction = { message_id: reactionId, emoji: binMessage.text }
          message.type = 'reaction'
        }
        break
      }

      case 'locationMessage':
      case 'liveLocationMessage': {
        const { degreesLatitude, degreesLongitude } = binMessage
        message.location = {
          latitude: degreesLatitude,
          longitude: degreesLongitude,
        }
        message.type = 'location'
        break
      }

      case 'receipt': {
        const {
          receipt: { receiptTimestamp, readTimestamp },
        } = payload
        if (readTimestamp) {
          cloudApiStatus = 'read'
          messageTimestamp = readTimestamp
        } else if (receiptTimestamp) {
          cloudApiStatus = 'delivered'
          messageTimestamp = receiptTimestamp
        }
        break
      }

      case 'messageStubType':
        MESSAGE_STUB_TYPE_ERRORS
        if (
          payload.messageStubType == 2 &&
          payload.messageStubParameters &&
          payload.messageStubParameters[0] &&
          MESSAGE_STUB_TYPE_ERRORS.includes(String(payload.messageStubParameters[0]).toLowerCase())
        ) {
          message.text = {
            body: MESSAGE_CHECK_WAAPP || t('failed_decrypt'),
          }
          message.type = 'text'
          change.value.messages.push(message)
          throw new DecryptError(data)
        } else {
          return [null, senderPhone, senderId]
        }

      case 'update': {
        const baileysStatus = payload.status || payload.update.status
        if (!baileysStatus && payload.update.status != 0 && !payload?.update?.messageStubType && !payload?.update?.starred) {
          return [null, senderPhone, senderId]
        }
        switch (baileysStatus) {
          case 0:
          case '0':
          case 'ERROR':
            cloudApiStatus = 'failed'
            break
          case 1:
          case '1':
          case 'PENDING':
          case 2:
          case '2':
          case 'SERVER_ACK':
            cloudApiStatus = 'sent'
            break
          case 3:
          case '3':
          case 'DELIVERY_ACK':
            cloudApiStatus = 'delivered'
            break
          case 4:
          case '4':
          case 'READ':
          case 5:
          case '5':
          case 'PLAYED':
            cloudApiStatus = 'read'
            break
          case 'DELETED':
            cloudApiStatus = 'deleted'
            break
          default:
            if (payload.update && payload.update.messageStubType && payload.update.messageStubType == 1) {
              cloudApiStatus = 'deleted'
            } else if (payload?.update?.starred) {
              cloudApiStatus = 'read'
            } else {
              cloudApiStatus = 'failed'
              payload = {
                update: {
                  error: 4,
                  title: `Unknown baileys status type ${baileysStatus}`,
                },
              }
            }
        }
        break
      }

      case 'listResponseMessage':
        message.text = { body: payload.message.listResponseMessage.title }
        message.type = 'text'
        break

      case 'statusMentionMessage':
        // ignore
        break

      case 'messageContextInfo':
      case 'senderKeyDistributionMessage':
      case 'albumMessage':
      case 'keepInChatMessage':
        logger.debug(`Ignore message type ${messageType}`)
        return [null, senderPhone, senderId]

      default:
        cloudApiStatus = 'failed'
        payload = {
          update: {
            error: 4,
            title: `Unknown baileys message type ${messageType}`,
          },
        }
    }

    if (cloudApiStatus) {
      const messageId = whatsappMessageId
      const state: any = {
        conversation: { id: chatJid },
        id: messageId,
        recipient_id: senderPhone.replace('+', ''),
        status: cloudApiStatus,
      }
      if (messageTimestamp) {
        state['timestamp'] = String(messageTimestamp)
      }
      if (cloudApiStatus == 'failed') {
        // https://github.com/tawn33y/whatsapp-cloud-api/issues/40#issuecomment-1290036629
        let title = payload?.update?.title || 'The Unoapi Cloud has a error, verify the logs'
        let code = payload?.update?.code || 1
        if (payload?.update?.messageStubParameters == '405') {
          title = 'message not allowed'
          code = 8
        }
        const error = { code, title }
        state.errors = [error]
      }
      change.value.statuses.push(state)
    } else {
      const stanzaId = binMessage?.contextInfo?.stanzaId
      if (stanzaId) {
        message.context = { message_id: stanzaId, id: stanzaId }
      }

      const externalAdReply = binMessage?.contextInfo?.externalAdReply
      if (externalAdReply) {
        message.referral = {
          source_url: externalAdReply.sourceUrl,
          source_id: externalAdReply.sourceId,
          source_type: externalAdReply.sourceType,
          headline: externalAdReply.title,
          body: externalAdReply.body,
          media_type: externalAdReply.mediaType,
          image_url: externalAdReply.thumbnail,
          video_url: externalAdReply.mediaUrl,
          thumbnail_url: externalAdReply.thumbnailUrl,
          ctwa_clid: externalAdReply.ctwaClid,
        }
        if (message.type == 'text') {
          message.text.body = `${message.text.body}
            ${externalAdReply.title}

            ${externalAdReply.body}
          
            ${externalAdReply.mediaUrl || externalAdReply.thumbnailUrl}
          `
        }
      }
      change.value.messages.push(message)
    }

    logger.debug('fromBaileysMessageContent %s => %s', phone, JSON.stringify(data))
    return [data, senderPhone, senderId]
  } catch (e) {
    logger.error(e, 'Error on convert baileys to cloud-api')
    throw e
  }
}