"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryType,
  useApartnerTalkContext,
} from "@/contexts/ApartnerTalkContext";
import { MessageSquare, Flag, Wrench, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CategorySelection: React.FC = () => {
  const {
    category,
    setCategory,
    startChat,
    showChatHistory,
    hasActiveChat,
    activeChat,
    checkActiveChats,
    enterActiveChat,
    closeCurrentChat,
  } = useApartnerTalkContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // 컴포넌트 마운트 시 활성화된 채팅방 확인
  useEffect(() => {
    checkActiveChats();
  }, [checkActiveChats]);

  const categories: {
    type: CategoryType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { type: "민원", label: "민원", icon: <Flag className="h-5 w-5" /> },
    {
      type: "건의사항",
      label: "건의사항",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      type: "수리/정비",
      label: "수리/정비",
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      type: "보안/안전",
      label: "보안/안전",
      icon: <Shield className="h-5 w-5" />,
    },
  ];

  const handleStartChat = () => {
    if (category) {
      setIsLoading(true);
      Promise.resolve(startChat()).finally(() => setIsLoading(false));
    }
  };

  const handleEnterActiveChat = () => {
    setIsLoading(true);
    Promise.resolve(enterActiveChat()).finally(() => setIsLoading(false));
  };

  const handleCloseChatRequest = () => {
    setShowCloseConfirm(true);
  };

  const handleCloseChat = () => {
    setIsLoading(true);
    Promise.resolve(closeCurrentChat())
      .then(() => {
        setShowCloseConfirm(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">아파트너톡</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          쉽지만 완벽하게, 아파트관리는 아파트너
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasActiveChat && activeChat ? (
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700">
              진행 중인 문의가 있습니다
            </AlertTitle>
            <AlertDescription className="text-sm">
              <p className="mb-2">
                {activeChat.category} 관련 문의({activeChat.title})가 이미 진행
                중입니다. 새로운 문의를 시작하기 전에 기존 문의를 종료해주세요.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleEnterActiveChat}
                  disabled={isLoading}
                >
                  진행 중인 대화로 이동
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseChatRequest}
                  disabled={isLoading}
                >
                  대화 종료
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-center">
              궁금하거나 불편한 점이 있으시면 언제든지 문의해주세요.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Button
                  key={cat.type}
                  variant={category === cat.type ? "default" : "outline"}
                  className={`h-20 flex flex-col justify-center items-center transition-all ${
                    category === cat.type
                      ? "bg-pink-500 hover:bg-pink-600"
                      : "hover:border-pink-500"
                  }`}
                  onClick={() => setCategory(cat.type)}
                >
                  {cat.icon}
                  <span className="mt-1">{cat.label}</span>
                </Button>
              ))}
            </div>

            <Button
              className="w-full mt-6 bg-pink-500 hover:bg-pink-600"
              disabled={!category || isLoading}
              onClick={handleStartChat}
            >
              문의하기
            </Button>
          </>
        )}

        <Button
          className="w-full"
          variant="outline"
          disabled={isLoading}
          onClick={showChatHistory}
        >
          모든 메시지 보기
        </Button>

        {showCloseConfirm && (
          <Alert className="bg-red-50 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700">
              정말 대화를 종료하시겠습니까?
            </AlertTitle>
            <AlertDescription className="text-sm">
              <p className="mb-2">
                대화가 종료되면 더 이상 메시지를 보낼 수 없으며, 새로운 문의를
                시작할 수 있습니다. 종료된 대화는 다시 활성화할 수 없습니다.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleCloseChat}
                  disabled={isLoading}
                >
                  대화 종료
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCloseConfirm(false)}
                  disabled={isLoading}
                >
                  취소
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySelection;
