package com.glroland.pong.server;

import java.io.IOException;

import org.infinispan.notifications.Listener;
import org.infinispan.notifications.cachelistener.annotation.CacheEntryCreated;
import org.infinispan.notifications.cachelistener.event.CacheEntryCreatedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@Listener
public class SocketTextHandler extends TextWebSocketHandler {

    @Autowired
    private GameCache cache;

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {

		String payload = message.getPayload();
        System.out.println("Payload - " + payload);
//		session.sendMessage(new TextMessage("Hi, how may we help you?"));
	}

    @CacheEntryCreated
    public void print(CacheEntryCreatedEvent event) {
      System.out.println("New entry " + event.getKey() + " created in the cache");
    }
}
