const { prepareRender, drawCommands, cameras, controls, entitiesFromSolids } = require('@jscad/regl-renderer')

const perspectiveCamera = cameras.perspective
const orbitControls = controls.orbit

let numberOfInstances = 0

const renderRate = 10 // number of renders per second
const zoomRate = 10 // number of zooms per second


const setupRenderer = (containerElement, data) => {
  const width = containerElement.clientWidth
  const height = containerElement.clientHeight

  // each viewer has state
  data.state = {
    camera: {},
    controls: {},
    mouse: {
      buttons: 0,
      isOrbiting: false,
      lastClick: 0, // ms
      lastZoom: 0
    },
    entities: [] // converted solids
  }

  // prepare the camera
  data.state.camera = Object.assign({}, perspectiveCamera.defaults)
  perspectiveCamera.setProjection(data.state.camera, data.state.camera, { width, height })
  perspectiveCamera.update(data.state.camera, data.state.camera)

  // prepare the controls
  data.state.controls = orbitControls.defaults

  // prepare the renderer
  const setupOptions = {
    glOptions: { container: containerElement },
  }
  const renderer = prepareRender(setupOptions)

  // assemble the options for rendering
  const gridOptions = {
    visuals: {
      drawCmd: 'drawGrid',
      show: data.gridOptions.show,
      color: data.gridOptions.color,
      subColor: data.gridOptions.subColor,
      fadeOut: data.gridOptions.fadeOut,
      transparent: data.gridOptions.transparent
    },
    size: data.gridOptions.size,
    ticks: data.gridOptions.ticks
  }
  const axisOptions = {
    visuals: {
      drawCmd: 'drawAxis',
      show: data.axisOptions.show
    }
  }
  const renderOptions = {
    camera: data.state.camera,
    drawCommands: {
      drawGrid: drawCommands.drawGrid,
      drawAxis: drawCommands.drawAxis,
      drawMesh: drawCommands.drawMesh
    },
    // define the visual content
    entities: [
      gridOptions,
      axisOptions
      //...solids
    ]
  }
  if (solids) {
    data.state.entities = entitiesFromSolids({}, solids)
    renderOptions.entities.push(...data.state.entities)

    const updated = orbitControls.zoomToFit({ controls: data.state.controls, camera: data.state.camera, entities: data.state.entities })
    data.state.controls = { ...data.state.controls, ...updated.controls }
  }

  // the heart of rendering, as themes, controls, etc change
  data.prevTimestamp = 0
  const updateAndRender = (timestamp) => {
    const elaspe = timestamp - data.prevTimestamp
    if (elaspe > (1000 / renderRate)) {
      data.prevTimestamp = timestamp

      const updates = orbitControls.update({ controls: data.state.controls, camera: data.state.camera })
      data.state.controls = { ...data.state.controls, ...updates.controls }
      data.state.camera.position = updates.camera.position
      perspectiveCamera.update(data.state.camera)

      renderer(renderOptions)
    }
    window.requestAnimationFrame(updateAndRender)
  }
  window.requestAnimationFrame(updateAndRender)

  return renderer
}

const viewerComponent = {
  name: 'jscad-viewer',
  properties: {
    props: [ 'solids', 'likes' ],
    data: function () {
      // options which can be changed
      return {
        gridOptions: {
          show: true,
          color: [0, 0, 0, 1],
          subColor: [0, 0, 1, 0.5],
          fadeOut: false,
          transparent: true,
          size: [100, 100],
          ticks: [100, 10]
        },
        axisOptions: {
          show: true
        },
        viewerOptions: {
          rotateSpeed: 0.002,
          zoomSpeed: 0.08,
          doubleClickSpeed: 300 // ms
        }
      }
    },
    methods: {
      onMouseDown: function (event) {
        const state = this._data.state
        state.mouse.buttons = event.buttons
        state.mouse.isOrbiting = true
console.log('d',state.mouse.buttons)
        // event.altKey
        // event.ctrlKey
        // event.metaKey
        // event.shiftKey
      },
      onMouseUp: function (event) {
        // handle double clicks
        const now = Date.now()
        const state = this._data.state
        if (state.mouse.lastClick) {
           const ms = now - state.mouse.lastClick
           if (ms < this.viewerOptions.doubleClickSpeed) {
             if (state.mouse.isOrbiting) {
               const updated = orbitControls.zoomToFit({ controls: state.controls, camera: state.camera, entities: state.entities })
               state.controls = { ...state.controls, ...updated.controls }
             }
           }
        }
        state.mouse.lastClick = now
        // reset state
        state.mouse.buttons = 0
        state.mouse.isOrbiting = false
      },
      onMouseMove: function (event) {
        const state = this._data.state
        if (state.mouse.isOrbiting) {
          const delta = [event.movementX, -event.movementY] // .map((d) => -d)
          const state = this._data.state
          const speed = this.viewerOptions.rotateSpeed
          const updated = orbitControls.rotate({ controls: state.controls, camera: state.camera, speed }, delta)
          state.controls = { ...state.controls, ...updated.controls }
        }
      },
      onScroll: function (event) {
        event.preventDefault()

        const now = Date.now()
        const state = this._data.state
        const ms = now - state.mouse.lastZoom
        if (ms > (1000 / zoomRate)) {
          const delta = event.deltaY
          const speed = this.viewerOptions.zoomSpeed
          const updated = orbitControls.zoom({ controls: state.controls, camera: state.camera, speed }, delta)
          state.controls = { ...state.controls, ...updated.controls }
          state.mouse.lastZoom = now
        }
      }
    },
    // Vue lifecycle additions
    created: function () {
      numberOfInstances++
      this.id = numberOfInstances
    },
    mounted: function () {
      this.$el.id = `viewer${this.id}`

      this.renderer = setupRenderer(this.$el, this.$data)
console.log(this.likes)
    },
    // HTML template for the viewer (and 3D canvas)
    template: '<div class="viewer" v-on:mousemove="onMouseMove" v-on:mousedown="onMouseDown" v-on:mouseup="onMouseUp" v-on:wheel="onScroll"></div>'
  }
}

module.exports = viewerComponent
