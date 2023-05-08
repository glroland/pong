package com.glroland.pong.backend;

import java.net.URI;
import java.time.ZonedDateTime;

import io.cloudevents.CloudEvent;
import io.cloudevents.core.message.MessageReader;
import io.cloudevents.core.message.MessageWriter;
import io.cloudevents.core.v1.CloudEventBuilder;
import io.cloudevents.http.HttpMessageFactory;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@ApplicationScoped
public class CloudEventsService {

    private static final Logger log =  LoggerFactory.getLogger(CloudEventsService.class);

    @ConfigProperty(name = "pong.event.active", defaultValue = "false")
    private Boolean eventActive;

    @ConfigProperty(name="pong.event.brokerUrl")
    private String eventBrokerUrl;

    @ConfigProperty(name="pong.event.type")
    private String eventType;

    public void sendEvent(PongEvent payload) {

        ObjectMapper objectMapper = new ObjectMapper();
        String data = null;
        try
        {
            data = objectMapper.writeValueAsString(payload);
        }
        catch (JsonProcessingException e)
        {
            log.error("Caught exception while converting pojo to JSON", e);
            throw new RuntimeException(e);
        }

        if (eventActive)
        {
            log.info("Send Event Request for JSON object: " + data);
        }
        else
        {
            log.info("Event publishing is disabled.  Skipping send.  " + data);
            return;
        }

        CloudEvent ceToSend = new CloudEventBuilder()
        .withId("my-id")
        .withSource(URI.create("/pong/backend"))
        .withType(eventType)
        .withDataContentType("application/json")
        .withData(data.getBytes(StandardCharsets.UTF_8))
        .build();

        log.debug("Sending Cloud Event: " + ceToSend);

        HttpURLConnection httpUrlConnection = null;
        try
        {

            URL url = new URL(eventBrokerUrl);
            httpUrlConnection = (HttpURLConnection) url.openConnection();
            httpUrlConnection.setRequestMethod("POST");
            httpUrlConnection.setDoOutput(true);
            httpUrlConnection.setDoInput(false);
        }
        catch(IOException e)
        {
            log.error("Caught IOException while connecting to cloud events broker", e);
            throw new RuntimeException(e);     
        }

        MessageWriter messageWriter = createMessageWriter(httpUrlConnection);
        Object result = messageWriter.writeBinary(ceToSend);
        log.info("Sent message, Result = " + result);
    }

    private static MessageWriter createMessageWriter(HttpURLConnection httpUrlConnection) {
        return HttpMessageFactory.createWriter(
            httpUrlConnection::setRequestProperty,
            body -> {
                try {
                    if (body != null) {
                        httpUrlConnection.setRequestProperty("content-length", String.valueOf(body.length));
                        try (OutputStream outputStream = httpUrlConnection.getOutputStream()) {
                            outputStream.write(body);
                        }
                    } else {
                        httpUrlConnection.setRequestProperty("content-length", "0");
                    }
                } catch (IOException t) {
                    log.error("Caught Exception while creating writer", t);
                    throw new UncheckedIOException(t);
                }
            });
    }
}
