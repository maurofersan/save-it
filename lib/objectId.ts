import { ObjectId } from "mongodb";

/** 24-char hex ObjectId string (strict). */
export function isValidObjectIdString(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id) && ObjectId.isValid(id);
}

export function toObjectId(id: string): ObjectId {
  if (!isValidObjectIdString(id)) throw new Error("Invalid id");
  return new ObjectId(id);
}
