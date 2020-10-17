const {primitives} = require('@jscad/modeling')

const main = () => {
  let geom1 = primitives.star({center: [30, 30], outerRadius: 10})
  let geom2 = primitives.ellipsoid({radius: [30, 20, 10]})

  return [geom1, geom2]
}

module.exports = {main}
