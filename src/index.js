export const ShadowRootable = (superClass) => class extends superClass {
  #shadowRootConnected;

  attachedShadowRootCallback() {
    this.#shadowRootConnected?.()
  }

  get shadowRootAttached() {
    if (this.shadowRoot) return Promise.resolve()

    const promise = new Promise(resolve => this.#shadowRootConnected = resolve)

    return promise
  }
}

export function attachShadowRoots(root, callback = null) {
  const shadowNodes = []
  root.querySelectorAll("template[shadowroot]").forEach(template => {
    let shadowRoot
    const node = template.parentNode
    const mode = template.getAttribute("shadowroot")
    try {
      shadowRoot = node.attachShadow({ mode })
      shadowRoot.appendChild(template.content)
      template.remove()
      shadowNodes.push(node)
    } catch (err) {
      shadowRoot = node.shadowRoot
    }
    if (shadowRoot) {
      attachShadowRoots(shadowRoot).forEach(childNode => shadowNodes.push(childNode))
    }
  })

  if (callback) {
    shadowNodes.forEach(node => callback(node))
  } else {
    return shadowNodes
  }
}

export function attachShadowRootsAndNotify(root) {
  attachShadowRoots(root, node => node.attachedShadowRootCallback?.())
}


document.documentElement.addEventListener("turbo:load", (event) => {
  attachShadowRootsAndNotify(event.target)
})

document.documentElement.addEventListener("turbo:frame-load", (event) => {
  attachShadowRootsAndNotify(event.target)
})

document.documentElement.addEventListener("turbo:before-stream-render", async (event) => {
  const prevRender = event.detail.render
  event.detail.render = (async (newElement) => {
    await prevRender(newElement)
    event.target.targetElements.forEach(el => {
      attachShadowRootsAndNotify(el)
    })
  })
})
