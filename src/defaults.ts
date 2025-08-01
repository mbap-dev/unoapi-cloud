import { WAVersion, DEFAULT_CONNECTION_CONFIG } from 'baileys'
import { release } from 'os'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _undefined: any = undefined

// security
export const UNOAPI_AUTH_TOKEN = process.env.UNOAPI_AUTH_TOKEN
export const UNOAPI_HEADER_NAME = process.env.UNOAPI_HEADER_NAME || 'Authorization'

export const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV == 'development' ? 'debug' : 'error')
export const UNO_LOG_LEVEL = process.env.UNO_LOG_LEVEL || LOG_LEVEL

export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en'

export const VALIDATE_MEDIA_LINK_BEFORE_SEND = 
  process.env.VALIDATE_MEDIA_LINK_BEFORE_SEND == _undefined ? false : process.env.VALIDATE_MEDIA_LINK_BEFORE_SEND == 'true'

export const WEBHOOK_FORWARD_PHONE_NUMBER_ID = process.env.WEBHOOK_FORWARD_PHONE_NUMBER_ID || ''
export const WEBHOOK_FORWARD_BUSINESS_ACCOUNT_ID = process.env.WEBHOOK_FORWARD_BUSINESS_ACCOUNT_ID || ''
export const WEBHOOK_FORWARD_TOKEN = process.env.WEBHOOK_FORWARD_TOKEN || ''
export const WEBHOOK_FORWARD_VERSION = process.env.WEBHOOK_FORWARD_VERSION || 'v17.0'
export const WEBHOOK_FORWARD_URL = process.env.WEBHOOK_FORWARD_URL || 'https://graph.facebook.com'
export const WEBHOOK_FORWARD_TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '360000')

// comunication
export const UNOAPI_URL = process.env.UNOAPI_URL || 'http://localhost:9876'
export const WEBHOOK_URL_ABSOLUTE = process.env.WEBHOOK_URL_ABSOLUTE || ''
export const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:9876/webhooks/fake'
export const WEBHOOK_HEADER = process.env.WEBHOOK_HEADER || 'Authorization'
export const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || UNOAPI_AUTH_TOKEN || '123abc'
export const WEBHOOK_TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT_MS || '360000')
export const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS || '360000')
export const CONNECTION_TYPE = process.env.CONNECTION_TYPE || 'qrcode'

export const CONSUMER_TIMEOUT_MS = parseInt(process.env.CONSUMER_TIMEOUT_MS || '360000')
export const WEBHOOK_SEND_NEW_MESSAGES = process.env.WEBHOOK_SEND_NEW_MESSAGES == _undefined ? false : process.env.WEBHOOK_SEND_NEW_MESSAGES == 'true'
export const WEBHOOK_SEND_GROUP_MESSAGES = process.env.WEBHOOK_SEND_GROUP_MESSAGES == _undefined ? true : process.env.WEBHOOK_SEND_GROUP_MESSAGES == 'true'
export const WEBHOOK_SEND_OUTGOING_MESSAGES =
  process.env.WEBHOOK_SEND_OUTGOING_MESSAGES == _undefined ? true : process.env.WEBHOOK_SEND_OUTGOING_MESSAGES == 'true'
export const WEBHOOK_SEND_UPDATE_MESSAGES =
  process.env.WEBHOOK_SEND_UPDATE_MESSAGES == _undefined ? true : process.env.WEBHOOK_SEND_UPDATE_MESSAGES == 'true'
export const WEBHOOK_SEND_NEWSLETTER_MESSAGES =
  process.env.WEBHOOK_SEND_NEWSLETTER_MESSAGES == _undefined ? false : process.env.WEBHOOK_SEND_NEWSLETTER_MESSAGES == 'true'
export const WEBHOOK_SESSION = process.env.WEBHOOK_SESSION || ''
export const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
export const PROXY_URL = process.env.PROXY_URL

