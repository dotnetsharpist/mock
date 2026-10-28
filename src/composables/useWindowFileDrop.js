// Get an image in without aiming: drop it anywhere on the page, or just paste.
//
// Aiming for a 220px target with a file under the cursor is the kind of small
// friction nobody reports and everybody feels, so the whole window is the drop
// target and the dashed box is only the *label* for it — the same bargain chat
// apps make. Ctrl+V works the same way, which is how most screenshots arrive.
//
// What this exists to get right — each one is a way the naive version fails:
//
//   1. dragenter/dragleave fire per element, so crossing any child boundary
//      would flicker a naive boolean. A depth counter is the fix.
//   2. dragover must preventDefault or the browser shows the 🚫 cursor and
//      refuses the drop, and drop must preventDefault or the browser navigates
//      away to the file — taking the unsaved essay with it.
//   3. Listeners sit in the CAPTURE phase on document. In the bubble phase any
//      component between the cursor and window that calls stopPropagation on a
//      drag event silently kills the whole feature.
//   4. Files are read from dataTransfer.items as well as .files. Several
//      sources — notably a pasted screenshot and "copy image" from a page —
//      populate one and not the other.
//   5. Dragging *inside* the page (a text selection, a thumbnail) must behave
//      normally, so a dragstart flag marks internal drags. The flag self-heals
//      on every plausible end-of-drag signal, because one stuck flag would
//      refuse every external drop for the rest of the session.
//   6. The drag is always *accepted*; whether it does anything is decided at
//      drop time. Refusing at dragover only produces a 🚫 cursor with no
//      explanation, which is indistinguishable from the feature being broken.
import { onBeforeUnmount, onMounted, ref, unref } from 'vue'

const EXTENSION_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const typesOf = (transfer) => Array.from(transfer?.types || [])

// A page can hand another page text or HTML, never an OS file — so a file item
// is proof the drag came from outside the browser.
const hasFileItem = (transfer) =>
  typesOf(transfer).includes('Files') ||
  Array.from(transfer?.items || []).some((item) => item.kind === 'file')

// The upload validators key off the filename, and a pasted screenshot usually
// arrives as an unnamed blob — give it a name rather than rejecting it.
const withName = (file, index) => {
  if (file.name && /\.(jpe?g|png|webp)$/i.test(file.name)) return file
  const extension = EXTENSION_BY_TYPE[file.type] || 'png'
  return new File([file], `rasm-${index + 1}.${extension}`, { type: file.type })
}

// .files and .items are two views of ONE payload, not two payloads — reading
// both pastes every image twice. Which view is populated depends on where the
// image came from, so try .files and fall back to .items; never merge them.
// (They cannot even be de-duplicated reliably: each view mints its own File
// object, and an unnamed screenshot's lastModified is stamped at read time, so
// the same image yields two entries that differ.)
const imageFilesOf = (transfer) => {
  const fromFiles = Array.from(transfer?.files || [])
  const files = fromFiles.length
    ? fromFiles
    : Array.from(transfer?.items || [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())

  return files.filter((file) => file && file.type.startsWith('image/')).map(withName)
}

// An image dragged out of another tab hands over its address, not its bytes.
const urlOf = (transfer) => {
  const list = transfer.getData('text/uri-list') || ''
  const first = list
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'))
  if (first) return first
  const html = transfer.getData('text/html') || ''
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || ''
}

const fileFromUrl = async (url) => {
  const response = await fetch(url)
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) throw new Error('not an image')
  return withName(new File([blob], '', { type: blob.type }), 0)
}

/**
 * @param onFiles  called with an array of image Files to add
 * @param enabled  ref or getter deciding whether a drop does anything
 * @param onError  optional; called when nothing usable arrived, with the message
 *                 as an i18n key — { key } — so the caller can word it at render
 *                 and it follows a language switch while it is on screen
 * @returns {{ isDragging: import('vue').Ref<boolean> }}
 */
export function useWindowFileDrop(onFiles, enabled = true, onError = null) {
  const isDragging = ref(false)
  let depth = 0
  let isInternalDrag = false

  const isEnabled = () => (typeof enabled === 'function' ? enabled() : unref(enabled))

  const accepts = (event) => {
    const transfer = event.dataTransfer
    if (!transfer) return false
    // OS files can only come from outside, so they clear a stale internal flag.
    if (hasFileItem(transfer)) {
      isInternalDrag = false
      return true
    }
    // Everything else from outside the page is accepted sight unseen. Some
    // sources expose nothing readable until the drop itself — refusing them at
    // dragover would show a 🚫 and leave the student with no idea why.
    return !isInternalDrag
  }

  const reset = () => {
    depth = 0
    isDragging.value = false
  }
  const endDrag = () => {
    isInternalDrag = false
    reset()
  }

  const onDragStart = () => {
    isInternalDrag = true
  }

  const onDragEnter = (event) => {
    if (!accepts(event)) return
    event.preventDefault()
    depth += 1
    if (isEnabled()) isDragging.value = true
  }

  const onDragOver = (event) => {
    if (!accepts(event)) return
    event.preventDefault()
    // Never 'none': a 🚫 cursor reads as "this app is broken", and the drop is
    // worth accepting even in the states where it turns out to do nothing.
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    // dragenter can be missed when the pointer enters over a re-rendering
    // element; dragover always fires, so it also arms the overlay.
    if (isEnabled() && !isDragging.value) {
      depth = Math.max(depth, 1)
      isDragging.value = true
    }
  }

  const onDragLeave = (event) => {
    if (!accepts(event)) return
    depth = Math.max(0, depth - 1)
    if (!depth) isDragging.value = false
  }

  const onDrop = async (event) => {
    if (!accepts(event)) return
    event.preventDefault()
    const transfer = event.dataTransfer
    const files = imageFilesOf(transfer)
    const url = files.length ? '' : urlOf(transfer)
    reset()
    if (!isEnabled()) return

    if (files.length) {
      onFiles(files)
      return
    }
    if (!url) {
      onError?.({ key: 'essayPage.errors.dropUnreadable' })
      return
    }
    try {
      onFiles([await fileFromUrl(url)])
    } catch {
      onError?.({ key: 'essayPage.errors.dropBlocked' })
    }
  }

  const onPaste = (event) => {
    const files = imageFilesOf(event.clipboardData)
    if (!files.length) return // a text paste is none of our business
    if (!isEnabled()) return
    event.preventDefault()
    onFiles(files)
  }

  const listeners = [
    ['dragstart', onDragStart],
    ['dragenter', onDragEnter],
    ['dragover', onDragOver],
    ['dragleave', onDragLeave],
    ['drop', onDrop],
    // Every way a drag can end without a matching dragleave. Miss one and the
    // overlay is stranded on screen, or worse, isInternalDrag sticks on.
    ['dragend', endDrag],
    ['mouseup', endDrag],
    ['pointerup', endDrag],
  ]

  onMounted(() => {
    // Capture phase, on document: nothing in the tree can intercept it first.
    for (const [type, handler] of listeners) document.addEventListener(type, handler, true)
    window.addEventListener('blur', reset)
    document.addEventListener('paste', onPaste, true)
  })

  onBeforeUnmount(() => {
    for (const [type, handler] of listeners) document.removeEventListener(type, handler, true)
    window.removeEventListener('blur', reset)
    document.removeEventListener('paste', onPaste, true)
  })

  return { isDragging }
}
