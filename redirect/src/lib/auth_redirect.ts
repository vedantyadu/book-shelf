import { APP_GOOGLE_AUTH_URI } from '../constants/env'

export function googleAuthRedirect() {
  const params = new URLSearchParams(window.location.search)
  if (APP_GOOGLE_AUTH_URI) {
    window.location.replace(APP_GOOGLE_AUTH_URI + '?' + params.toString())
  }
}
