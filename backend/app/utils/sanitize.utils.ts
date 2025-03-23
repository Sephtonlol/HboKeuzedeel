import { Participant, Room } from "../../interfaces/rooms.interface";

export const sanitizeRooms = (fetchedRooms: Room[]): any[] => {
  return fetchedRooms.map((room) => {
    const sortedParticipants = room.participants.sort(
      (a: Participant, b: Participant) => b.score - a.score
    );

    return {
      ...room,
      host: undefined,
      participants: sortedParticipants.map(({ token, ...rest }) => rest),
    };
  });
};

export const sanitizeRoom = (room: Room): any => {
  const sortedParticipants = room.participants.sort(
    (a, b) => b.score - a.score
  );

  return {
    ...room,
    host: undefined,
    participants: sortedParticipants.map(({ token, ...rest }) => rest),
  };
};
