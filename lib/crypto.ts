import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

// Formato almacenado: "v1:<iv>:<authTag>:<ciphertext>" en base64.
// El prefijo de versión permite rotar la clave o el algoritmo más adelante.
const VERSION = "v1"
const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12

function getKey() {
  const raw = process.env.CREDENTIALS_KEY
  if (!raw) throw new Error("CREDENTIALS_KEY no está configurada")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new Error("CREDENTIALS_KEY debe ser de 32 bytes en base64")
  return key
}

export function encrypt(plain: string) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":")
}

export function decrypt(payload: string) {
  const [version, iv, tag, ciphertext] = payload.split(":")
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Formato de credencial cifrada no reconocido")
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

/** Cifra un valor opcional de formulario: vacío -> null. */
export function encryptOptional(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? encrypt(trimmed) : null
}
