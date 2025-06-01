package com.ohammer.apartner.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

// STOMP(WebSocket) 설정을 담당하는 클래스
// 클라이언트와 서버 간 실시간 메시징을 위한 엔드포인트와 브로커를 설정한다.
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트가 WebSocket으로 연결할 엔드포인트를 등록한다. (ex: ws://서버주소/stomp/chats)
        registry.addEndpoint("/stomp/chats") // 웹소켓 엔드포인트 등록
               .setAllowedOriginPatterns("http://localhost:3000", "https://www.apartner.site") // CORS 설정 추가
               .withSockJS(); // SockJS 지원 추가 (폴백 메커니즘)
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 서버로 메시지를 보낼 때 사용하는 prefix (ex: /pub/xxx)
        registry.setApplicationDestinationPrefixes("/pub"); // 메시지 발행 요청
        // 서버가 클라이언트에게 메시지를 전달할 때 사용하는 prefix (ex: /sub/xxx)
        registry.enableSimpleBroker("/sub"); // 메시지 구독 요청
    }
}
