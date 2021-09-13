const randomBase32 = () => (Math.random()).toString(32).substr(2)

export const genId = (prefix = 'q') => `${prefix}-${randomBase32()}`
