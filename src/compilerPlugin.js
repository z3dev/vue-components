const { web, evaluation } = require('@jscad/core')

const compilerPlugin = (store) => {
  // called when the store is initialized
  store.subscribe((mutation, state) => {
    if (mutation.type === 'compile') {
      const fileList = mutation.payload

      // convert FileList to array of File
      const files = []
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList.item(i))
      }

      store.commit('setStatus',`processing (${files.length})...`)

      compileDesign(store, files)
    }
  })
}

const compileDesign = (store, files) => {
  console.log('compileDesign',files)

  const afunc = (crap, paramsOrSolids) => {
console.log('afunc',paramsOrSolids)
    if (paramsOrSolids.type === 'solids') {
      store.commit('setStatus','solids...')
      store.commit('setSolids', paramsOrSolids.solids)
    }
  }

  web.walkFileTree(files)
  .then((filesAndFolders) => {
console.log('filesAndFolders',filesAndFolders)
    store.commit('setStatus','compiling...')

    const data = { filesAndFolders, serialize: false }
    const objects = evaluation.rebuildGeometry(data, afunc)
  })
  .then(() => {
    store.commit('setStatus','done')
  })
  .catch((error) => {
    store.commit('setStatus',error)
  })
}

module.exports = compilerPlugin
