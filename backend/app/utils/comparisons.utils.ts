const cleanString = (str: string) => str.toLowerCase().replace(/[\s.,]+/g, "");

export const compareString = (str1: string, str2: string): boolean => {
  if (cleanString(str1) !== cleanString(str2)) {
    return false;
  }
  return true;
};
