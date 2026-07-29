export const getRandomNumber = (min = 0, max = 1) => {
  const randomValues = new Uint32Array(1)

  globalThis.crypto.getRandomValues(randomValues)

  return min + (randomValues[0] / 0x1_0000_0000) * (max - min)
}
