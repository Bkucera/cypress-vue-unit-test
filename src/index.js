const { stripIndent } = require('common-tags')

// having weak reference to styles prevents garbage collection
// and "losing" styles when the next test starts
const stylesCache = new Map()

function copyStyles (component) {
  let styles
  if (stylesCache.has(component)) {
    styles = stylesCache.get(component)
  } else {
    styles = document.querySelectorAll('head style')
    if (styles.length) {
      console.log('injected %d styles', styles.length)
      stylesCache.set(component, styles)
    } else {
      console.log('No styles injected for this component')
      styles = null
    }
  }

  if (!styles) {
    return
  }

  const parentDocument = window.parent.document
  const projectName = Cypress.config('projectName')
  const appIframeId = `Your App: '${projectName}'`
  const appIframe = parentDocument.getElementById(appIframeId)
  const head = appIframe.contentDocument.querySelector('head')
  styles.forEach(style => {
    head.appendChild(style)
  })
}

const deleteConstructor = comp => delete comp._Ctor

function deleteCachedConstructors (component) {
  if (!component.components) {
    return
  }
  Cypress._.values(component.components).forEach(deleteConstructor)
}

const getVuePath = options =>
  options.vue || options.vuePath || '../node_modules/vue/dist/vue.js'

const getPageHTML = options => {
  if (options.html) {
    return options.html
  }
  const vue = getVuePath(options)
  const vueHtml = stripIndent`
    <html>
      <head></head>
      <body>
        <div id="app"></div>
        <script src="${vue}"></script>
      </body>
    </html>
  `
  return vueHtml
}

const mountVue = (component, options = {}) => () => {
  cy.document().then(document => {
    const vueHtml = getPageHTML(options)
    document.write(vueHtml)
    document.close()
    console.log('wrote html')
    console.log(vueHtml)
  })
  cy
    .window()
    .its('Vue')
    .then(Vue => {
      deleteCachedConstructors(component)
      Cypress.vue = new Vue(component).$mount('#app')
      copyStyles(component)
    })
}

module.exports = mountVue

// export const loadAndMountMyComponent = VueComponent => () => {
//   cy.visit('index.html')
//   cy
//     .window()
//     .its('Vue')
//     .then(Vue => {
//       deleteCachedConstructors(VueComponent)
//       // TODO go through ITS components and delete their constructors
//       // wonder if there is unified list
//       Cypress.vue = new Vue(VueComponent).$mount('#app')
//       copyStyles(VueComponent)
//     })
// }
