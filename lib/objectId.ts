import { ObjectId } from "mongodb";
import { isValidObjectIdString as isHex24 } from "@/lib/objectIdString";

/** 24-char hex ObjectId string (strict). */
export function isValidObjectIdString(id: string): boolean {
  return isHex24(id) && ObjectId.isValid(id);
}

export function toObjectId(id: string): ObjectId {
  if (!isValidObjectIdString(id)) throw new Error("Invalid id");
  return new ObjectId(id);
}
