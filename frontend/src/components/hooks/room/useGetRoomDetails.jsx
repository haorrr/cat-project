import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useGetRoomDetails = (id) => {
  return useQuery({
    queryKey: ['room', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/rooms/${id}`);
      return data.data.room;
    },
    enabled: !!id
  });
};
