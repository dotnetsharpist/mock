// Buying tanga through the backend's payment gateway (Click). The other way to
// pay — a card, through @milliymock_bot — is a deep link and needs no API; see
// utils/telegramBot.js#telegramBotPayUrl.
//
//   GET  /payment/tariffs          no auth → [{ code, name, coins, price }]   price in so'm
//   GET  /payment/offer            no auth → { version, offerUrl, privacyUrl }
//                                  the public offer + privacy policy a student
//                                  must accept before any checkout
//   POST /payment/checkout         auth, JSON { tariffCode, provider: "Click",
//                                               acceptOffer: true, offerVersion }
//                                  → { paymentId, paymentUrl }
//                                  400 "Accept the public offer…" (acceptance missing),
//                                      "Payments are temporarily unavailable" (the
//                                      server is misconfigured), or provider not
//                                      available; 404 unknown tariff code;
//                                  409 the offer changed since offerVersion was read
//   GET  /payment/{paymentId}      auth → { id, provider, tariffCode, tariffName,
//                                  amount, coins, status, createdAt, paidAt }
//                                  404 not this user's payment, or no such payment
//
// The checkout hands back a Click page; Click sends the student back to
// /payment/result?paymentId=… (views/app/PaymentResultPage.vue), which polls the
// payment until it settles. A 401 anywhere is handled by apiFetch (→ /login).
import { apiFetch, getTestApiBaseUrl, readJsonBody } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// TEMP (2026-10-14): Click is hidden from the purchase dialog for now. This is
// the ONE switch — set it to true and the Click button, the two-option dialog
// copy and the "Click credits automatically" billing note all come back.
// While false the dialog is the Telegram-only one it was before Click. Nothing
// else is off: the checkout code, /payment/result and the tariffs fetch stay.
export const CLICK_PAYMENT_ENABLED = false

export const PAYMENT_PROVIDER_CLICK = 'Click'

export const PAYMENT_STATUS = {
  awaitingPayment: 'AwaitingPayment',
  processing: 'Processing',
  approved: 'Approved',
  cancelled: 'Cancelled',
}

// "35 000 so'm" — the shape the i18n plans have always printed prices in.
export function formatSom(amount) {
  const value = Math.round(Number(amount) || 0)
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`
}

function authHeaders() {
  const { token } = useAuthStore()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Unwraps the { code, message, data } envelope. `status` on the thrown error is
// the envelope's code when there is one, the HTTP status otherwise — a missing
// route answers 404 with no body, and callers branch on 400/401/404.
async function readData(response, fallbackMessage) {
  const payload = await readJsonBody(response)

  if (!response.ok || payload?.code !== 200 || payload?.data == null) {
    const error = new Error(payload?.message || fallbackMessage)
    error.status = payload?.code ?? response.status
    throw error
  }

  return payload.data
}

// Only a web page is accepted: these go into window.location and into links.
function toWebUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export async function fetchTariffs() {
  const response = await apiFetch(`${getTestApiBaseUrl()}/payment/tariffs`, {
    headers: { accept: '*/*' },
  })
  const data = await readData(response, 'Could not load tariffs.')

  return (Array.isArray(data) ? data : [])
    .map((tariff) => ({
      code: String(tariff?.code || ''),
      name: String(tariff?.name || ''),
      coins: Number(tariff?.coins) || 0,
      price: Number(tariff?.price) || 0,
    }))
    .filter((tariff) => tariff.code && tariff.coins > 0 && tariff.price > 0)
}

// The terms behind the "I accept" checkbox. `version` goes back with the
// checkout, so the server knows which text the student actually accepted.
export async function fetchOffer() {
  const response = await apiFetch(`${getTestApiBaseUrl()}/payment/offer`, {
    headers: { accept: '*/*' },
  })
  const data = await readData(response, 'Could not load the public offer.')

  const offer = {
    version: String(data.version || ''),
    offerUrl: toWebUrl(data.offerUrl),
    privacyUrl: toWebUrl(data.privacyUrl),
  }
  if (!offer.version || !offer.offerUrl || !offer.privacyUrl) {
    throw new Error('The public offer came back incomplete.')
  }

  return offer
}

// Always a fresh checkout: a Click URL belongs to one payment, so it is never
// cached or reused — every press of the button comes through here. Only called
// once the student has ticked the offer, so acceptance is always true;
// `offerVersion` is the version of the offer they were shown.
export async function createCheckout(tariffCode, { offerVersion, provider = PAYMENT_PROVIDER_CLICK }) {
  const response = await apiFetch(`${getTestApiBaseUrl()}/payment/checkout`, {
    method: 'POST',
    headers: { accept: '*/*', 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ tariffCode, provider, acceptOffer: true, offerVersion }),
  })
  const data = await readData(response, 'Could not start the payment.')

  const paymentUrl = toWebUrl(data.paymentUrl)
  if (!paymentUrl) throw new Error('Checkout returned no payment URL.')

  return { paymentId: data.paymentId, paymentUrl }
}

export async function fetchPayment(paymentId) {
  const response = await apiFetch(
    `${getTestApiBaseUrl()}/payment/${encodeURIComponent(paymentId)}`,
    { headers: { accept: '*/*', ...authHeaders() } },
  )
  const data = await readData(response, 'Could not load the payment.')

  return {
    id: data.id,
    provider: String(data.provider || ''),
    tariffCode: String(data.tariffCode || ''),
    tariffName: String(data.tariffName || ''),
    amount: Number(data.amount) || 0,
    coins: Number(data.coins) || 0,
    status: String(data.status || ''),
    createdAt: data.createdAt || null,
    paidAt: data.paidAt || null,
  }
}
