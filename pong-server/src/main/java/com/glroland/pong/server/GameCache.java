package com.glroland.pong.server;

import org.infinispan.manager.EmbeddedCacheManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class GameCache {
    
    private final EmbeddedCacheManager cacheManager;

    @Autowired
    public GameCache(EmbeddedCacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

}
