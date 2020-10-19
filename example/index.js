const { booleans, colors, extrusions, geometries, primitives, transforms } = require('@jscad/modeling')

// functions that this design uses
const { circle, cuboid, cylinder, rectangle, roundedCylinder, roundedRectangle, sphere } = primitives

const { intersect, subtract, union } = booleans

const { rotate, translate } = transforms

const { extrudeLinear } = extrusions

const { geom3 } = geometries

// parameter definitions
const getParameterDefinitions = () => {
    return [
        { name: 'board', type: 'group', initial: 0, caption: 'Raspberry PI:' },
        { name: 'board_v', type: 'checkbox', checked: true, caption: 'View?' },
        { name: 'base', type: 'group', initial: 0, caption: 'Base:' },
        { name: 'case_b_v', type: 'checkbox', checked: true, caption: 'View?' },
        { name: 'cover', type: 'group', initial: 0, caption: 'Cover:' },
        { name: 'case_c_v', type: 'checkbox', checked: true, caption: 'View?' },
        { name: 'case_c_gap', type: 'int', initial: 2.0, caption: 'Rim Vent (mm)?', step: 1, min: 0 },
        { name: 'case_c_dim', type: 'checkbox', checked: true, caption: 'Expose DIM Slot?' },
        { name: 'case_c_led', type: 'checkbox', checked: true, caption: 'Expose LEDs?' },
        { name: 'case_c_net', type: 'checkbox', checked: true, caption: 'Expose Network Port?' },
        { name: 'case_c_usb1', type: 'checkbox', checked: true, caption: 'Expose USB Bank 1?' },
        { name: 'case_c_usb2', type: 'checkbox', checked: true, caption: 'Expose USB Bank 2?' },
        { name: 'case_c_add_s', type: 'checkbox', checked: true, caption: 'Addition Support?' },
        { name: 'others', type: 'group', initial: 0, caption: 'Others Settings:' },
        { name: 'segments', type: 'int', initial: 36, caption: 'Segments?' },
    ]
}

//
// A case for the Raspberry PI 2 computer boards.
//
// By Jeff Gay
//

//
// create a mockup of the Raspberry PI board
//
const createBoard = (p) => {
// blank board
    let b = roundedRectangle({size: [p.pi_w_r * 2, p.pi_l_r * 2], roundRadius: 3.0, segments: p.segments})
// less mounting holes
    let h = circle({radius: p.pi_mh_ir, segments: p.segments})
    let x = -p.pi_w_r + p.pi_m_x
    let y = -p.pi_l_r + p.pi_m_y
    b = subtract(b, translate([x, y], h))
    y = y + 58.0
    b = subtract(b, translate([x, y], h))
    x = x + 49.0
    b = subtract(b, translate([x, y], h))
    y = y - 58.0
    b = subtract(b, translate([x, y], h))
    b = extrudeLinear({height: p.pi_t_r * 2}, b)
    b = translate([0 , -p.pi_usb_e_r, p.case_b_t + p.case_b_h], b)
    b = colors.colorize(colors.colorNameToRgb('goldenrod'), b)
    return b
}

const makeRow = (h, p) => {
    let i = 0
    let x = 0
    let y = 0
    let c = circle({radius: p.case_b_v_h, segments: p.segments})
    let holes = [c]
    for (i = 1; i < h; i++) {
        y = y + (p.case_b_v_h * 2) + p.case_b_v_g
        holes.push(translate([x, y], c))
    }
    return translate([0, -(y / 2)], holes)
}

const createVentHoles = (p) => {
    let h = p.case_b_v_n
    let rows = []
    let x = 0
    for (let i = 0; i < p.case_b_v_r; i = i + 2) {
        let row = makeRow(h, p)
        let rowa = translate([x, 0], row)
        let rowb = translate([-x, 0], row)
        rows.push(...rowa)
        rows.push(...rowb)
        h = h - 1
        if (h === 0) break // for safety
        x = x + p.case_b_v_h + p.case_b_v_g
    }
    return extrudeLinear({height: p.case_b_t}, rows)
}

