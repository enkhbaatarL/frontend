class Adapter<FROM, TO> {
  private readonly converter: (data: FROM) => TO

  constructor(converter: (data: FROM) => TO) {
    this.converter = converter
  }

  convert(data: FROM): TO {
    return this.converter(data)
  }
}

export default Adapter
