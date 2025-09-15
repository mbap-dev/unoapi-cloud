import { Contact } from '@whiskeysockets/baileys'
import { jidToPhoneNumberIfUser } from './transformer' // Removido 'toBuffer' pois não é necessário aqui
import { UNOAPI_QUEUE_MEDIA, DATA_TTL, FETCH_TIMEOUT_MS, DATA_URL_TTL, UNOAPI_EXCHANGE_BROKER_NAME } from '../defaults'
import { mediaStores, MediaStore, getMediaStore } from './media_store'
import { getDataStore } from './data_store'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { amqpPublish } from '../amqp'
import type { Readable } from 'stream'
import { STORAGE_OPTIONS } from '../defaults'
import { mediaStoreFile } from './media_store_file'
import { Config } from './config'
import logger from './logger'
import fetch, { Response as FetchResponse } from 'node-fetch'


export const getMediaStoreS3: getMediaStore = (phone: string, config: Config, getDataStore: getDataStore): MediaStore => {
  if (!mediaStores.has(phone)) {
    logger.debug('Creating s3 data store %s', phone)
    const store = mediaStoreS3(phone, config, getDataStore)
    mediaStores.set(phone, store)
  } else {
    logger.debug('Retrieving s3 data store %s', phone)
  }
  return mediaStores.get(phone) as MediaStore
}

export const mediaStoreS3 = (phone: string, config: Config, getDataStore: getDataStore): MediaStore => {
  const PROFILE_PICTURE_FOLDER = 'profile-pictures'
  const profilePictureFileName = (phone) => `${phone}.jpg`
  const s3Config = STORAGE_OPTIONS((config as any).storage)
  const bucket = s3Config.bucket
  const s3Client = new S3Client(s3Config)

  const mediaStore = mediaStoreFile(phone, config, getDataStore)
  mediaStore.type = 's3'

  mediaStore.saveMediaBuffer = async (fileName: string, content: Buffer) => {
    logger.debug(`Uploading file ${fileName} to bucket ${bucket}....`)
    const putParams = {
      Bucket: bucket,
      Key: fileName,
      Body: content,
    }
    const abortSignal = AbortSignal.timeout(s3Config.timeoutMs)
    await s3Client.send(new PutObjectCommand(putParams), { abortSignal })
    logger.debug(`Uploaded file ${fileName} to bucket ${bucket}!`)
    await amqpPublish(
      UNOAPI_EXCHANGE_BROKER_NAME,
      UNOAPI_QUEUE_MEDIA,
      phone,
      { fileName: fileName },
      { delay: DATA_TTL * 1000, type: 'topic' }
    )
    return true
  }

  mediaStore.getFileUrl = async (fileName: string, expiresIn = DATA_URL_TTL) => {
    const getParams = {
      Bucket: bucket,
      Key: fileName,
    }
    const command = new GetObjectCommand(getParams)
    try {
      const link = await getSignedUrl(s3Client, command, { expiresIn })
      return link
    } catch (error) {
      logger.error(
        `Error on generate s3 signed url for bucket: ${bucket} file name: ${fileName} expires in: ${expiresIn} -> ${error.message}`
      )
      throw error
    }
  }

  mediaStore.removeMedia = async (fileName: string) => {
    const putParams = {
      Bucket: bucket,
      Key: fileName,
    }
    await s3Client.send(new DeleteObjectCommand(putParams))
  }

  mediaStore.downloadMediaStream = async (file: string) => {
    const params = {
      Bucket: bucket,
      Key: file,
    }
    logger.debug(`Downloading media ${file}...`)
    const response = await s3Client.send(new GetObjectCommand(params))
    logger.debug(`Downloaded media ${file}!`)
    return response.Body as Readable
  }

  mediaStore.getProfilePictureUrl = async (_baseUrl: string, jid: string) => {
    const phoneNumber = jidToPhoneNumberIfUser(jid)
    const fileName = `${phone}/${PROFILE_PICTURE_FOLDER}/${profilePictureFileName(phoneNumber)}`
    try {
      return mediaStore.getFileUrl(fileName, DATA_URL_TTL)
    } catch (error) {
      if (error.name === 'NotFound' || error.code === 'NotFound') {
        return ''
      } else {
        throw error
      }
    }
  }

  mediaStore.saveProfilePicture = async (contact: Partial<Contact>) => {
    const phoneNumber = jidToPhoneNumberIfUser(contact.id)
    logger.debug('Received profile picture s3 %s with %s...', phoneNumber, contact.imgUrl)
    const fileName = `${phone}/${PROFILE_PICTURE_FOLDER}/${profilePictureFileName(phoneNumber)}`
    if (['changed', 'removed'].includes(contact.imgUrl || '')) {
      logger.debug('Removing profile picture s3 %s...', phoneNumber)
      await mediaStore.removeMedia(fileName)
    } else if (contact.imgUrl) {
      logger.debug('Saving profile picture s3 %s...', phoneNumber)
      const response: FetchResponse = await fetch(contact.imgUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), method: 'GET'})
      const buffer = Buffer.from(await response.arrayBuffer())
      await mediaStore.saveMediaBuffer(fileName, buffer)
      logger.debug('Saved profile picture s3 %s!', phoneNumber)
    }
  }

  return mediaStore
}