//
// Create the base of the case
//
const createBase = (p) => {
// calculate dimensions base on the Rasberry PI board
    let f = p.case_b_f
    let r = p.pi_c_r + f
    let w = p.pi_w_r + f
    let l = p.pi_l_r + p.pi_usb_e_r + f
    let d = p.case_b_t + p.case_b_h

    let b = roundedRectangle({size: [w * 2, l * 2], roundRadius: r, segments: p.segments})
    b = extrudeLinear({height: d}, b)
// less center for electronics and cooling
    let r2 = p.pi_c_r - p.case_b_w_t + f
    let w2 = p.pi_w_r - p.case_b_w_t + f
    let l2 = p.pi_l_r - p.case_b_w_t + f
    let d2 = p.case_b_h

    let c = roundedRectangle({size: [w2 * 2, l2 * 2], roundRadius: r2, segments: p.segments})
    c = extrudeLinear({height: d}, c)
    c = translate([0, -p.pi_usb_e_r, p.case_b_t], c)
    b = subtract(b, c)
// less vents (optional)
    b = subtract(b, transforms.translate([0, -p.pi_usb_e_r, 0], createVentHoles(p)))
// less slot for SSD card
    let s = rectangle({size: [p.pi_sd_w_r * 2, l * 2]})
    s = translate([0, -l], s)
    s = extrudeLinear({height: p.pi_sd_d_r * 2}, s)
    s = translate([0, 0, d - (p.pi_sd_d_r * 2)], s)
    b = subtract(b, s)
// plus mounts
    let m = circle({radius: p.pi_mh_or, segments: p.segments})
    m = extrudeLinear({height: d}, m)
    s = sphere({radius: p.pi_mh_ir, segments: p.segments})
    s = translate([0, 0, d], s)
    m = union(m, s)

    let x = -p.pi_w_r + p.pi_m_x
    let y = -p.pi_l_r + p.pi_m_y - p.pi_usb_e_r
    b = union(b, translate([x, y], m))
    y = y + 58.0
    b = union(b, translate([x, y], m))
    x = x + 49.0
    b = union(b, translate([x, y], m))
    y = y - 58.0
    b = union(b, translate([x, y], m))
// plus block under the middle USB ports
    let b_r = 6 / 2
    m = rectangle({size: [b_r * 2, b_r * 2]})
    m = extrudeLinear({height: d}, m)
    x = 0
    y = p.pi_l_r - b_r - p.pi_usb_e_r
    b = union(b, translate([x, y], m))
// plus block under the audio jack
    x = (p.case_c_w_t + p.case_c_f) / 2
    r = p.pi_audio_r + p.case_c_f
    m = rectangle({size: [x * 2, r * 2]})
    let z = d + (p.pi_t_r * 2) + (p.pi_audio_r)
    m = extrudeLinear({height: z - 1}, m)
    c = cylinder({height: x * 2, radius: r, segments: p.segments})
    c = translate([0, 0, z], c)
    c = rotate([0, Math.PI / 2, 0], c)
    m = subtract(m, c)
    x = w + x
    y = -p.pi_l_r + p.pi_audio_o - p.pi_usb_e_r
    b = union(b, translate([x, y], m))
// plus block under the hdmi port
    x = (p.case_c_w_t + p.case_c_f) / 2
    r = p.pi_hdmi_r + p.case_c_f
    m = rectangle({size: [x * 2, r * 2]})
    z = d + (p.pi_t_r * 2)
    m = extrudeLinear({height: z}, m)
    x = w + x
    y = -p.pi_l_r + p.pi_hdmi_o - p.pi_usb_e_r
    b = union(b, translate([x, y], m))
// plus block under the power port
    x = (p.case_c_w_t + p.case_c_f) / 2
    r = p.pi_pwr_r + p.case_c_f
    m = rectangle({size: [x * 2, r * 2]})
    z = d + (p.pi_t_r * 2)
    m = extrudeLinear({height: z}, m)
    x = w + x
    y = -p.pi_l_r + p.pi_pwr_o - p.pi_usb_e_r
    b = union(b, translate([x, y], m))
// plus clips
    z = p.clip_z
    let ci = roundedCylinder({height: z * 2, radius: p.clip_r, roundRadius: p.clip_r * 0.95, segments: p.segments})
    let cor = ((p.clip_r / 2) + 1) / 2
    let co = rectangle({size: [cor * 2, (p.clip_r + 1) * 2]})
    z = p.clip_z + p.clip_r + 1
    co = extrudeLinear({height: z}, co)
    x = -p.pi_w_r - p.case_b_f
    y = -p.pi_l_r + p.pi_m_y - p.pi_usb_e_r + 58 // located at the mount
    b = union(b, translate([x + cor, y], co))
    b = subtract(b, translate([x, y], ci))
    y = -p.pi_l_r + p.pi_pwr_o - p.pi_usb_e_r
    y = y + p.pi_pwr_r + ((p.pi_hdmi_o - p.pi_hdmi_r - p.pi_pwr_o - p.pi_pwr_r) / 2)
    b = union(b, translate([x + cor, y], co))
    b = subtract(b, translate([x, y], ci))
    x = p.pi_w_r + p.case_b_f
    b = union(b, translate([x - cor, y], co))
    b = subtract(b, translate([x, y], ci))
    y = -p.pi_l_r + p.pi_m_y - p.pi_usb_e_r + 58 // located at the mount
    b = union(b, translate([x - cor, y], co))
    b = subtract(b, translate([x, y], ci))

    b = colors.colorize(colors.colorNameToRgb('indianred'), b)

    return b
}

