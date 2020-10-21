const { web, evaluation } = require('@jscad/core')

const compilerPlugin = (store) => {
  // called when the store is initialized
  store.subscribe((mutation, state) => {
    if (mutation.type === 'compile') {
      const fileList = mutation.payload


      // how to compile depends on the payload
      // console.log('payload',fileList)

      if (fileList.item && ('function' === typeof fileList.item)) {
        store.commit('setStatus',`processing (${fileList.length} files)...`)
        // convert FileList to array of File (from selection of files)
        const files = []
        for (let i = 0; i < fileList.length; i++) {
          files.push(fileList.item ? fileList.item(i) : fileList[i])
        }
        // compile
        compileFromFiles(store, files)
      } else if (Array.isArray(fileList) && fileList.length > 0 && fileList[0].filesystem) {
        // compile the list of FileSystem entries (from drag and drop of files)
        store.commit('setStatus',`processing (file system)...`)
        compileFromFiles(store, fileList)
      } else if (fileList.name && fileList.ext && fileList.source && fileList.fullPath) {
        store.commit('setStatus',`processing (fake file entry)...`)
        compileFromSource(store, fileList)
      } else {
        store.commit('setStatus',`error (Invalid source; should be FileList, Array[FileSystem], or Object)`)
      }
    }
  })
}

const compileFromFiles = (store, files) => {
  //console.log('compileFromFile',files)

  const handleParamsOrSolids = (crap, paramsOrSolids) => {
    if (paramsOrSolids.type === 'solids') {
      store.commit('setStatus','solids...')
      store.commit('setSolids', paramsOrSolids.solids)
    }
  }

  web.walkFileTree(files)
  .then((filesAndFolders) => {
    store.commit('setStatus','compiling...')

    const data = { filesAndFolders, serialize: false }
    const objects = evaluation.rebuildGeometry(data, handleParamsOrSolids)
  })
  .then(() => {
    store.commit('setStatus','done')
  })
  .catch((error) => {
    store.commit('setStatus',`error (${error.asString()})`)
  })
}

const compileFromSource = (store, fileEntry) => {
  store.commit('setStatus','compiling...')

  const handleParamsOrSolids = (crap, paramsOrSolids) => {
    if (paramsOrSolids.type === 'solids') {
      store.commit('setStatus','solids...')
      store.commit('setSolids', paramsOrSolids.solids)
    }
  }

  try {
    const data = { filesAndFolders: [ fileEntry ], serialize: false }
    const objects = evaluation.rebuildGeometry(data, handleParamsOrSolids)
  } catch (error) {
    store.commit('setStatus',`error (${error.asString()})`)
  }
}

module.exports = compilerPlugin
