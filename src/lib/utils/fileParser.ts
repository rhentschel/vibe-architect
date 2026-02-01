import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure PDF.js worker - use unpkg CDN with matching version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export interface ParsedFile {
  name: string
  type: string
  content: string
  size: number
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const type = file.type
  const name = file.name
  const size = file.size

  let content = ''

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    content = await parsePDF(file)
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    content = await parseDocx(file)
  } else if (type === 'application/msword' || name.endsWith('.doc')) {
    throw new Error('Alte .doc Dateien werden nicht unterstützt. Bitte als .docx speichern.')
  } else if (
    type === 'text/plain' ||
    type === 'text/markdown' ||
    name.endsWith('.txt') ||
    name.endsWith('.md')
  ) {
    content = await parseText(file)
  } else {
    throw new Error(`Dateityp nicht unterstützt: ${type || name.split('.').pop()}`)
  }

  return { name, type, content, size }
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    textParts.push(pageText)
  }

  return textParts.join('\n\n')
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function parseText(file: File): Promise<string> {
  return await file.text()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const SUPPORTED_FILE_TYPES = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
]

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
