const url = require('url')
const path = require('path')

const { web, evaluation } = require('@jscad/core')

const fetchPlugin = (store) => {
  // called when the store is initialized
  store.subscribe((mutation, state) => {
    if (mutation.type === 'fetch') {
      const remoteURL = mutation.payload

      store.commit('setStatus',`fetching (${remoteURL})...`)

      const onerror = (error) => {
        store.commit('setStatus',`error (${error})`)
      }
      const onsucess = (fileEntry) => {
        store.commit('setStatus',`fetched...`)
        store.commit('compile',{ fileList: fileEntry })
      }

      // validate the URL
      try {
        const parts = new URL(remoteURL)
        fetchFile(remoteURL, onsucess, onerror)
      } catch (error) {
        store.commit('setStatus',`error (${error.toString()})`)
      }
    }
  })
}

const getFileExtensionFromString = (input) => {
  if (input.indexOf('.') === -1) return undefined
  return (input.substring(input.lastIndexOf('.') + 1)).toLowerCase()
}

const fetchFile = (remoteURL, onsucess, onerror) => {
  const xhr = new XMLHttpRequest()

  xhr.onerror = () => {
    const error = new Error(`failed to load ${remoteURL} see console for more details`)
    onerror(error)
  }

  xhr.onload = (event) => {
    const source = event.currentTarget.responseText
    const status = event.target.status
    if (`${status}`.startsWith('4')) {
      const error = new Error(source)
      onerror(error)
    } else {
      const name = path.basename(remoteURL)
      const fullPath = `/${name}` // fake path for fake filesystem lookup
      const ext = getFileExtensionFromString(fullPath)
      const fileEntry = { name, ext, source, fullPath }
      onsucess(fileEntry)
    }
  }

  xhr.open('GET', remoteURL, true)
  //xhr.withCredentials = true
  xhr.send()
}

module.exports = fetchPlugin
