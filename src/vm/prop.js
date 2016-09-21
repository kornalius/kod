
export var define_property

define_property = (object, name, mem, offset, type) => {
  Object.defineProperty(object, name, {
    enumerable: true,
    get: () => mem.read(type, offset),
    set: value => mem.write(type, offset, value),
  })
}
