/**
 * Valida un id estilo ObjectId 24-hex, sin importar el driver (seguro en cliente).
 */
const HEX_24 = /^[a-f0-9]{24}$/i;

export function isValidObjectIdString(id: string): boolean {
  return HEX_24.test(id);
}
