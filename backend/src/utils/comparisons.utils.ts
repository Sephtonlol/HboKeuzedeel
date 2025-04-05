export const cleanString = (str: string) =>
  str.toLowerCase().replace(/[\s.,]+/g, "");

export const compare = (str1: any, str2: any): boolean => {
  if (cleanString(str1.toString()) !== cleanString(str2.toString())) {
    return false;
  }
  return true;
};
