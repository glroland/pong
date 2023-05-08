package com.glroland.pong.backend;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

@ServerEndpoint("/game/{gameId}")         
@ApplicationScoped
public class PongSocket {

    @Inject
    private CloudEventsService cloudEventsService;

    Map<String, Session> sessions = new ConcurrentHashMap<>(); 

    @OnOpen
    public void onOpen(Session session, @PathParam("gameId") String gameId) {
        sessions.put(gameId, session);
    }

    @OnClose
    public void onClose(Session session, @PathParam("gameId") String gameId) {
        sessions.remove(gameId);
        broadcast("Game " + gameId + " ended");
    }

    @OnError
    public void onError(Session session, @PathParam("gameId") String gameId, Throwable throwable) {
        sessions.remove(gameId);
        broadcast("Game " + gameId + " ended due to error: " + throwable);
    }

    @OnMessage
    public void onMessage(String message, @PathParam("gameId") String gameId) {
        System.out.println("Payload - " + message);
        broadcast(message);

        ObjectMapper mapper = new ObjectMapper();
        PongEvent payload = null;
        try {
            payload = mapper.readValue(message, PongEvent.class);
        } catch (JsonProcessingException e) {
             e.printStackTrace();
        }
        cloudEventsService.sendEvent(payload);
    }

    private void broadcast(String message) {
//        sessions.values().forEach(s -> {
//            s.getAsyncRemote().sendObject(message, result ->  {
//                if (result.getException() != null) {
//                    System.out.println("Unable to send message: " + result.getException());
//                }
//            });
//        });
    }

}
