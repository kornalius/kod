window.ObjectProxy = () => {
  let o = new Proxy(new Object(...arguments), {
    get: (target, prop) => {
      return target[prop]
    },
    set: (target, prop, value) => {
      target[prop] = value
    }
  })
  return o
}

window.ArrayProxy = () => {
  let o = new Proxy(new Array(...arguments), {
    get: (target, prop) => {
      if (_.isNumber(prop)) {
        return target._items[prop]
      }
      return target[prop]
    },
    set: (target, prop, value) => {
      if (_.isNumber(prop)) {
        target._items[prop] = value
      }
      else if (prop === 'length') {
        target[prop] = Math.min(10000, value)
      }
      else {
        target[prop] = value
      }
    }
  })
  return o
}
