// UG! 'modeling' is cluttering GLOBAL name space
const {primitives} = jscadModeling

// UG! By not using the latest JSCAD library, fixes / enhancements could be missed
// const {primitives} = require('@jscad/modeling')

const main = () => {
  let geom1 = primitives.star({center: [30, 30], outerRadius: 10})
  let geom2 = primitives.ellipsoid({radius: [30, 20, 10]})

  return [geom1, geom2]
}

// UG! By removing these 'exports', this script cannot be reused within other JSCAD designs.
// module.exports = {main}
