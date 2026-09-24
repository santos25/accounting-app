/**
 * Importa el Excel "RENTAS PERSONAS NATURALES" a Supabase.
 *
 *   npm run import:excel -- <archivo.xlsx> [--year 2025] [--fee-multiplier 1000] [--sheet "Hoja1"] [--apply]
 *
 * Sin --apply solo muestra lo que haría (dry run). Requiere en .env.local:
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CREDENTIALS_KEY e IMPORT_OWNER_EMAIL.
 */
import { config } from "dotenv"
import ExcelJS from "exceljs"
import { createClient } from "@supabase/supabase-js"
import { encryptOptional } from "../lib/crypto"
import type { Database } from "../lib/supabase/database.types"
import type { DeclarationStatus } from "../lib/domain"

config({ path: ".env.local" })

// Color de relleno de la fila (ARGB sin alfa) -> estado. Ajustar según el significado real.
// Ejecuta primero en dry run: el script lista los colores encontrados.
const COLOR_STATUS: Record<string, DeclarationStatus> = {
  FF0000: "PENDIENTE", // rojo
  FFFF00: "EN_PROCESO", // amarillo
  F4B084: "DOCUMENTOS_RECIBIDOS", // naranja claro
  F8CBAD: "DOCUMENTOS_RECIBIDOS", // naranja claro
  FFC000: "DOCUMENTOS_RECIBIDOS", // naranja
}
const DEFAULT_STATUS: DeclarationStatus = "PENDIENTE"

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

type Args = { file: string; year: number; feeMultiplier: number; sheet?: string; apply: boolean }

function parseArgs(argv: string[]): Args {
  const get = (flag: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const file = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"))
  if (!file) {
    console.error("Uso: npm run import:excel -- <archivo.xlsx> [--year 2025] [--apply]")
    process.exit(1)
  }
  return {
    file,
    year: Number(get("--year") ?? new Date().getFullYear() - 1),
    feeMultiplier: Number(get("--fee-multiplier") ?? 1000),
    sheet: get("--sheet"),
    apply: argv.includes("--apply"),
  }
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v == null) return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim()
    if ("result" in v) return String(v.result ?? "").trim()
    if ("text" in v) return String(v.text).trim()
  }
  return String(v).trim()
}

function fillColor(cell: ExcelJS.Cell): string | null {
  const fill = cell.fill
  if (fill?.type !== "pattern" || fill.pattern === "none") return null
  const argb = fill.fgColor?.argb
  return argb ? argb.slice(-6).toUpperCase() : null
}

/** "19 DE AGOSTO" | "2026-08-19" | Date -> "YYYY-MM-DD" */
function parseDueDate(raw: string, dueYear: number): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const m = raw.toLowerCase().match(/(\d{1,2})\s*(?:de\s+)?([a-záéíóú]+)(?:\s+(?:de\s+)?(\d{4}))?/)
  if (!m) return null
  const month = MONTHS[m[2]]
  if (!month) return null
  const year = m[3] ? Number(m[3]) : dueYear
  return `${year}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`
}

type ParsedRow = {
  row: number
  full_name: string
  document_number: string
  portal_password: string
  e_signature: string
  due_date: string | null
  fee: number
  color: string | null
  status: DeclarationStatus
}

