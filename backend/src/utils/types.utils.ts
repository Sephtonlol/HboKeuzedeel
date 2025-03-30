import { ObjectId } from "mongodb";

export const checkString = (input: any): boolean => {
  if (!input || typeof input !== "string" || input.trim().length === 0)
    return false;
  return true;
};

export const checkObjectId = (input: any): boolean => {
  if (!input || typeof input !== "string" || !ObjectId.isValid(input))
    return false;
  return true;
};

export const checkRoomId = (input: any): boolean => {
  if (
    !input ||
    typeof input !== "string" ||
    input.trim().length !== Number(process.env.ROOM_ID_LENGTH)
  )
    return false;
  return true;
};

export const checkPublic = (input: any): boolean => {
  if (typeof input !== "boolean") return false;
  return true;
};
