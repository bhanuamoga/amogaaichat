import { ChatWindow } from "@/components/chat/ChatWindow";

interface IndexProps {
  params: Promise<{ id: string }>;
}

export default async function Home({ params }: IndexProps) {
  const chatId = (await params).id;

  return (
    <div className="mx-auto">
      {/* <AIOptions /> */}
      <ChatWindow
        key={chatId} // Force remount when chatId changes
        endpoint="/api/chat"
        emoji="🏴‍☠️"
        placeholder="Enter prompt..."
        chatId={chatId}
      />
    </div>
  );
}