const createCover = (p) => {
// calculate dimensions base on the Rasberry PI board
    let bf = p.case_b_f
    let r = p.pi_c_r + bf + p.case_c_w_t + p.case_c_f
    let w = p.pi_w_r + bf + p.case_c_w_t + p.case_c_f
    let l = p.pi_l_r + p.pi_usb_e_r + bf + p.case_c_w_t + p.case_c_f
    let d = p.case_c_t + p.case_c_h + p.case_c_gap + p.case_c_gap_s

    let c = roundedRectangle({size: [w * 2, l * 2], roundRadius: r, segments: p.segments})
    c = extrudeLinear({height: d}, c)
// less center for electronics and cooling
    let r2 = p.pi_c_r + bf + p.case_c_f
    let w2 = p.pi_w_r + bf + p.case_c_f
    let l2 = p.pi_l_r + p.pi_usb_e_r + bf + p.case_c_f
    let d2 = p.case_c_h + p.case_c_gap + p.case_c_gap_s

    let x, y, z, m
    let s = roundedRectangle({size: [w2 * 2, l2 * 2], roundRadius: r2, segments: p.segments})
    s = extrudeLinear({height: d2}, s)
    c = subtract(c, s)
// plus lip below the USB ports for strength (optional)
    if (p.case_c_add_s === true) {
        m = rectangle({size: [w * 2, p.pi_usb_e_r * 2]})
        m = extrudeLinear({height: (p.pi_t_r * 2)}, m)
        z = p.case_b_t + p.case_b_h + p.case_c_f
        m = translate([0, l2 - p.pi_usb_e_r, z], m)
        m = intersect(m, s)
        c = union(c, m)
    }
// less gaps around the rim for ventilation
    if (p.case_c_gap > 0) {
    // add support for the vent
        m = roundedRectangle({size: [w * 2, l * 2], roundRadius: r, segments: p.segments})
        s = roundedRectangle({size: [(w2 - p.case_c_gap_s) * 2, (l2 - p.case_c_gap_s) * 2], roundRadius: r2, segments: p.segments})
        m = subtract(m, s)

        x = p.pi_usb_r
        s = rectangle({size: [x * 2, l * 2]})
        x = -w2 + r2 + p.pi_usb_r
        y = 0
        m = subtract(m, translate([x, y], s))
        x =  w2 - r2 - p.pi_usb_r
        m = subtract(m, translate([x, y], s))
        let y2 = (l2 - r2 - ((5 * 3) / 2)) / 4
        s = rectangle({size: [w * 2, y2 * 2]})
        x = 0
        y = -l2 + r2 + y2
        m = subtract(m, translate([x, y], s))
        y = y + 5 + (y2 * 2)
        m = subtract(m, translate([x, y], s))
        y = y + 5 + (y2 * 2)
        m = subtract(m, translate([x, y], s))
        y = y + 5 + (y2 * 2)
        m = subtract(m, translate([x, y], s))
        z = d - p.case_c_t - p.case_c_gap - p.case_c_gap_s
        s = extrudeLinear({height: p.case_c_gap + p.case_c_gap_s}, m)
        s = translate([0 , 0, z], s)
        c = union(c, s)
    // less the vent
        m = roundedRectangle({size: [w * 2.01, l * 2.01], roundRadius: r, segments: p.segments})
        s = roundedRectangle({size: [w2 * 2, l2 * 2], roundRadius: r2, segments: p.segments})
        m = subtract(m, s)
        z = d - p.case_c_t - p.case_c_gap
        s = extrudeLinear({height: p.case_c_gap}, m)
        s = translate([0, 0, z], s)
        c = subtract(c, s)
    }
// less slot for sdd card (optional)
    if (p.case_c_dim === true) {
        z = p.case_b_t + p.case_b_h + p.case_c_f
        y = p.pi_l_r + p.pi_usb_e_r + bf
        s = rectangle({size: [p.pi_sd_w_r * 2, y * 2]})
        s = translate([0, -y], s)
        s = extrudeLinear({height: z}, s)
        c = subtract(c, s)
    }
// less holes for the LEDs
    if (p.case_c_led === true) {
        s = cylinder({height: p.case_c_w_t * 2, radius: p.case_c_l_r, segments: p.segments})
        s = rotate([Math.PI / 2, 0, 0], s)
        x = -p.pi_w_r + 8.0
        y = -p.pi_l_r - p.pi_usb_e_r - p.case_c_w_t
        z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + 0.5
        c = subtract(c, translate([x, y, z], s))
        x = x + 3.5
        c = subtract(c, translate([x, y, z], s))
    }
// less slot for the audio jack
    r = p.pi_audio_r + p.case_c_f  + p.case_c_f
    z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + (p.pi_audio_r)
    m = rectangle({size: [p.case_c_w_t * 2, r * 2]})
    m = extrudeLinear({height: z}, m)
    s = cylinder({height: p.case_c_w_t * 2, radius: r, segments: p.segments})
    s = translate([0, 0, z], s)
    s = rotate([0, Math.PI / 2, 0], s)
    s = union(m, s)
    x = p.pi_w_r + bf + p.case_c_w_t
    y = -p.pi_l_r + p.pi_audio_o - p.pi_usb_e_r
    s = translate([x, y, 0], s)
    c = subtract(c, s)
// less slot for the hdmi port
    x = p.case_c_w_t
    r = p.pi_hdmi_r + p.case_c_f + p.case_c_f
    m = rectangle({size: [x * 2, r * 2]})
    z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.pi_hdmi_h + p.case_c_f
    m = extrudeLinear({height: z}, m)
    x = p.pi_w_r + bf + p.case_c_w_t
    y = -p.pi_l_r + p.pi_hdmi_o - p.pi_usb_e_r
    c = subtract(c, translate([x, y, 0], m))
// less slot for the power port
    x = (p.case_c_w_t + p.case_c_f) / 2
    r = p.pi_pwr_r + p.case_c_f + p.case_c_f
    m = rectangle({size: [x * 2, r * 2]})
    z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.pi_pwr_h + p.case_c_f
    m = extrudeLinear({height: z}, m)
    x = p.pi_w_r + bf + x
    y = -p.pi_l_r + p.pi_pwr_o - p.pi_usb_e_r
    c = subtract(c, translate([x, y, 0], m))
// less hole for network port (optional)
    if (p.case_c_net === true) {
        y = (p.case_c_w_t + p.case_c_f) / 2
        x = p.pi_net_r - p.case_c_f // slightly smaller
        m = rectangle({size: [x * 2, y * 2]})
        z = p.pi_net_h - (p.case_c_f * 2) // slightly smaller
        m = extrudeLinear({height: z}, m)
        x = p.pi_w_r - p.pi_net_o
        y = l - y
        z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.case_c_f
        c = subtract(c, translate([x, y, z], m))
    }
// less holes for USB ports and supports (optional)
    s = rectangle({size: [1.0, (p.pi_usb_e_r * 3) * 2]})
    x = d - p.case_b_t - p.case_b_h - (p.pi_t_r * 2) - p.case_c_f
    y = l2 - (p.pi_usb_e_r * 3)
    z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.case_c_f
    s = extrudeLinear({height: x}, s)
    s = translate([0, y, z], s)
    y = (p.case_c_w_t + p.case_c_f) / 2
    x = p.pi_usb_r - p.case_c_f // slightly smaller
    m = rectangle({size: [x * 2, y * 2]})
    z = (p.pi_usb_h_r * 2) - (p.case_c_f * 2) // slightly smaller
    m = extrudeLinear({height: z}, m)
    if (p.case_c_usb1 === true) {
        x = p.pi_w_r - p.pi_usb1_o
        y = l - ((p.case_c_w_t + p.case_c_f) / 2)
        z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.case_c_f
        c = subtract(c, translate([x, y, z], m))
        x = x + p.pi_usb_r + 1.0 + (1.0 / 2)
        c = union(c, translate([x, 0, 0], s))
    }
    if (p.case_c_usb2 === true) {
        x = p.pi_w_r - p.pi_usb2_o
        y = l - ((p.case_c_w_t + p.case_c_f) / 2)
        z = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.case_c_f
        c = subtract(c, translate([x, y, z], m))
        x = x + p.pi_usb_r + 1.0 + (1.0 / 2)
        c = union(c, translate([x, 0, 0], s))
    }
// plus clips and hold downs
    let cl = sphere({radius: p.clip_r, segments: p.segments})
    z = (d - p.case_b_t - p.case_b_h - (p.pi_t_r * 2) - p.case_c_f) / 2
    let zhd = p.case_b_t + p.case_b_h + (p.pi_t_r * 2) + p.case_c_f + z
    let xhd = p.pi_mh_ir
    let hd = cuboid({size: [p.pi_mh_ir * 2, p.pi_mh_ir * 2, z * 2]})
    x = -w2
    y = -p.pi_l_r + p.pi_m_y - p.pi_usb_e_r + 58 // located at the mount
    z = p.clip_z
    c = union(c, translate([x, y, z], cl))
    let yhd = y
    c = union(c, translate([x + xhd, yhd, zhd], hd))
    y = -p.pi_l_r + p.pi_pwr_o - p.pi_usb_e_r
    y = y + p.pi_pwr_r + ((p.pi_hdmi_o - p.pi_hdmi_r - p.pi_pwr_o - p.pi_pwr_r) / 2)
    c = union(c, translate([x, y, z], cl))
    yhd = -p.pi_l_r - p.pi_usb_e_r + p.pi_m_y // located at the mount
    c = union(c, translate([x + xhd, yhd, zhd], hd))
    x = w2
    c = union(c, translate([x, y, z], cl))
    c = union(c, translate([x - xhd, yhd, zhd], hd))
    y = -p.pi_l_r + p.pi_m_y - p.pi_usb_e_r + 58 // located at the mount
    c = union(c, translate([x, y, z], cl))
    yhd = y
    c = union(c, translate([x - xhd, yhd, zhd], hd))

    c = colors.colorize(colors.colorNameToRgb('forestgreen'), c)

    return c
}


