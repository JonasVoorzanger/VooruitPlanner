// Papierformaat voor de export. Een `@page`-regel kan niet via een class
// gestuurd worden, dus schrijven we hem vlak voor het printen in een eigen
// style-element in de head.
const STYLE_ID = 'pp-print-page-rule'

const PAGE_MARGINS = {
  portrait: '12mm',
  landscape: '10mm',
}

export function setPageOrientation(orientation) {
  const resolved = orientation === 'landscape' ? 'landscape' : 'portrait'

  let style = document.getElementById(STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }

  style.textContent = `@page { size: A4 ${resolved}; margin: ${PAGE_MARGINS[resolved]}; }`
}

// Browsers stellen de documenttitel voor als bestandsnaam bij "Opslaan als pdf",
// dus zetten we die vlak voor het printen om en daarna weer terug.
function useDocumentName(documentName) {
  if (!documentName) {
    return () => {}
  }

  const previousTitle = document.title
  document.title = documentName

  let restored = false
  const restore = () => {
    if (restored) {
      return
    }
    restored = true
    document.title = previousTitle
    window.removeEventListener('afterprint', restore)
  }

  window.addEventListener('afterprint', restore)
  // Vangnet voor browsers die geen afterprint sturen.
  window.setTimeout(restore, 60000)

  return restore
}

// Wacht tot Vue de printweergave in de DOM heeft gezet voordat het printvenster
// opent; anders print de browser een lege of halve pagina.
export function printAfterRender(vm, orientation, documentName) {
  setPageOrientation(orientation)
  return vm.$nextTick().then(() => {
    window.requestAnimationFrame(() => {
      useDocumentName(documentName)
      window.print()
    })
  })
}
