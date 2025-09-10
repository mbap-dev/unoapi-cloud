import request from 'supertest'
import { mock } from 'jest-mock-extended'

import { App } from '../../src/app'
import { Incoming } from '../../src/services/incoming'
import { Outgoing } from '../../src/services/outgoing'
import { defaultConfig, getConfig } from '../../src/services/config'
import { SessionStore } from '../../src/services/session_store'
import { OnNewLogin } from '../../src/services/socket'
import { addToBlacklist } from '../../src/services/blacklist'
import { Reload } from '../../src/services/reload'
import { Logout } from '../../src/services/logout'
import { DataStore } from '../../src/services/data_store'
import { Store } from '../../src/services/store'
const addToBlacklist = mock<addToBlacklist>()

const sessionStore = mock<SessionStore>()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getConfigTest: getConfig = async (_phone: string) => {
  return defaultConfig
}

describe('webhook routes', () => {
  test('whatsapp', async () => {
    const incoming = mock<Incoming>()
    const outgoing = mock<Outgoing>()
    const onNewLogin = mock<OnNewLogin>()
    const reload = mock<Reload>()
    const logout = mock<Logout>()
    const app: App = new App(incoming, outgoing, '', getConfigTest, sessionStore, onNewLogin, addToBlacklist, reload, logout)
    const res = await request(app.server).post('/webhooks/whatsapp/123')
    expect(res.status).toEqual(200)
  })

  test('whatsapp saves media for whatsmeow', async () => {
    const incoming = mock<Incoming>()
    const outgoing = mock<Outgoing>()
    const onNewLogin = mock<OnNewLogin>()
    const reload = mock<Reload>()
    const logout = mock<Logout>()
    const dataStore = mock<DataStore>()
    const store = mock<Store>()
    store.dataStore = dataStore
    const getConfigWhatsmeow: getConfig = async (_phone: string) => {
      return {
        ...defaultConfig,
        provider: 'whatsmeow',
        getStore: async () => store,
      }
    }
    const app: App = new App(incoming, outgoing, '', getConfigWhatsmeow, sessionStore, onNewLogin, addToBlacklist, reload, logout)
    const body = {
      messages: [
        {
          from: '5562933000233',
          id: '3AF7675E18E861BEF49C',
          image: {
            caption: '',
            id: '553121159080/3AF7675E18E861BEF49C',
            mime_type: 'image/jpeg',
            sha256: 'hash',
          },
          timestamp: '1757459817',
          type: 'image',
        },
      ],
    }
    await request(app.server).post('/webhooks/whatsapp/123').send(body).expect(200)
    expect(dataStore.setMediaPayload).toHaveBeenCalledWith('3AF7675E18E861BEF49C', {
      messaging_product: 'whatsapp',
      caption: '',
      id: '553121159080/3AF7675E18E861BEF49C',
      mime_type: 'image/jpeg',
      sha256: 'hash',
    })
  })
})