const main = (p) => {
// base dimensions
    p.case_b_w_t = 1.0  // base wall thickness (best 1.0)
    p.case_b_t   = 1.5  // base bottom thickness (min 1.5)
    p.case_b_h   = 3.0  // base height, above the base thickness (min 3.0)
    p.case_b_f   = 0.25 // slack around the edges of the board

    p.case_b_v_h = 2.0  // vent holes
    p.case_b_v_g = 4.0  // gaps between vent holes
    p.case_b_v_n = 7    // number of vent holes (middle row)
    p.case_b_v_r = 5    // number of rows (1 + factor of 2)

// cover dimensions
    p.case_c_w_t = 2.0   // cover wall thickness
    p.case_c_t   = 1.5   // cover top thickness
    p.case_c_h   = 23.0  // cover height, below the cover thickness (min 23)
    p.case_c_f   = 0.25  // slack around the edges of the base
    p.case_c_l_r = 2.5/2 // hole in front of LEDs

    if (p.case_c_gap > 0) {
        p.case_c_gap_s = 1.5 // support
    } else {
        p.case_c_gap_s = 0   // no support
    }

// clip dimensions
    p.clip_r = 2.5/2          // radius of clips
    p.clip_z = p.clip_r + 1.0 // position of clips

// Raspberry PI 2 form factors
    p.pi_l_r = 85/2
    p.pi_w_r = 56/2
    p.pi_t_r = 1.35/2
    p.pi_c_r = 2.5        // corner radius, really 3.0 but board is different
    p.pi_mh_ir = 2.75/2   // M2.5 bolt holes
    p.pi_mh_or = 6.2/2    // spacers around the holes
    p.pi_m_x = 3.5        // inset of mount from corner
    p.pi_m_y = 3.5        // inset of mount from corner
    p.pi_sd_w_r = 14/2    // ssd card slot width
    p.pi_sd_d_r = 2/2     // ssd card slot depth
    p.pi_usb_e_r = 2.0/2  // extension of USB ports beyond the board
    p.pi_usb_h_r = 16.0/2 // height of USB ports above the board
    p.pi_usb1_o = 29.0    // USB ports (bank 1) offset
    p.pi_usb2_o = 47.0    // USB ports (bank 2) offset
    p.pi_usb_r = 15.0/2   // USB port width
    p.pi_audio_r = 6/2    // audio jack size
    p.pi_audio_o = 53.5   // audio jack offset
    p.pi_hdmi_r = 15/2    // hdmi port size
    p.pi_hdmi_o = 32.0    // hdmi port offset
    p.pi_hdmi_h = 6.0     // height of hdmi port above the board
    p.pi_pwr_r = 8/2      // power port size
    p.pi_pwr_o = 10.6     // power port offset
    p.pi_pwr_h = 3.0      // height of power port above the board
    p.pi_net_o = 10.25    // network port offset
    p.pi_net_h = 13.5     // height of network port above the board
    p.pi_net_r = 16.0/2   // network port width

    let objs = []
    if (p.board_v === true) {
        objs.push( createBoard(p) )
    }
    if (p.case_b_v === true) {
        objs.push( createBase(p) )
    }
    if (p.case_c_v === true) {
        objs.push( createCover(p) )
    }
    if (objs.length === 0) {
        objs.push( primitives.cube() ) // return something
    }
 
    return objs
}

module.exports = {main, getParameterDefinitions}
