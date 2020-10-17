const { walkFileTree, rebuildGeometry } = require('@jscad/core')

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

      compileDesign(store, files)
    }
  })
}

const compileDesign = (store, files) => {
  console.log('compileDesign',files)

  store.commit('setStatus',`processing (${files.length})...`)

  const afunc = (crap, paramsOrSolids) => {
console.log('afunc',paramsOrSolids)
    if (paramsOrSolids.type === 'solids') {
      store.commit('setSolids', paramsOrSolids.solids)
    }
  }

  walkFileTree(files)
  .then((filesAndFolders) => {
console.log('filesAndFolders',filesAndFolders)
    const data = { filesAndFolders, serialize: false }
    const objects = rebuildGeometry(data, afunc)
    store.commit('setStatus','compiling...')
  })
  .then(() => {
    store.commit('setStatus','done')
  })
  .catch((error) => {
    store.commit('setStatus',error)
  })
}

module.exports = compilerPlugin
