const { prepareRender, drawCommands, cameras, controls, entitiesFromSolids } = require('@jscad/regl-renderer')

const perspectiveCamera = cameras.perspective
const orbitControls = controls.orbit

let numberOfInstances = 0

const rotateSpeed = 0.002
const panSpeed = 0.75
const zoomSpeed = 0.08

/**
 * Set up the JSCAD renderer.
 * @param {DOM Element} containerElement - HTML element of which to add the renderer (canvas)
 * @param {Data} data - viewer data (value of options)
 * @return new JSCAD renderer (already running)
 */
const setupRenderer = (containerElement, data) => {
  const width = containerElement.clientWidth
  const height = containerElement.clientHeight

  // each viewer has state
  data.state = {
    // state to control rendering
    camera: {},
    controls: {},
    rotateDelta: [0, 0],
    panDelta: [0, 0],
    zoomDelta: 0,
    // state to track mouse
    mouse: {
      buttons: 0,
      shiftKey: false,
      isOrbiting: false,
      lastClick: 0, // ms
      lastZoom: 0
    }
  }

  // prepare the camera
  data.state.camera = Object.assign({}, perspectiveCamera.defaults)
  data.state.camera.position = [150, -180, 233]
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
  data.state.content = {
    // define the visual content
    camera: data.state.camera,
    drawCommands: {
      drawGrid: drawCommands.drawGrid,
      drawAxis: drawCommands.drawAxis,
      drawMesh: drawCommands.drawMesh
    },
    entities: [
      gridOptions,
      axisOptions
      //...solids
    ]
  }

  const doRotatePanZoom = (state) => {
    let { rotateDelta, panDelta, zoomDelta, controls, camera } = state
    if (rotateDelta[0] || rotateDelta[1]) {
      const updated = orbitControls.rotate({ controls, camera, speed: rotateSpeed }, rotateDelta)
      state.controls = { ...controls, ...updated.controls }
      state.rotateDelta[0] = 0
      state.rotateDelta[1] = 0
    }

    if (panDelta[0] || panDelta[1]) {
      const updated = orbitControls.pan({ controls, camera, speed: panSpeed }, panDelta)
      state.camera.position = updated.camera.position
      state.camera.target = updated.camera.target
      state.panDelta[0] =  0
      state.panDelta[1] =  0
    }

    if (zoomDelta) {
      if (Number.isFinite(zoomDelta)) {
        const updated = orbitControls.zoom({ controls, camera, speed: zoomSpeed }, zoomDelta)
        state.controls = { ...controls, ...updated.controls }
      } else {
        const entities = state.content.entities
        const updated = orbitControls.zoomToFit({ controls, camera, entities })
        state.controls = { ...controls, ...updated.controls }
      }
      state.zoomDelta = 0
    }
  }

  // the heart of rendering, as themes, controls, etc change
  const updateAndRender = (timestamp) => {
    doRotatePanZoom(data.state)

    const updates = orbitControls.update({ controls: data.state.controls, camera: data.state.camera })
    data.state.controls = { ...data.state.controls, ...updates.controls }
    data.state.camera.position = updates.camera.position
    perspectiveCamera.update(data.state.camera)

    renderer(data.state.content)
    window.requestAnimationFrame(updateAndRender)
  }
  window.requestAnimationFrame(updateAndRender)

  return renderer
}

/**
 * Update the state of the viewer, replacing the solids.
 * @param {State) state - current state of the viewer
 * @param {Array} solids - an array of JSCAD geometries (geom2, geom3, path2)
 */
const updateSolids = (state, solids) => {
  state.content.entities = state.content.entities.filter((entity) => !entity.type) // remove old solids
  let entities = entitiesFromSolids({}, solids)
  state.content.entities.push(...entities)

  const updated = orbitControls.zoomToFit({ controls: state.controls, camera: state.camera, entities })
  state.controls = { ...state.controls, ...updated.controls }
}

const viewerComponent = {
  name: 'jscad-viewer',
  properties: {
    props: [ 'likes' ],
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
    computed: {
      count () {
        const state = this._data.state
        if (state) {
          updateSolids(state, this.$store.state.solids)
        }
        // update the fake DOM entry
        return this.$store.state.count
      },
      solids () {
        return this.$store.state.solids
      }
    },
    methods: {
      // mouse event handling
      onMouseDown: function (event) {
        const state = this._data.state
        state.mouse.buttons = event.buttons
        state.mouse.shiftKey = event.shiftKey
        state.mouse.isOrbiting = true
      },
      onMouseUp: function (event) {
        // handle double clicks
        const now = Date.now()
        const state = this._data.state
        if (state.mouse.lastClick) {
           const ms = now - state.mouse.lastClick
           if (ms < this.viewerOptions.doubleClickSpeed) {
             if (state.mouse.isOrbiting) {
               state.zoomDelta = Number.POSITIVE_INFINITY
             }
           }
        }
        state.mouse.lastClick = now
        // reset state
        state.mouse.buttons = 0
        state.mouse.shiftKey = false
        state.mouse.isOrbiting = false
      },
      onMouseMove: function (event) {
        const state = this._data.state
        if (state.mouse.isOrbiting) {
          if (state.mouse.shiftKey) {
            state.panDelta[0] -= event.movementX
            state.panDelta[1] += event.movementY
          } else {
            state.rotateDelta[0] += event.movementX
            state.rotateDelta[1] -= event.movementY
          }
        }
      },
      onScroll: function (event) {
        event.preventDefault()

        const state = this._data.state
        state.zoomDelta = event.deltaY
      }
    },
    // VUE lifecycle additions
    created: function () {
      numberOfInstances++
      this.id = numberOfInstances
    },
    mounted: function () {
      this.$el.id = `viewer${this.id}`

      this.renderer = setupRenderer(this.$el, this.$data)
    },
    // VUE HTML template for the viewer (and 3D canvas)
    template: '<div class="viewer" v-on:mousemove="onMouseMove" v-on:mousedown="onMouseDown" v-on:mouseup="onMouseUp" v-on:wheel="onScroll"><p hidden>{{ count }}</p></div>'
  }
}

module.exports = viewerComponent
