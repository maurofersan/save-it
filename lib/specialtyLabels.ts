import type { SpecialtyKey } from "@/types/domain";

export function getSpecialtyLabel(key: SpecialtyKey): string {
  switch (key) {
    case "QUALITY":
      return "Calidad";
    case "SAFETY":
      return "Seguridad";
    case "PRODUCTION":
      return "Producción";
    default:
      // Fallback para catálogos configurables en Mongo.
      return String(key);
  }
}

