const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const DATA_DIR = path.join(__dirname, '..', 'data')
const SYSTEMS_FILE = path.join(DATA_DIR, 'systems.json')
const ICONS_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons')

fs.ensureDirSync(DATA_DIR)
fs.ensureDirSync(ICONS_DIR)

// simple storage helpers
async function readSystems() {
  try {
    const raw = await fs.readFile(SYSTEMS_FILE, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (e) {
    return []
  }
}

async function writeSystems(arr) {
  await fs.writeFile(SYSTEMS_FILE, JSON.stringify(arr, null, 2), 'utf8')
}

// configure multer for uploads to icons dir
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ICONS_DIR),
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname.replace(/[^a-z0-9.\-]/gi, '_')
    cb(null, name)
  },
})
const upload = multer({ storage })

app.get('/api/systems', async (req, res) => {
  const list = await readSystems()
  res.json(list)
})

app.post('/api/systems', async (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ error: 'name required' })
  const list = await readSystems()
  const item = {
    id: uuidv4(),
    name: body.name,
    description: body.description || '',
    url: body.url || '',
    logo: body.logo || '',
    ussdCode: body.ussdCode || '',
  }
  const now = new Date().toISOString()
  item.createdAt = now
  item.updatedAt = now
  list.push(item)
  await writeSystems(list)
  res.json(item)
})

app.put('/api/systems/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body || {}
  const list = await readSystems()
  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  // preserve createdAt, set updatedAt
  const updated = { ...list[idx], ...body }
  updated.updatedAt = new Date().toISOString()
  if (!updated.createdAt) updated.createdAt = list[idx].createdAt || new Date().toISOString()
  list[idx] = updated
  await writeSystems(list)
  res.json(list[idx])
})

app.delete('/api/systems/:id', async (req, res) => {
  const id = req.params.id
  let list = await readSystems()
  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  const removed = list.splice(idx, 1)
  await writeSystems(list)
  res.json({ ok: true, removed: removed[0] })
})

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  // return relative path usable in the frontend
  const rel = path.posix.join('/src/assets/icons', path.basename(req.file.path))
  res.json({ path: rel })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Admin server listening on http://localhost:${PORT}`))
