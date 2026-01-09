const instancePrefix = (phone: string) => `${phone.replace('+', '')}_`

export const withInstanceMessageId = (phone: string, id: string) => {
  if (!id) {
    return id
  }
  const rawId = `${id}`
  const prefix = instancePrefix(phone)
  return rawId.startsWith(prefix) ? rawId : `${prefix}${rawId}`
}

export const stripInstanceMessageId = (phone: string, id: string) => {
  if (!id) {
    return id
  }
  const rawId = `${id}`
  const prefix = instancePrefix(phone)
  return rawId.startsWith(prefix) ? rawId.slice(prefix.length) : rawId
}

export const applyInstanceMessageIds = (phone: string, payload: any) => {
  const entries = payload?.entry
  if (!Array.isArray(entries)) {
    return
  }
  entries.forEach((entry) => {
    const changes = entry?.changes
    if (!Array.isArray(changes)) {
      return
    }
    changes.forEach((change) => {
      const value = change?.value
      if (!value) {
        return
      }
      if (Array.isArray(value.messages)) {
        value.messages = value.messages.map((message) => {
          if (message?.id) {
            message.id = withInstanceMessageId(phone, message.id)
          }
          if (message?.context?.id) {
            message.context.id = withInstanceMessageId(phone, message.context.id)
          }
          if (message?.context?.message_id) {
            message.context.message_id = withInstanceMessageId(phone, message.context.message_id)
          }
          if (message?.reaction?.message_id) {
            message.reaction.message_id = withInstanceMessageId(phone, message.reaction.message_id)
          }
          return message
        })
      }
      if (Array.isArray(value.statuses)) {
        value.statuses = value.statuses.map((status) => {
          if (status?.id) {
            status.id = withInstanceMessageId(phone, status.id)
          }
          if (status?.message_id) {
            status.message_id = withInstanceMessageId(phone, status.message_id)
          }
          return status
        })
      }
    })
  })
}
