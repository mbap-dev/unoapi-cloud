import logger from '../services/logger'
import { Logout } from '../services/logout'

export class LogoutJob {
  private logout: Logout

  constructor(logout: Logout) {
    this.logout = logout
  }

  async consume(_: string, { phone }: { phone: string }) {
    logger.debug('Logout service for phone %s', phone)
    this.logout.run(phone)
  }
}
