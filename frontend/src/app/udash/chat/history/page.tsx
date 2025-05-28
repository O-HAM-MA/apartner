"use client";
import { useEffect, useState } from "react";
import { getUserChatrooms } from "@/utils/api";
import { useApartnerTalkContext } from "@/contexts/ApartnerTalkContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ChatHistoryPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const { enterChatroomById } = useApartnerTalkContext();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const allRooms = await getUserChatrooms();
      // 생성시간 내림차순 정렬
      allRooms.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRooms(allRooms);
    })();
  }, []);

  const handleEnterRoom = async (roomId: number) => {
    // 쿼리 파라미터를 통해 채팅방 ID 전달
    router.push(`/udash/chat?roomId=${roomId}`);
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white border rounded shadow p-2 max-h-[70vh] overflow-y-auto">
        {rooms.length === 0 && (
          <div className="text-gray-400">채팅방이 없습니다.</div>
        )}
        {rooms.map((room) => (
          <Button
            key={room.id}
            className="w-full mb-1 justify-between flex"
            variant="ghost"
            onClick={() => handleEnterRoom(room.id)}
          >
            <span>
              [{room.category}] {room.title}
            </span>
            <span className="text-xs text-gray-400">
              {room.createdAt && new Date(room.createdAt).toLocaleString()}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