async function readRows(args: Args) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(args.file)
  const sheet = args.sheet ? workbook.getWorksheet(args.sheet) : workbook.worksheets[0]
  if (!sheet) throw new Error(`No se encontró la hoja ${args.sheet ?? "(primera)"}`)

  let headerRow = 0
  sheet.eachRow((row, n) => {
    if (!headerRow && cellText(row.getCell(1)).toUpperCase() === "NOMBRE") headerRow = n
  })
  if (!headerRow) throw new Error('No se encontró la fila de encabezado con "NOMBRE" en la columna A')

  const rows: ParsedRow[] = []
  const skipped: string[] = []
  sheet.eachRow((row, n) => {
    if (n <= headerRow) return
    const full_name = cellText(row.getCell(1)).replace(/\s+/g, " ")
    const document_number = cellText(row.getCell(2)).replace(/\D/g, "")
    if (!full_name && !document_number) return
    if (!full_name || document_number.length < 3) {
      skipped.push(`fila ${n}: nombre o cédula incompletos`)
      return
    }
    const color = fillColor(row.getCell(1))
    const feeRaw = Number(cellText(row.getCell(6)).replace(/[^\d.]/g, "")) || 0
    rows.push({
      row: n,
      full_name,
      document_number,
      portal_password: cellText(row.getCell(3)),
      e_signature: cellText(row.getCell(4)),
      due_date: parseDueDate(cellText(row.getCell(5)), args.year + 1),
      fee: Math.round(feeRaw < 10_000 ? feeRaw * args.feeMultiplier : feeRaw),
      color,
      status: (color && COLOR_STATUS[color]) || DEFAULT_STATUS,
    })
  })
  return { rows, skipped }
}

async function findOwnerId(supabase: ReturnType<typeof createClient<Database>>, email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (user) return user.id
    if (data.users.length < 200) break
  }
  throw new Error(`No existe un usuario de Supabase Auth con el correo ${email}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { rows, skipped } = await readRows(args)

  const colors = new Map<string, number>()
  rows.forEach((r) => colors.set(r.color ?? "(sin color)", (colors.get(r.color ?? "(sin color)") ?? 0) + 1))

  console.log(`\nArchivo: ${args.file}  ·  Año gravable: ${args.year}  ·  Multiplicador de cobro: ${args.feeMultiplier}`)
  console.table(
    rows.map((r) => ({
      fila: r.row,
      nombre: r.full_name,
      cedula: r.document_number,
      vence: r.due_date ?? "(calendario DIAN)",
      cobro: r.fee,
      color: r.color ?? "",
      estado: r.status,
      clave: r.portal_password ? "sí" : "no",
      firma: r.e_signature ? "sí" : "no",
    }))
  )
  console.log("Colores encontrados:", Object.fromEntries(colors))
  skipped.forEach((s) => console.warn("Omitida:", s))

  if (!args.apply) {
    console.log("\nDry run: no se escribió nada. Agrega --apply para importar.")
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ownerEmail = process.env.IMPORT_OWNER_EMAIL
  if (!url || !serviceKey || !ownerEmail) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o IMPORT_OWNER_EMAIL")
  }
  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const owner_id = await findOwnerId(supabase, ownerEmail)

  const { data: calendar } = await supabase
    .from("tax_calendar")
    .select("last_digits, due_date")
    .eq("tax_year", args.year)
  const calendarByDigits = new Map(calendar?.map((c) => [c.last_digits, c.due_date]))

  let ok = 0
  for (const r of rows) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert(
        {
          owner_id,
          full_name: r.full_name,
          document_type: "CC",
          document_number: r.document_number,
          portal_password_enc: encryptOptional(r.portal_password),
          e_signature_enc: encryptOptional(r.e_signature),
        },
        { onConflict: "owner_id,document_number" }
      )
      .select("id")
      .single()
    if (clientError) {
      console.error(`Fila ${r.row} (${r.full_name}): ${clientError.message}`)
      continue
    }

    const due_date = r.due_date ?? calendarByDigits.get(r.document_number.slice(-2).padStart(2, "0"))
    if (!due_date) {
      console.error(`Fila ${r.row} (${r.full_name}): sin fecha de vencimiento ni calendario DIAN`)
      continue
    }

    const { error: declError } = await supabase.from("declarations").upsert(
      {
        owner_id,
        client_id: client.id,
        tax_year: args.year,
        due_date,
        fee: r.fee,
        status: r.status,
      },
      { onConflict: "client_id,tax_year" }
    )
    if (declError) {
      console.error(`Fila ${r.row} (${r.full_name}): ${declError.message}`)
      continue
    }
    ok++
  }
  console.log(`\nImportadas ${ok} de ${rows.length} filas.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