// behavior of unoapi
export const UNOAPI_SERVER_NAME = process.env.UNOAPI_SERVER_NAME || 'server_1'
export const CONNECTING_TIMEOUT_MS = parseInt(process.env.CONNECTING_TIMEOUT_MS || '180000')
export const UNOAPI_RETRY_REQUEST_DELAY_MS = parseInt(process.env.UNOAPI_RETRY_REQUEST_DELAY || process.env.UNOAPI_RETRY_REQUEST_DELAY_MS || '5000')
// export const QR_TIMEOUT = parseInt(process.env.QR_TIMEOUT || '30000')
// export const SLEEP_TIME = parseInt(process.env.SLEEP_TIME || '5000')
// export const MAX_QRCODE_GENERATE = process.env.MAX_QRCODE_GENERATE || 6
export const DATA_TTL: number = parseInt(process.env.DATA_TTL || `${60 * 60 * 24 * 30}`) // a month
export const DATA_URL_TTL: number = parseInt(process.env.DATA_URL_TTL || `${60 * 60 * 24 * 3}`) // tree days
export const DATA_JID_TTL: number = parseInt(process.env.DATA_JID_TTL || `${60 * 60 * 24 * 7}`) // a week
export const SESSION_TTL: number = parseInt(process.env.SESSION_TTL || '-1')
export const UNOAPI_X_COUNT_RETRIES: string = process.env.UNOAPI_X_COUNT_RETRIES || 'x-unoapi-count-retries'
export const UNOAPI_X_MAX_RETRIES: string = process.env.UNOAPI_X_MAX_RETRIES || 'x-unoapi-max-retries'
export const UNOAPI_EXCHANGE_NAME = process.env.UNOAPI_EXCHANGE_NAME || 'unoapi'
export const UNOAPI_EXCHANGE_BROKER_NAME =`${UNOAPI_EXCHANGE_NAME}.broker`
export const UNOAPI_EXCHANGE_BRIDGE_NAME = `${UNOAPI_EXCHANGE_NAME}.brigde`
export const UNOAPI_QUEUE_NAME = process.env.UNOAPI_QUEUE_NAME || 'unoapi'
export const UNOAPI_QUEUE_OUTGOING_PREFETCH = parseInt(process.env.UNOAPI_QUEUE_OUTGOING_PREFETCH || '1')
export const UNOAPI_QUEUE_DELAYED = `${UNOAPI_QUEUE_NAME}.delayed`
export const UNOAPI_QUEUE_WEBHOOK_STATUS_FAILED = `${UNOAPI_QUEUE_NAME}.webhook.status.failed`
export const UNOAPI_QUEUE_MEDIA = `${UNOAPI_QUEUE_NAME}.media`
export const UNOAPI_QUEUE_NOTIFICATION = `${UNOAPI_QUEUE_NAME}.notification`
export const UNOAPI_QUEUE_LISTENER = `${UNOAPI_QUEUE_NAME}.listener`
export const UNOAPI_QUEUE_BLACKLIST_ADD = `${UNOAPI_QUEUE_NAME}.blacklist.add`
export const UNOAPI_QUEUE_BLACKLIST_RELOAD = `${UNOAPI_QUEUE_NAME}.blacklist.reload`
export const UNOAPI_QUEUE_BIND = `${UNOAPI_QUEUE_NAME}.bind`
export const UNOAPI_QUEUE_OUTGOING = `${UNOAPI_QUEUE_NAME}.outgoing`
export const UNOAPI_QUEUE_CONTACT = `${UNOAPI_QUEUE_NAME}.contact`
export const UNOAPI_QUEUE_BULK_PARSER = `${UNOAPI_QUEUE_NAME}.bulk.parser`
export const UNOAPI_QUEUE_RELOAD = `${UNOAPI_QUEUE_NAME}.reload`
export const UNOAPI_QUEUE_BROADCAST = `${UNOAPI_QUEUE_NAME}.broadcast`
export const UNOAPI_QUEUE_LOGOUT = `${UNOAPI_QUEUE_NAME}.logout`
export const UNOAPI_QUEUE_BULK_SENDER = `${UNOAPI_QUEUE_NAME}.bulk.sender`
export const UNOAPI_QUEUE_BULK_STATUS = `${UNOAPI_QUEUE_NAME}.bulk.status`
export const UNOAPI_QUEUE_BULK_REPORT = `${UNOAPI_QUEUE_NAME}.bulk.report`
export const UNOAPI_QUEUE_BULK_WEBHOOK = `${UNOAPI_QUEUE_NAME}.bulk.webhook`
export const UNOAPI_QUEUE_COMMANDER = `${UNOAPI_QUEUE_NAME}.commander`
export const UNOAPI_QUEUE_INCOMING = `${UNOAPI_QUEUE_NAME}.incoming`
export const UNOAPI_MESSAGE_RETRY_LIMIT = parseInt(process.env.UNOAPI_MESSAGE_RETRY_LIMIT || '5')
export const UNOAPI_MESSAGE_RETRY_DELAY = parseInt(process.env.UNOAPI_MESSAGE_RETRY_DELAY || '10000')
export const UNOAPI_DELAY_BETWEEN_MESSAGES_MS = parseInt(process.env.UNOAPI_DELAY_BETWEEN_MESSAGES_MS || '0')
export const UNOAPI_DELAY_AFTER_FIRST_MESSAGE_MS = parseInt(process.env.UNOAPI_DELAY_AFTER_FIRST_MESSAGE_MS || '0')
export const UNOAPI_DELAY_AFTER_FIRST_MESSAGE_WEBHOOK_MS = parseInt(process.env.UNOAPI_DELAY_AFTER_FIRST_MESSAGE_WEBHOOK_MS || '0')
export const CUSTOM_MESSAGE_CHARACTERS = JSON.parse(process.env.CUSTOM_MESSAGE_CHARACTERS || '[]')
export const UNOAPI_BULK_BATCH = parseInt(process.env.UNOAPI_BULK_BATCH || '5')
export const UNOAPI_BULK_DELAY = parseInt(process.env.UNOAPI_BULK_DELAY || '60')
export const MAX_CONNECT_RETRY = parseInt(process.env.MAX_CONNECT_RETRY || '3')
export const MAX_CONNECT_TIME = parseInt(process.env.MAX_CONNECT_TIME || '300')
export const UNOAPI_BULK_MESSAGE_DELAY = parseInt(process.env.UNOAPI_BULK_DELAY || '12')
export const PORT: number = parseInt(process.env.PORT || '9876')
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`
export const IGNORE_CALLS = process.env.IGNORE_CALLS || ''
export const REJECT_CALLS = process.env.REJECT_CALLS || ''
export const REJECT_CALLS_WEBHOOK = process.env.REJECT_CALLS_WEBHOOK || ''
export const MESSAGE_CALLS_WEBHOOK = process.env.MESSAGE_CALLS_WEBHOOK || ''
export const AUTO_RESTART_MS = parseInt(process.env.AUTO_RESTART_MS || '0')
export const BASE_STORE = process.env.UNOAPI_BASE_STORE || process.env.BASE_STORE || './data'
export const AUTO_CONNECT: boolean = process.env.AUTO_CONNECT === _undefined ? true : process.env.AUTO_CONNECT == 'true'
export const COMPOSING_MESSAGE: boolean = process.env.COMPOSING_MESSAGE === _undefined ? false : process.env.COMPOSING_MESSAGE == 'true'
export const IGNORE_GROUP_MESSAGES: boolean = process.env.IGNORE_GROUP_MESSAGES == _undefined ? true : process.env.IGNORE_GROUP_MESSAGES == 'true'
export const IGNORE_NEWSLETTER_MESSAGES: boolean = process.env.IGNORE_NEWSLETTER_MESSAGES == _undefined ? true : process.env.IGNORE_NEWSLETTER_MESSAGES == 'true'
export const IGNORE_BROADCAST_STATUSES: boolean =
  process.env.IGNORE_BROADCAST_STATUSES === _undefined ? true : process.env.IGNORE_BROADCAST_STATUSES == 'true'
export const READ_ON_RECEIPT: boolean = process.env.READ_ON_RECEIPT === _undefined ? false : process.env.READ_ON_RECEIPT == 'true'
export const IGNORE_BROADCAST_MESSAGES: boolean =
  process.env.IGNORE_BROADCAST_MESSAGES === _undefined ? false : process.env.IGNORE_OWN_MESSAGES == 'true'
export const IGNORE_HISTORY_MESSAGES: boolean =
  process.env.IGNORE_HISTORY_MESSAGES === _undefined ? true : process.env.IGNORE_HISTORY_MESSAGES == 'true'
export const IGNORE_DATA_STORE: boolean = process.env.IGNORE_DATA_STORE === _undefined ? false : process.env.IGNORE_DATA_STORE == 'true'
export const IGNORE_YOURSELF_MESSAGES: boolean =
  process.env.IGNORE_YOURSELF_MESSAGES === _undefined ? false : process.env.IGNORE_YOURSELF_MESSAGES == 'true'
export const IGNORE_OWN_MESSAGES: boolean = process.env.IGNORE_OWN_MESSAGES === _undefined ? true : process.env.IGNORE_OWN_MESSAGES == 'true'
export const SEND_CONNECTION_STATUS: boolean = process.env.SEND_CONNECTION_STATUS === _undefined ? true : process.env.SEND_CONNECTION_STATUS == 'true'
export const NOTIFY_FAILED_MESSAGES: boolean = process.env.NOTIFY_FAILED_MESSAGES === _undefined ? true : process.env.NOTIFY_FAILED_MESSAGES == 'true'
export const THROW_WEBHOOK_ERROR: boolean = process.env.THROW_WEBHOOK_ERROR === _undefined ? false : process.env.THROW_WEBHOOK_ERROR == 'true'
export const SEND_REACTION_AS_REPLY: boolean =
  process.env.SEND_REACTION_AS_REPLY === _undefined ? false : process.env.SEND_REACTION_AS_REPLY == 'true'
export const STORAGE_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'unoapi'
export const STORAGE_ACCESS_KEY_ID = process.env.STORAGE_ACCESS_KEY_ID || 'my-minio'
export const STORAGE_SECRET_ACCESS_KEY = process.env.STORAGE_SECRET_ACCESS_KEY || '2NVQWHTTT3asdasMgqapGchy6yAMZn'
export const STORAGE_REGION = process.env.STORAGE_REGION || 'us-east-1'
export const STORAGE_TIMEOUT_MS = parseInt(process.env.STORAGE_TIMEOUT_MS || '360000')
export const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || 'http://localhost:9000'
export const STORAGE_FORCE_PATH_STYLE: boolean =
  process.env.STORAGE_FORCE_PATH_STYLE === _undefined ? false : process.env.STORAGE_FORCE_PATH_STYLE == 'true'
export const SEND_PROFILE_PICTURE: boolean = process.env.SEND_PROFILE_PICTURE === _undefined ? true : process.env.SEND_PROFILE_PICTURE != 'false'
export const IGNORED_CONNECTIONS_NUMBERS = JSON.parse(process.env.IGNORED_CONNECTIONS_NUMBERS || '[]')
export const IGNORED_TO_NUMBERS = JSON.parse(process.env.IGNORED_TO_NUMBERS || '[]')
export const CLEAN_CONFIG_ON_DISCONNECT =
  process.env.CLEAN_CONFIG_ON_DISCONNECT === _undefined ? false : process.env.CLEAN_CONFIG_ON_DISCONNECT == 'true'
export const VALIDATE_ROUTING_KEY = process.env.VALIDATE_ROUTING_KEY === _undefined ? false : process.env.VALIDATE_ROUTING_KEY == 'true'
export const CONFIG_SESSION_PHONE_CLIENT = process.env.CONFIG_SESSION_PHONE_CLIENT || 'Unoapi'
export const CONFIG_SESSION_PHONE_NAME = process.env.CONFIG_SESSION_PHONE_NAME || 'Chrome'
export const MESSAGE_CHECK_WAAPP = process.env.MESSAGE_CHECK_WAAPP || ''
export const WHATSAPP_VERSION = JSON.parse(process.env.WHATSAPP_VERSION || `[${DEFAULT_CONNECTION_CONFIG.version}]`) as WAVersion
export const AVAILABLE_LOCALES = JSON.parse(process.env.AVAILABLE_LOCALES || '["en", "pt_BR", "pt"]')
export const WAVOIP_TOKEN = process.env.WAVOIP_TOKEN || ''
export const ONLY_HELLO_TEMPLATE: boolean = process.env.ONLY_HELLO_TEMPLATE === _undefined ? false : process.env.ONLY_HELLO_TEMPLATE == 'true'
export const DEFAULT_BROWSER = [CONFIG_SESSION_PHONE_CLIENT, CONFIG_SESSION_PHONE_NAME, release()]
export const QR_TIMEOUT_MS = parseInt(process.env.QR_TIMEOUT_MS || '60000')
export const STATUS_FAILED_WEBHOOK_URL = process.env.STATUS_FAILED_WEBHOOK_URL || ''

export const VALIDATE_SESSION_NUMBER: boolean =
  process.env.VALIDATE_SESSION_NUMBER === _undefined ? false : process.env.VALIDATE_SESSION_NUMBER == 'true'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const STORAGE_OPTIONS = (storage: any) => {
  storage = storage || { credentials: {} }
  const forcePathStyle = JSON.parse('forcePathStyle' in storage ? storage.forcePathStyle : STORAGE_FORCE_PATH_STYLE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    region: storage.region || STORAGE_REGION,
    endpoint: storage.endpoint || STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: storage.credentials?.accessKeyId || STORAGE_ACCESS_KEY_ID,
      secretAccessKey: storage.credentials?.secretAccessKey || STORAGE_SECRET_ACCESS_KEY,
    },
    bucket: storage?.bucket || STORAGE_BUCKET_NAME,
    signatureVersion: 's3v4',
    timeoutMs: STORAGE_TIMEOUT_MS,
  }
  if (forcePathStyle) {
    options.forcePathStyle = forcePathStyle
  }
  return options
}
