import type { SpecialtyKey } from "@/types/domain";

export function getSpecialtyLabel(key: SpecialtyKey): string {
  switch (key) {
    case "QUALITY":
      return "Calidad";
    case "SAFETY":
      return "Seguridad";
    case "PRODUCTION":
      return "Producción";
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

