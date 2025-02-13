;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
      ? define(['exports'], factory)
      : ((global =
          typeof globalThis !== 'undefined' ? globalThis : global || self),
        factory((global.nobleSecp256k1 = {})))
})(this, function (exports) {
  'use strict'

  const _nodeResolve_empty = {}

  const nodeCrypto = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    default: _nodeResolve_empty
  })

  /*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */
  const _0n = BigInt(0)
  const _1n = BigInt(1)
  const _2n = BigInt(2)
  const _3n = BigInt(3)
  const _8n = BigInt(8)
  const POW_2_256 = _2n ** BigInt(256)
  const CURVE = {
    a: _0n,
    b: BigInt(7),
    P: POW_2_256 - _2n ** BigInt(32) - BigInt(977),
    n: POW_2_256 - BigInt('432420386565659656852420866394968145599'),
    h: _1n,
    Gx: BigInt(
      '55066263022277343669578718895168534326250603453777594175500187360389116729240'
    ),
    Gy: BigInt(
      '32670510020758816978083085130507043184471273380659243275938904335757337482424'
    ),
    beta: BigInt(
      '0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'
    )
  }
  function weistrass(x) {
    const {a, b} = CURVE
    const x2 = mod(x * x)
    const x3 = mod(x2 * x)
    return mod(x3 + a * x + b)
  }
  const USE_ENDOMORPHISM = CURVE.a === _0n
  class JacobianPoint {
    constructor(x, y, z) {
      this.x = x
      this.y = y
      this.z = z
    }
    static fromAffine(p) {
      if (!(p instanceof Point)) {
        throw new TypeError('JacobianPoint#fromAffine: expected Point')
      }
      return new JacobianPoint(p.x, p.y, _1n)
    }
    static toAffineBatch(points) {
      const toInv = invertBatch(points.map(p => p.z))
      return points.map((p, i) => p.toAffine(toInv[i]))
    }
    static normalizeZ(points) {
      return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine)
    }
    equals(other) {
      if (!(other instanceof JacobianPoint))
        throw new TypeError('JacobianPoint expected')
      const {x: X1, y: Y1, z: Z1} = this
      const {x: X2, y: Y2, z: Z2} = other
      const Z1Z1 = mod(Z1 ** _2n)
      const Z2Z2 = mod(Z2 ** _2n)
      const U1 = mod(X1 * Z2Z2)
      const U2 = mod(X2 * Z1Z1)
      const S1 = mod(mod(Y1 * Z2) * Z2Z2)
      const S2 = mod(mod(Y2 * Z1) * Z1Z1)
      return U1 === U2 && S1 === S2
    }
    negate() {
      return new JacobianPoint(this.x, mod(-this.y), this.z)
    }
    double() {
      const {x: X1, y: Y1, z: Z1} = this
      const A = mod(X1 ** _2n)
      const B = mod(Y1 ** _2n)
      const C = mod(B ** _2n)
      const D = mod(_2n * (mod((X1 + B) ** _2n) - A - C))
      const E = mod(_3n * A)
      const F = mod(E ** _2n)
      const X3 = mod(F - _2n * D)
      const Y3 = mod(E * (D - X3) - _8n * C)
      const Z3 = mod(_2n * Y1 * Z1)
      return new JacobianPoint(X3, Y3, Z3)
    }
    add(other) {
      if (!(other instanceof JacobianPoint))
        throw new TypeError('JacobianPoint expected')
      const {x: X1, y: Y1, z: Z1} = this
      const {x: X2, y: Y2, z: Z2} = other
      if (X2 === _0n || Y2 === _0n) return this
      if (X1 === _0n || Y1 === _0n) return other
      const Z1Z1 = mod(Z1 ** _2n)
      const Z2Z2 = mod(Z2 ** _2n)
      const U1 = mod(X1 * Z2Z2)
      const U2 = mod(X2 * Z1Z1)
      const S1 = mod(mod(Y1 * Z2) * Z2Z2)
      const S2 = mod(mod(Y2 * Z1) * Z1Z1)
      const H = mod(U2 - U1)
      const r = mod(S2 - S1)
      if (H === _0n) {
        if (r === _0n) {
          return this.double()
        } else {
          return JacobianPoint.ZERO
        }
      }
      const HH = mod(H ** _2n)
      const HHH = mod(H * HH)
      const V = mod(U1 * HH)
      const X3 = mod(r ** _2n - HHH - _2n * V)
      const Y3 = mod(r * (V - X3) - S1 * HHH)
      const Z3 = mod(Z1 * Z2 * H)
      return new JacobianPoint(X3, Y3, Z3)
    }
    subtract(other) {
      return this.add(other.negate())
    }
    multiplyUnsafe(scalar) {
      const P0 = JacobianPoint.ZERO
      if (typeof scalar === 'bigint' && scalar === _0n) return P0
      let n = normalizeScalar(scalar)
      if (n === _1n) return this
      if (!USE_ENDOMORPHISM) {
        let p = P0
        let d = this
        while (n > _0n) {
          if (n & _1n) p = p.add(d)
          d = d.double()
          n >>= _1n
        }
        return p
      }
      let {k1neg, k1, k2neg, k2} = splitScalarEndo(n)
      let k1p = P0
      let k2p = P0
      let d = this
      while (k1 > _0n || k2 > _0n) {
        if (k1 & _1n) k1p = k1p.add(d)
        if (k2 & _1n) k2p = k2p.add(d)
        d = d.double()
        k1 >>= _1n
        k2 >>= _1n
      }
      if (k1neg) k1p = k1p.negate()
      if (k2neg) k2p = k2p.negate()
      k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z)
      return k1p.add(k2p)
    }
    precomputeWindow(W) {
      const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1
      const points = []
      let p = this
      let base = p
      for (let window = 0; window < windows; window++) {
        base = p
        points.push(base)
        for (let i = 1; i < 2 ** (W - 1); i++) {
          base = base.add(p)
          points.push(base)
        }
        p = base.double()
      }
      return points
    }
    wNAF(n, affinePoint) {
      if (!affinePoint && this.equals(JacobianPoint.BASE))
        affinePoint = Point.BASE
      const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1
      if (256 % W) {
        throw new Error(
          'Point#wNAF: Invalid precomputation window, must be power of 2'
        )
      }
      let precomputes = affinePoint && pointPrecomputes.get(affinePoint)
      if (!precomputes) {
        precomputes = this.precomputeWindow(W)
        if (affinePoint && W !== 1) {
          precomputes = JacobianPoint.normalizeZ(precomputes)
          pointPrecomputes.set(affinePoint, precomputes)
        }
      }
      let p = JacobianPoint.ZERO
      let f = JacobianPoint.ZERO
      const windows = 1 + (USE_ENDOMORPHISM ? 128 / W : 256 / W)
      const windowSize = 2 ** (W - 1)
      const mask = BigInt(2 ** W - 1)
      const maxNumber = 2 ** W
      const shiftBy = BigInt(W)
      for (let window = 0; window < windows; window++) {
        const offset = window * windowSize
        let wbits = Number(n & mask)
        n >>= shiftBy
        if (wbits > windowSize) {
          wbits -= maxNumber
          n += _1n
        }
        if (wbits === 0) {
          let pr = precomputes[offset]
          if (window % 2) pr = pr.negate()
          f = f.add(pr)
        } else {
          let cached = precomputes[offset + Math.abs(wbits) - 1]
          if (wbits < 0) cached = cached.negate()
          p = p.add(cached)
        }
      }
      return {p, f}
    }
    multiply(scalar, affinePoint) {
      let n = normalizeScalar(scalar)
      let point
      let fake
      if (USE_ENDOMORPHISM) {
        const {k1neg, k1, k2neg, k2} = splitScalarEndo(n)
        let {p: k1p, f: f1p} = this.wNAF(k1, affinePoint)
        let {p: k2p, f: f2p} = this.wNAF(k2, affinePoint)
        if (k1neg) k1p = k1p.negate()
        if (k2neg) k2p = k2p.negate()
        k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z)
        point = k1p.add(k2p)
        fake = f1p.add(f2p)
      } else {
        const {p, f} = this.wNAF(n, affinePoint)
        point = p
        fake = f
      }
      return JacobianPoint.normalizeZ([point, fake])[0]
    }
    toAffine(invZ = invert(this.z)) {
      const {x, y, z} = this
      const iz1 = invZ
      const iz2 = mod(iz1 * iz1)
      const iz3 = mod(iz2 * iz1)
      const ax = mod(x * iz2)
      const ay = mod(y * iz3)
      const zz = mod(z * iz1)
      if (zz !== _1n) throw new Error('invZ was invalid')
      return new Point(ax, ay)
    }
  }
  JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n)
  JacobianPoint.ZERO = new JacobianPoint(_0n, _1n, _0n)
  const pointPrecomputes = new WeakMap()
  class Point {
    constructor(x, y) {
      this.x = x
      this.y = y
    }
    _setWindowSize(windowSize) {
      this._WINDOW_SIZE = windowSize
      pointPrecomputes.delete(this)
    }
    static fromCompressedHex(bytes) {
      const isShort = bytes.length === 32
      const x = bytesToNumber(isShort ? bytes : bytes.subarray(1))
      if (!isValidFieldElement(x)) throw new Error('Point is not on curve')
      const y2 = weistrass(x)
      let y = sqrtMod(y2)
      const isYOdd = (y & _1n) === _1n
      if (isShort) {
        if (isYOdd) y = mod(-y)
      } else {
        const isFirstByteOdd = (bytes[0] & 1) === 1
        if (isFirstByteOdd !== isYOdd) y = mod(-y)
      }
      const point = new Point(x, y)
      point.assertValidity()
      return point
    }
    static fromUncompressedHex(bytes) {
      const x = bytesToNumber(bytes.subarray(1, 33))
      const y = bytesToNumber(bytes.subarray(33, 65))
      const point = new Point(x, y)
      point.assertValidity()
      return point
    }
    static fromHex(hex) {
      const bytes = ensureBytes(hex)
      const len = bytes.length
      const header = bytes[0]
      if (len === 32 || (len === 33 && (header === 0x02 || header === 0x03))) {
        return this.fromCompressedHex(bytes)
      }
      if (len === 65 && header === 0x04) return this.fromUncompressedHex(bytes)
      throw new Error(
        `Point.fromHex: received invalid point. Expected 32-33 compressed bytes or 65 uncompressed bytes, not ${len}`
      )
    }
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(normalizePrivateKey(privateKey))
    }
    static fromSignature(msgHash, signature, recovery) {
      msgHash = ensureBytes(msgHash)
      const h = truncateHash(msgHash)
      const {r, s} = normalizeSignature(signature)
      if (recovery !== 0 && recovery !== 1) {
        throw new Error('Cannot recover signature: invalid recovery bit')
      }
      const prefix = recovery & 1 ? '03' : '02'
      const R = Point.fromHex(prefix + numTo32bStr(r))
      const {n} = CURVE
      const rinv = invert(r, n)
      const u1 = mod(-h * rinv, n)
      const u2 = mod(s * rinv, n)
      const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2)
      if (!Q) throw new Error('Cannot recover signature: point at infinify')
      Q.assertValidity()
      return Q
    }
    toRawBytes(isCompressed = false) {
      return hexToBytes(this.toHex(isCompressed))
    }
    toHex(isCompressed = false) {
      const x = numTo32bStr(this.x)
      if (isCompressed) {
        const prefix = this.y & _1n ? '03' : '02'
        return `${prefix}${x}`
      } else {
        return `04${x}${numTo32bStr(this.y)}`
      }
    }
    toHexX() {
      return this.toHex(true).slice(2)
    }
    toRawX() {
      return this.toRawBytes(true).slice(1)
    }
    assertValidity() {
      const msg = 'Point is not on elliptic curve'
      const {x, y} = this
      if (!isValidFieldElement(x) || !isValidFieldElement(y))
        throw new Error(msg)
      const left = mod(y * y)
      const right = weistrass(x)
      if (mod(left - right) !== _0n) throw new Error(msg)
    }
    equals(other) {
      return this.x === other.x && this.y === other.y
    }
    negate() {
      return new Point(this.x, mod(-this.y))
    }
    double() {
      return JacobianPoint.fromAffine(this).double().toAffine()
    }
    add(other) {
      return JacobianPoint.fromAffine(this)
        .add(JacobianPoint.fromAffine(other))
        .toAffine()
    }
    subtract(other) {
      return this.add(other.negate())
    }
    multiply(scalar) {
      return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine()
    }
    multiplyAndAddUnsafe(Q, a, b) {
      const P = JacobianPoint.fromAffine(this)
      const aP =
        a === _0n || a === _1n || this !== Point.BASE
          ? P.multiplyUnsafe(a)
          : P.multiply(a)
      const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b)
      const sum = aP.add(bQ)
      return sum.equals(JacobianPoint.ZERO) ? undefined : sum.toAffine()
    }
  }
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy)
  Point.ZERO = new Point(_0n, _0n)
  function sliceDER(s) {
    return Number.parseInt(s[0], 16) >= 8 ? '00' + s : s
  }
  function parseDERInt(data) {
    if (data.length < 2 || data[0] !== 0x02) {
      throw new Error(`Invalid signature integer tag: ${bytesToHex(data)}`)
    }
    const len = data[1]
    const res = data.subarray(2, len + 2)
    if (!len || res.length !== len) {
      throw new Error(`Invalid signature integer: wrong length`)
    }
    if (res[0] === 0x00 && res[1] <= 0x7f) {
      throw new Error('Invalid signature integer: trailing length')
    }
    return {data: bytesToNumber(res), left: data.subarray(len + 2)}
  }
  function parseDERSignature(data) {
    if (data.length < 2 || data[0] != 0x30) {
      throw new Error(`Invalid signature tag: ${bytesToHex(data)}`)
    }
    if (data[1] !== data.length - 2) {
      throw new Error('Invalid signature: incorrect length')
    }
    const {data: r, left: sBytes} = parseDERInt(data.subarray(2))
    const {data: s, left: rBytesLeft} = parseDERInt(sBytes)
    if (rBytesLeft.length) {
      throw new Error(
        `Invalid signature: left bytes after parsing: ${bytesToHex(rBytesLeft)}`
      )
    }
    return {r, s}
  }
  class Signature {
    constructor(r, s) {
      this.r = r
      this.s = s
      this.assertValidity()
    }
    static fromCompact(hex) {
      const arr = isUint8a(hex)
      const name = 'Signature.fromCompact'
      if (typeof hex !== 'string' && !arr)
        throw new TypeError(`${name}: Expected string or Uint8Array`)
      const str = arr ? bytesToHex(hex) : hex
      if (str.length !== 128) throw new Error(`${name}: Expected 64-byte hex`)
      return new Signature(
        hexToNumber(str.slice(0, 64)),
        hexToNumber(str.slice(64, 128))
      )
    }
    static fromDER(hex) {
      const arr = isUint8a(hex)
      if (typeof hex !== 'string' && !arr)
        throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`)
      const {r, s} = parseDERSignature(arr ? hex : hexToBytes(hex))
      return new Signature(r, s)
    }
    static fromHex(hex) {
      return this.fromDER(hex)
    }
    assertValidity() {
      const {r, s} = this
      if (!isWithinCurveOrder(r))
        throw new Error('Invalid Signature: r must be 0 < r < n')
      if (!isWithinCurveOrder(s))
        throw new Error('Invalid Signature: s must be 0 < s < n')
    }
    hasHighS() {
      const HALF = CURVE.n >> _1n
      return this.s > HALF
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, CURVE.n - this.s) : this
    }
    toDERRawBytes(isCompressed = false) {
      return hexToBytes(this.toDERHex(isCompressed))
    }
    toDERHex(isCompressed = false) {
      const sHex = sliceDER(numberToHexUnpadded(this.s))
      if (isCompressed) return sHex
      const rHex = sliceDER(numberToHexUnpadded(this.r))
      const rLen = numberToHexUnpadded(rHex.length / 2)
      const sLen = numberToHexUnpadded(sHex.length / 2)
      const length = numberToHexUnpadded(rHex.length / 2 + sHex.length / 2 + 4)
      return `30${length}02${rLen}${rHex}02${sLen}${sHex}`
    }
    toRawBytes() {
      return this.toDERRawBytes()
    }
    toHex() {
      return this.toDERHex()
    }
    toCompactRawBytes() {
      return hexToBytes(this.toCompactHex())
    }
    toCompactHex() {
      return numTo32bStr(this.r) + numTo32bStr(this.s)
    }
  }
  function concatBytes(...arrays) {
    if (!arrays.every(isUint8a)) throw new Error('Uint8Array list expected')
    if (arrays.length === 1) return arrays[0]
    const length = arrays.reduce((a, arr) => a + arr.length, 0)
    const result = new Uint8Array(length)
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const arr = arrays[i]
      result.set(arr, pad)
      pad += arr.length
    }
    return result
  }
  function isUint8a(bytes) {
    return bytes instanceof Uint8Array
  }
  const hexes = Array.from({length: 256}, (v, i) =>
    i.toString(16).padStart(2, '0')
  )
  function bytesToHex(uint8a) {
    if (!(uint8a instanceof Uint8Array)) throw new Error('Expected Uint8Array')
    let hex = ''
    for (let i = 0; i < uint8a.length; i++) {
      hex += hexes[uint8a[i]]
    }
    return hex
  }
  function numTo32bStr(num) {
    if (num > POW_2_256) throw new Error('Expected number < 2^256')
    return num.toString(16).padStart(64, '0')
  }
  function numTo32b(num) {
    return hexToBytes(numTo32bStr(num))
  }
  function numberToHexUnpadded(num) {
    const hex = num.toString(16)
    return hex.length & 1 ? `0${hex}` : hex
  }
  function hexToNumber(hex) {
    if (typeof hex !== 'string') {
      throw new TypeError('hexToNumber: expected string, got ' + typeof hex)
    }
    return BigInt(`0x${hex}`)
  }
  function hexToBytes(hex) {
    if (typeof hex !== 'string') {
      throw new TypeError('hexToBytes: expected string, got ' + typeof hex)
    }
    if (hex.length % 2)
      throw new Error('hexToBytes: received invalid unpadded hex' + hex.length)
    const array = new Uint8Array(hex.length / 2)
    for (let i = 0; i < array.length; i++) {
      const j = i * 2
      const hexByte = hex.slice(j, j + 2)
      const byte = Number.parseInt(hexByte, 16)
      if (Number.isNaN(byte) || byte < 0)
        throw new Error('Invalid byte sequence')
      array[i] = byte
    }
    return array
  }
  function bytesToNumber(bytes) {
    return hexToNumber(bytesToHex(bytes))
  }
  function ensureBytes(hex) {
    return hex instanceof Uint8Array ? Uint8Array.from(hex) : hexToBytes(hex)
  }
  function normalizeScalar(num) {
    if (typeof num === 'number' && Number.isSafeInteger(num) && num > 0)
      return BigInt(num)
    if (typeof num === 'bigint' && isWithinCurveOrder(num)) return num
    throw new TypeError('Expected valid private scalar: 0 < scalar < curve.n')
  }
  function mod(a, b = CURVE.P) {
    const result = a % b
    return result >= _0n ? result : b + result
  }
  function pow2(x, power) {
    const {P} = CURVE
    let res = x
    while (power-- > _0n) {
      res *= res
      res %= P
    }
    return res
  }
  function sqrtMod(x) {
    const {P} = CURVE
    const _6n = BigInt(6)
    const _11n = BigInt(11)
    const _22n = BigInt(22)
    const _23n = BigInt(23)
    const _44n = BigInt(44)
    const _88n = BigInt(88)
    const b2 = (x * x * x) % P
    const b3 = (b2 * b2 * x) % P
    const b6 = (pow2(b3, _3n) * b3) % P
    const b9 = (pow2(b6, _3n) * b3) % P
    const b11 = (pow2(b9, _2n) * b2) % P
    const b22 = (pow2(b11, _11n) * b11) % P
    const b44 = (pow2(b22, _22n) * b22) % P
    const b88 = (pow2(b44, _44n) * b44) % P
    const b176 = (pow2(b88, _88n) * b88) % P
    const b220 = (pow2(b176, _44n) * b44) % P
    const b223 = (pow2(b220, _3n) * b3) % P
    const t1 = (pow2(b223, _23n) * b22) % P
    const t2 = (pow2(t1, _6n) * b2) % P
    return pow2(t2, _2n)
  }
  function invert(number, modulo = CURVE.P) {
    if (number === _0n || modulo <= _0n) {
      throw new Error(
        `invert: expected positive integers, got n=${number} mod=${modulo}`
      )
    }
    let a = mod(number, modulo)
    let b = modulo
    let x = _0n,
      u = _1n
    while (a !== _0n) {
      const q = b / a
      const r = b % a
      const m = x - u * q
      ;(b = a), (a = r), (x = u), (u = m)
    }
    const gcd = b
    if (gcd !== _1n) throw new Error('invert: does not exist')
    return mod(x, modulo)
  }
  function invertBatch(nums, p = CURVE.P) {
    const scratch = new Array(nums.length)
    const lastMultiplied = nums.reduce((acc, num, i) => {
      if (num === _0n) return acc
      scratch[i] = acc
      return mod(acc * num, p)
    }, _1n)
    const inverted = invert(lastMultiplied, p)
    nums.reduceRight((acc, num, i) => {
      if (num === _0n) return acc
      scratch[i] = mod(acc * scratch[i], p)
      return mod(acc * num, p)
    }, inverted)
    return scratch
  }
  const divNearest = (a, b) => (a + b / _2n) / b
  const POW_2_128 = _2n ** BigInt(128)
  function splitScalarEndo(k) {
    const {n} = CURVE
    const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15')
    const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3')
    const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8')
    const b2 = a1
    const c1 = divNearest(b2 * k, n)
    const c2 = divNearest(-b1 * k, n)
    let k1 = mod(k - c1 * a1 - c2 * a2, n)
    let k2 = mod(-c1 * b1 - c2 * b2, n)
    const k1neg = k1 > POW_2_128
    const k2neg = k2 > POW_2_128
    if (k1neg) k1 = n - k1
    if (k2neg) k2 = n - k2
    if (k1 > POW_2_128 || k2 > POW_2_128) {
      throw new Error('splitScalarEndo: Endomorphism failed, k=' + k)
    }
    return {k1neg, k1, k2neg, k2}
  }
  function truncateHash(hash) {
    const {n} = CURVE
    const byteLength = hash.length
    const delta = byteLength * 8 - 256
    let h = bytesToNumber(hash)
    if (delta > 0) h = h >> BigInt(delta)
    if (h >= n) h -= n
    return h
  }
  class HmacDrbg {
    constructor() {
      this.v = new Uint8Array(32).fill(1)
      this.k = new Uint8Array(32).fill(0)
      this.counter = 0
    }
    hmac(...values) {
      return utils.hmacSha256(this.k, ...values)
    }
    hmacSync(...values) {
      if (typeof utils.hmacSha256Sync !== 'function')
        throw new Error('utils.hmacSha256Sync is undefined, you need to set it')
      const res = utils.hmacSha256Sync(this.k, ...values)
      if (res instanceof Promise)
        throw new Error('To use sync sign(), ensure utils.hmacSha256 is sync')
      return res
    }
    incr() {
      if (this.counter >= 1000) {
        throw new Error('Tried 1,000 k values for sign(), all were invalid')
      }
      this.counter += 1
    }
    async reseed(seed = new Uint8Array()) {
      this.k = await this.hmac(this.v, Uint8Array.from([0x00]), seed)
      this.v = await this.hmac(this.v)
      if (seed.length === 0) return
      this.k = await this.hmac(this.v, Uint8Array.from([0x01]), seed)
      this.v = await this.hmac(this.v)
    }
    reseedSync(seed = new Uint8Array()) {
      this.k = this.hmacSync(this.v, Uint8Array.from([0x00]), seed)
      this.v = this.hmacSync(this.v)
      if (seed.length === 0) return
      this.k = this.hmacSync(this.v, Uint8Array.from([0x01]), seed)
      this.v = this.hmacSync(this.v)
    }
    async generate() {
      this.incr()
      this.v = await this.hmac(this.v)
      return this.v
    }
    generateSync() {
      this.incr()
      this.v = this.hmacSync(this.v)
      return this.v
    }
  }
  function isWithinCurveOrder(num) {
    return _0n < num && num < CURVE.n
  }
  function isValidFieldElement(num) {
    return _0n < num && num < CURVE.P
  }
  function kmdToSig(kBytes, m, d) {
    const k = bytesToNumber(kBytes)
    if (!isWithinCurveOrder(k)) return
    const {n} = CURVE
    const q = Point.BASE.multiply(k)
    const r = mod(q.x, n)
    if (r === _0n) return
    const s = mod(invert(k, n) * mod(m + d * r, n), n)
    if (s === _0n) return
    const sig = new Signature(r, s)
    const recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n)
    return {sig, recovery}
  }
  function normalizePrivateKey(key) {
    let num
    if (typeof key === 'bigint') {
      num = key
    } else if (
      typeof key === 'number' &&
      Number.isSafeInteger(key) &&
      key > 0
    ) {
      num = BigInt(key)
    } else if (typeof key === 'string') {
      if (key.length !== 64) throw new Error('Expected 32 bytes of private key')
      num = hexToNumber(key)
    } else if (isUint8a(key)) {
      if (key.length !== 32) throw new Error('Expected 32 bytes of private key')
      num = bytesToNumber(key)
    } else {
      throw new TypeError('Expected valid private key')
    }
    if (!isWithinCurveOrder(num))
      throw new Error('Expected private key: 0 < key < n')
    return num
  }
  function normalizePublicKey(publicKey) {
    if (publicKey instanceof Point) {
      publicKey.assertValidity()
      return publicKey
    } else {
      return Point.fromHex(publicKey)
    }
  }
  function normalizeSignature(signature) {
    if (signature instanceof Signature) {
      signature.assertValidity()
      return signature
    }
    try {
      return Signature.fromDER(signature)
    } catch (error) {
      return Signature.fromCompact(signature)
    }
  }
  function getPublicKey(privateKey, isCompressed = false) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed)
  }
  function recoverPublicKey(
    msgHash,
    signature,
    recovery,
    isCompressed = false
  ) {
    return Point.fromSignature(msgHash, signature, recovery).toRawBytes(
      isCompressed
    )
  }
  function isPub(item) {
    const arr = isUint8a(item)
    const str = typeof item === 'string'
    const len = (arr || str) && item.length
    if (arr) return len === 33 || len === 65
    if (str) return len === 66 || len === 130
    if (item instanceof Point) return true
    return false
  }
  function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isPub(privateA))
      throw new TypeError('getSharedSecret: first arg must be private key')
    if (!isPub(publicB))
      throw new TypeError('getSharedSecret: second arg must be public key')
    const b = normalizePublicKey(publicB)
    b.assertValidity()
    return b.multiply(normalizePrivateKey(privateA)).toRawBytes(isCompressed)
  }
  function bits2int(bytes) {
    const slice = bytes.length > 32 ? bytes.slice(0, 32) : bytes
    return bytesToNumber(slice)
  }
  function bits2octets(bytes) {
    const z1 = bits2int(bytes)
    const z2 = mod(z1, CURVE.n)
    return int2octets(z2 < _0n ? z1 : z2)
  }
  function int2octets(num) {
    if (typeof num !== 'bigint') throw new Error('Expected bigint')
    const hex = numTo32bStr(num)
    return hexToBytes(hex)
  }
  function initSigArgs(msgHash, privateKey, extraEntropy) {
    if (msgHash == null)
      throw new Error(`sign: expected valid message hash, not "${msgHash}"`)
    const h1 = ensureBytes(msgHash)
    const d = normalizePrivateKey(privateKey)
    const seedArgs = [int2octets(d), bits2octets(h1)]
    if (extraEntropy != null) {
      if (extraEntropy === true) extraEntropy = utils.randomBytes(32)
      const e = ensureBytes(extraEntropy)
      if (e.length !== 32)
        throw new Error('sign: Expected 32 bytes of extra data')
      seedArgs.push(e)
    }
    const seed = concatBytes(...seedArgs)
    const m = bits2int(h1)
    return {seed, m, d}
  }
  function finalizeSig(recSig, opts) {
    let {sig, recovery} = recSig
    const {canonical, der, recovered} = Object.assign(
      {canonical: true, der: true},
      opts
    )
    if (canonical && sig.hasHighS()) {
      sig = sig.normalizeS()
      recovery ^= 1
    }
    const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes()
    return recovered ? [hashed, recovery] : hashed
  }
  async function sign(msgHash, privKey, opts = {}) {
    const {seed, m, d} = initSigArgs(msgHash, privKey, opts.extraEntropy)
    let sig
    const drbg = new HmacDrbg()
    await drbg.reseed(seed)
    while (!(sig = kmdToSig(await drbg.generate(), m, d))) await drbg.reseed()
    return finalizeSig(sig, opts)
  }
  function signSync(msgHash, privKey, opts = {}) {
    const {seed, m, d} = initSigArgs(msgHash, privKey, opts.extraEntropy)
    let sig
    const drbg = new HmacDrbg()
    drbg.reseedSync(seed)
    while (!(sig = kmdToSig(drbg.generateSync(), m, d))) drbg.reseedSync()
    return finalizeSig(sig, opts)
  }
  const vopts = {strict: true}
  function verify(signature, msgHash, publicKey, opts = vopts) {
    let sig
    try {
      sig = normalizeSignature(signature)
      msgHash = ensureBytes(msgHash)
    } catch (error) {
      return false
    }
    const {r, s} = sig
    if (opts.strict && sig.hasHighS()) return false
    const h = truncateHash(msgHash)
    let P
    try {
      P = normalizePublicKey(publicKey)
    } catch (error) {
      return false
    }
    const {n} = CURVE
    const sinv = invert(s, n)
    const u1 = mod(h * sinv, n)
    const u2 = mod(r * sinv, n)
    const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)
    if (!R) return false
    const v = mod(R.x, n)
    return v === r
  }
  function finalizeSchnorrChallenge(ch) {
    return mod(bytesToNumber(ch), CURVE.n)
  }
  function hasEvenY(point) {
    return (point.y & _1n) === _0n
  }
  class SchnorrSignature {
    constructor(r, s) {
      this.r = r
      this.s = s
      this.assertValidity()
    }
    static fromHex(hex) {
      const bytes = ensureBytes(hex)
      if (bytes.length !== 64)
        throw new TypeError(
          `SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`
        )
      const r = bytesToNumber(bytes.subarray(0, 32))
      const s = bytesToNumber(bytes.subarray(32, 64))
      return new SchnorrSignature(r, s)
    }
    assertValidity() {
      const {r, s} = this
      if (!isValidFieldElement(r) || !isWithinCurveOrder(s))
        throw new Error('Invalid signature')
    }
    toHex() {
      return numTo32bStr(this.r) + numTo32bStr(this.s)
    }
    toRawBytes() {
      return hexToBytes(this.toHex())
    }
  }
  function schnorrGetPublicKey(privateKey) {
    return Point.fromPrivateKey(privateKey).toRawX()
  }
  function initSchnorrSigArgs(message, privateKey, auxRand) {
    if (message == null)
      throw new TypeError(`sign: Expected valid message, not "${message}"`)
    const m = ensureBytes(message)
    const d0 = normalizePrivateKey(privateKey)
    const rand = ensureBytes(auxRand)
    if (rand.length !== 32)
      throw new TypeError('sign: Expected 32 bytes of aux randomness')
    const P = Point.fromPrivateKey(d0)
    const px = P.toRawX()
    const d = hasEvenY(P) ? d0 : CURVE.n - d0
    return {m, P, px, d, rand}
  }
  function initSchnorrNonce(d, t0h) {
    return numTo32b(d ^ bytesToNumber(t0h))
  }
  function finalizeSchnorrNonce(k0h) {
    const k0 = mod(bytesToNumber(k0h), CURVE.n)
    if (k0 === _0n)
      throw new Error('sign: Creation of signature failed. k is zero')
    const R = Point.fromPrivateKey(k0)
    const rx = R.toRawX()
    const k = hasEvenY(R) ? k0 : CURVE.n - k0
    return {R, rx, k}
  }
  function finalizeSchnorrSig(R, k, e, d) {
    return new SchnorrSignature(R.x, mod(k + e * d, CURVE.n)).toRawBytes()
  }
  async function schnorrSign(
    message,
    privateKey,
    auxRand = utils.randomBytes()
  ) {
    const {m, px, d, rand} = initSchnorrSigArgs(message, privateKey, auxRand)
    const t = initSchnorrNonce(d, await utils.taggedHash(TAGS.aux, rand))
    const {R, rx, k} = finalizeSchnorrNonce(
      await utils.taggedHash(TAGS.nonce, t, px, m)
    )
    const e = finalizeSchnorrChallenge(
      await utils.taggedHash(TAGS.challenge, rx, px, m)
    )
    const sig = finalizeSchnorrSig(R, k, e, d)
    const isValid = await schnorrVerify(sig, m, px)
    if (!isValid) throw new Error('sign: Invalid signature produced')
    return sig
  }
  function schnorrSignSync(message, privateKey, auxRand = utils.randomBytes()) {
    const {m, px, d, rand} = initSchnorrSigArgs(message, privateKey, auxRand)
    const t = initSchnorrNonce(d, utils.taggedHashSync(TAGS.aux, rand))
    const {R, rx, k} = finalizeSchnorrNonce(
      utils.taggedHashSync(TAGS.nonce, t, px, m)
    )
    const e = finalizeSchnorrChallenge(
      utils.taggedHashSync(TAGS.challenge, rx, px, m)
    )
    const sig = finalizeSchnorrSig(R, k, e, d)
    const isValid = schnorrVerifySync(sig, m, px)
    if (!isValid) throw new Error('sign: Invalid signature produced')
    return sig
  }
  function initSchnorrVerify(signature, message, publicKey) {
    const raw = signature instanceof SchnorrSignature
    const sig = raw ? signature : SchnorrSignature.fromHex(signature)
    if (raw) sig.assertValidity()
    return {
      ...sig,
      m: ensureBytes(message),
      P: normalizePublicKey(publicKey)
    }
  }
  function finalizeSchnorrVerify(r, P, s, e) {
    const R = Point.BASE.multiplyAndAddUnsafe(
      P,
      normalizePrivateKey(s),
      mod(-e, CURVE.n)
    )
    if (!R || !hasEvenY(R) || R.x !== r) return false
    return true
  }
  async function schnorrVerify(signature, message, publicKey) {
    try {
      const {r, s, m, P} = initSchnorrVerify(signature, message, publicKey)
      const e = finalizeSchnorrChallenge(
        await utils.taggedHash(TAGS.challenge, numTo32b(r), P.toRawX(), m)
      )
      return finalizeSchnorrVerify(r, P, s, e)
    } catch (error) {
      return false
    }
  }
  function schnorrVerifySync(signature, message, publicKey) {
    try {
      const {r, s, m, P} = initSchnorrVerify(signature, message, publicKey)
      const e = finalizeSchnorrChallenge(
        utils.taggedHashSync(TAGS.challenge, numTo32b(r), P.toRawX(), m)
      )
      return finalizeSchnorrVerify(r, P, s, e)
    } catch (error) {
      return false
    }
  }
  const schnorr = {
    Signature: SchnorrSignature,
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    signSync: schnorrSignSync,
    verifySync: schnorrVerifySync
  }
  Point.BASE._setWindowSize(8)
  const crypto = {
    node: nodeCrypto,
    web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined
  }
  const TAGS = {
    challenge: 'BIP0340/challenge',
    aux: 'BIP0340/aux',
    nonce: 'BIP0340/nonce'
  }
  const TAGGED_HASH_PREFIXES = {}
  const utils = {
    isValidPrivateKey(privateKey) {
      try {
        normalizePrivateKey(privateKey)
        return true
      } catch (error) {
        return false
      }
    },
    privateAdd: (privateKey, tweak) => {
      const p = normalizePrivateKey(privateKey)
      const t = normalizePrivateKey(tweak)
      return numTo32b(mod(p + t, CURVE.n))
    },
    privateNegate: privateKey => {
      const p = normalizePrivateKey(privateKey)
      return numTo32b(CURVE.n - p)
    },
    pointAddScalar: (p, tweak, isCompressed) => {
      const P = Point.fromHex(p)
      const t = normalizePrivateKey(tweak)
      const Q = Point.BASE.multiplyAndAddUnsafe(P, t, _1n)
      if (!Q) throw new Error('Tweaked point at infinity')
      return Q.toRawBytes(isCompressed)
    },
    pointMultiply: (p, tweak, isCompressed) => {
      const P = Point.fromHex(p)
      const t = bytesToNumber(ensureBytes(tweak))
      return P.multiply(t).toRawBytes(isCompressed)
    },
    hashToPrivateKey: hash => {
      hash = ensureBytes(hash)
      if (hash.length < 40 || hash.length > 1024)
        throw new Error('Expected 40-1024 bytes of private key as per FIPS 186')
      const num = mod(bytesToNumber(hash), CURVE.n - _1n) + _1n
      return numTo32b(num)
    },
    randomBytes: (bytesLength = 32) => {
      if (crypto.web) {
        return crypto.web.getRandomValues(new Uint8Array(bytesLength))
      } else if (crypto.node) {
        const {randomBytes} = crypto.node
        return Uint8Array.from(randomBytes(bytesLength))
      } else {
        throw new Error("The environment doesn't have randomBytes function")
      }
    },
    randomPrivateKey: () => {
      return utils.hashToPrivateKey(utils.randomBytes(40))
    },
    bytesToHex,
    hexToBytes,
    concatBytes,
    mod,
    invert,
    sha256: async (...messages) => {
      if (crypto.web) {
        const buffer = await crypto.web.subtle.digest(
          'SHA-256',
          concatBytes(...messages)
        )
        return new Uint8Array(buffer)
      } else if (crypto.node) {
        const {createHash} = crypto.node
        const hash = createHash('sha256')
        messages.forEach(m => hash.update(m))
        return Uint8Array.from(hash.digest())
      } else {
        throw new Error("The environment doesn't have sha256 function")
      }
    },
    hmacSha256: async (key, ...messages) => {
      if (crypto.web) {
        const ckey = await crypto.web.subtle.importKey(
          'raw',
          key,
          {name: 'HMAC', hash: {name: 'SHA-256'}},
          false,
          ['sign']
        )
        const message = concatBytes(...messages)
        const buffer = await crypto.web.subtle.sign('HMAC', ckey, message)
        return new Uint8Array(buffer)
      } else if (crypto.node) {
        const {createHmac} = crypto.node
        const hash = createHmac('sha256', key)
        messages.forEach(m => hash.update(m))
        return Uint8Array.from(hash.digest())
      } else {
        throw new Error("The environment doesn't have hmac-sha256 function")
      }
    },
    sha256Sync: undefined,
    hmacSha256Sync: undefined,
    taggedHash: async (tag, ...messages) => {
      let tagP = TAGGED_HASH_PREFIXES[tag]
      if (tagP === undefined) {
        const tagH = await utils.sha256(
          Uint8Array.from(tag, c => c.charCodeAt(0))
        )
        tagP = concatBytes(tagH, tagH)
        TAGGED_HASH_PREFIXES[tag] = tagP
      }
      return utils.sha256(tagP, ...messages)
    },
    taggedHashSync: (tag, ...messages) => {
      if (typeof utils.sha256Sync !== 'function')
        throw new Error('utils.sha256Sync is undefined, you need to set it')
      let tagP = TAGGED_HASH_PREFIXES[tag]
      if (tagP === undefined) {
        const tagH = utils.sha256Sync(
          Uint8Array.from(tag, c => c.charCodeAt(0))
        )
        tagP = concatBytes(tagH, tagH)
        TAGGED_HASH_PREFIXES[tag] = tagP
      }
      return utils.sha256Sync(tagP, ...messages)
    },
    precompute(windowSize = 8, point = Point.BASE) {
      const cached = point === Point.BASE ? point : new Point(point.x, point.y)
      cached._setWindowSize(windowSize)
      cached.multiply(_3n)
      return cached
    }
  }

  exports.CURVE = CURVE
  exports.Point = Point
  exports.Signature = Signature
  exports.getPublicKey = getPublicKey
  exports.getSharedSecret = getSharedSecret
  exports.recoverPublicKey = recoverPublicKey
  exports.schnorr = schnorr
  exports.sign = sign
  exports.signSync = signSync
  exports.utils = utils
  exports.verify = verify

  Object.defineProperty(exports, '__esModule', {value: true})
})
